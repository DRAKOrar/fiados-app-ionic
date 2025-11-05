import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { Cliente } from '../models/cliente.model';
import { Deuda } from '../models/deuda.model';
import { Abono } from '../models/abono.model';
import { ProductoItem } from '../models/producto-item.model';

@Injectable({
  providedIn: 'root'
})
export class DeudasService {

  constructor(private storage: StorageService) {}

  // ========== CLIENTES ==========
  async crearCliente(nombre: string, telefono?: string, direccion?: string): Promise<Cliente> {
    const cliente: Cliente = {
      id: this.generarId(),
      nombre,
      telefono,
      direccion,
      fechaRegistro: new Date().toISOString(),
      saldoTotal: 0
    };
    await this.storage.agregarCliente(cliente);
    return cliente;
  }

  async obtenerClientes(): Promise<Cliente[]> {
    return await this.storage.getClientes();
  }

  async obtenerClientePorId(id: string): Promise<Cliente | undefined> {
    return await this.storage.getClientePorId(id);
  }

  async actualizarSaldoCliente(clienteId: string): Promise<void> {
    const deudas = await this.storage.getDeudasPorCliente(clienteId);
    const saldoTotal = deudas
      .filter(d => d.estado === 'pendiente')
      .reduce((sum, d) => sum + d.saldoPendiente, 0);

    const cliente = await this.storage.getClientePorId(clienteId);
    if (cliente) {
      cliente.saldoTotal = saldoTotal;
      await this.storage.actualizarCliente(cliente);
    }
  }

  // ========== DEUDAS ==========
  async crearDeuda(
    clienteId: string,
    productos: ProductoItem[],
    notas?: string
  ): Promise<Deuda> {
    const cliente = await this.storage.getClientePorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

    const deuda: Deuda = {
      id: this.generarId(),
      clienteId,
      clienteNombre: cliente.nombre,
      fecha: new Date().toISOString(),
      productos,
      total,
      saldoPendiente: total,
      estado: 'pendiente',
      notas
    };

    await this.storage.agregarDeuda(deuda);
    await this.actualizarSaldoCliente(clienteId);

    return deuda;
  }

  async obtenerDeudas(): Promise<Deuda[]> {
    return await this.storage.getDeudas();
  }

  async obtenerDeudasPendientes(): Promise<Deuda[]> {
    const deudas = await this.storage.getDeudas();
    return deudas.filter(d => d.estado === 'pendiente');
  }

  async obtenerDeudasPorCliente(clienteId: string): Promise<Deuda[]> {
    return await this.storage.getDeudasPorCliente(clienteId);
  }

   // AGREGAR ESTE MÉTODO NUEVO ⬇️
  async obtenerDeudaPorId(id: string): Promise<Deuda | undefined> {
    return await this.storage.getDeudaPorId(id);
  }

  // ========== ABONOS ==========
  async registrarAbono(deudaId: string, monto: number, notas?: string): Promise<void> {
    const deuda = await this.storage.getDeudaPorId(deudaId);
    if (!deuda) {
      throw new Error('Deuda no encontrada');
    }

    if (monto <= 0 || monto > deuda.saldoPendiente) {
      throw new Error('Monto inválido');
    }

    const abono: Abono = {
      id: this.generarId(),
      deudaId,
      monto,
      fecha: new Date().toISOString(),
      notas
    };

    await this.storage.agregarAbono(abono);

    // Actualizar saldo de la deuda
    deuda.saldoPendiente -= monto;
    if (deuda.saldoPendiente <= 0) {
      deuda.estado = 'pagada';
      deuda.saldoPendiente = 0;
    }

    await this.storage.actualizarDeuda(deuda);
    await this.actualizarSaldoCliente(deuda.clienteId);
  }

  async obtenerAbonosPorDeuda(deudaId: string): Promise<Abono[]> {
    return await this.storage.getAbonosPorDeuda(deudaId);
  }

  // ========== UTILIDADES ==========
  calcularSubtotal(cantidad: number, valorUnitario: number): number {
    return cantidad * valorUnitario;
  }

  private generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Para desarrollo/testing
  async limpiarTodosDatos(): Promise<void> {
    await this.storage.limpiarTodo();
  }

  // ========== ESTADÍSTICAS ==========
  async obtenerEstadisticas() {
    const clientes = await this.obtenerClientes();
    const deudas = await this.obtenerDeudas();
    const abonos = await this.storage.getAbonos();

    const deudasPendientes = deudas.filter(d => d.estado === 'pendiente');
    const deudasPagadas = deudas.filter(d => d.estado === 'pagada');

    const totalPorCobrar = deudasPendientes.reduce((sum, d) => sum + d.saldoPendiente, 0);
    const totalCobrado = abonos.reduce((sum, a) => sum + a.monto, 0);
    const totalVendido = deudas.reduce((sum, d) => sum + d.total, 0);

    // Top 5 clientes con más deuda
    const clientesConDeuda = clientes
      .filter(c => c.saldoTotal > 0)
      .sort((a, b) => b.saldoTotal - a.saldoTotal)
      .slice(0, 5);

    // Deudas recientes (últimas 5)
    const deudasRecientes = [...deudas]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);

    return {
      totalClientes: clientes.length,
      totalDeudas: deudas.length,
      deudasPendientesCount: deudasPendientes.length,
      deudasPagadasCount: deudasPagadas.length,
      totalPorCobrar,
      totalCobrado,
      totalVendido,
      clientesConDeuda,
      deudasRecientes
    };
  }
}
