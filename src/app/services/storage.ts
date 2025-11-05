import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Cliente } from '../models/cliente.model';
import { Deuda } from '../models/deuda.model';
import { Abono } from '../models/abono.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly KEYS = {
    CLIENTES: 'clientes',
    DEUDAS: 'deudas',
    ABONOS: 'abonos'
  };

  constructor() {
    this.inicializarDatos();
  }

  // Inicializar storage si está vacío
  private async inicializarDatos() {
    const clientes = await this.getClientes();
    if (!clientes || clientes.length === 0) {
      await this.setClientes([]);
      await this.setDeudas([]);
      await this.setAbonos([]);
    }
  }

  // ========== CLIENTES ==========
  async getClientes(): Promise<Cliente[]> {
    const { value } = await Preferences.get({ key: this.KEYS.CLIENTES });
    return value ? JSON.parse(value) : [];
  }

  async setClientes(clientes: Cliente[]): Promise<void> {
    await Preferences.set({
      key: this.KEYS.CLIENTES,
      value: JSON.stringify(clientes)
    });
  }

  async agregarCliente(cliente: Cliente): Promise<void> {
    const clientes = await this.getClientes();
    clientes.push(cliente);
    await this.setClientes(clientes);
  }

  async actualizarCliente(cliente: Cliente): Promise<void> {
    const clientes = await this.getClientes();
    const index = clientes.findIndex(c => c.id === cliente.id);
    if (index !== -1) {
      clientes[index] = cliente;
      await this.setClientes(clientes);
    }
  }

  async eliminarCliente(id: string): Promise<void> {
    let clientes = await this.getClientes();
    clientes = clientes.filter(c => c.id !== id);
    await this.setClientes(clientes);
  }

  async getClientePorId(id: string): Promise<Cliente | undefined> {
    const clientes = await this.getClientes();
    return clientes.find(c => c.id === id);
  }

  // ========== DEUDAS ==========
  async getDeudas(): Promise<Deuda[]> {
    const { value } = await Preferences.get({ key: this.KEYS.DEUDAS });
    return value ? JSON.parse(value) : [];
  }

  async setDeudas(deudas: Deuda[]): Promise<void> {
    await Preferences.set({
      key: this.KEYS.DEUDAS,
      value: JSON.stringify(deudas)
    });
  }

  async agregarDeuda(deuda: Deuda): Promise<void> {
    const deudas = await this.getDeudas();
    deudas.push(deuda);
    await this.setDeudas(deudas);
  }

  async actualizarDeuda(deuda: Deuda): Promise<void> {
    const deudas = await this.getDeudas();
    const index = deudas.findIndex(d => d.id === deuda.id);
    if (index !== -1) {
      deudas[index] = deuda;
      await this.setDeudas(deudas);
    }
  }

  async getDeudaPorId(id: string): Promise<Deuda | undefined> {
    const deudas = await this.getDeudas();
    return deudas.find(d => d.id === id);
  }

  async getDeudasPorCliente(clienteId: string): Promise<Deuda[]> {
    const deudas = await this.getDeudas();
    return deudas.filter(d => d.clienteId === clienteId);
  }

  // ========== ABONOS ==========
  async getAbonos(): Promise<Abono[]> {
    const { value } = await Preferences.get({ key: this.KEYS.ABONOS });
    return value ? JSON.parse(value) : [];
  }

  async setAbonos(abonos: Abono[]): Promise<void> {
    await Preferences.set({
      key: this.KEYS.ABONOS,
      value: JSON.stringify(abonos)
    });
  }

  async agregarAbono(abono: Abono): Promise<void> {
    const abonos = await this.getAbonos();
    abonos.push(abono);
    await this.setAbonos(abonos);
  }

  async getAbonosPorDeuda(deudaId: string): Promise<Abono[]> {
    const abonos = await this.getAbonos();
    return abonos.filter(a => a.deudaId === deudaId);
  }

  // ========== UTILIDADES ==========
  async limpiarTodo(): Promise<void> {
    await Preferences.clear();
    await this.inicializarDatos();
  }
}
