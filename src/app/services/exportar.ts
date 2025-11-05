import { Injectable } from '@angular/core';
import { DeudasService } from './deudas';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class ExportarService {

  constructor(
    private deudasService: DeudasService,
    private storageService: StorageService
  ) {}

  // Exportar todo a JSON
  async exportarTodoJSON(): Promise<string> {
    const clientes = await this.storageService.getClientes();
    const deudas = await this.storageService.getDeudas();
    const abonos = await this.storageService.getAbonos();

    const backup = {
      version: '1.0',
      fecha: new Date().toISOString(),
      datos: {
        clientes,
        deudas,
        abonos
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  // Descargar JSON
  async descargarJSON() {
    const json = await this.exportarTodoJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fiados-backup-${this.obtenerFechaArchivo()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Exportar deudas a CSV
  async exportarDeudasCSV(filtrarPendientes: boolean = false): Promise<string> {
    let deudas = await this.storageService.getDeudas();

    if (filtrarPendientes) {
      deudas = deudas.filter(d => d.estado === 'pendiente');
    }

    // Encabezados
    let csv = 'Cliente,Fecha,Estado,Total,Saldo Pendiente,Productos,Notas\n';

    // Filas
    deudas.forEach(deuda => {
      const productosTexto = deuda.productos
        .map(p => `${p.nombre} (${p.cantidad})`)
        .join('; ');

      csv += `"${deuda.clienteNombre}",`;
      csv += `"${this.formatearFechaCSV(deuda.fecha)}",`;
      csv += `"${deuda.estado}",`;
      csv += `"${deuda.total}",`;
      csv += `"${deuda.saldoPendiente}",`;
      csv += `"${productosTexto}",`;
      csv += `"${deuda.notas || ''}"\n`;
    });

    return csv;
  }

  // Descargar CSV
  async descargarDeudasCSV(filtrarPendientes: boolean = false) {
    const csv = await this.exportarDeudasCSV(filtrarPendientes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const tipo = filtrarPendientes ? 'pendientes' : 'todas';
    link.download = `deudas-${tipo}-${this.obtenerFechaArchivo()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Compartir por WhatsApp (resumen)
  async compartirResumenWhatsApp() {
    const stats = await this.deudasService.obtenerEstadisticas();

    let mensaje = '📊 *RESUMEN DE FIADOS*\n\n';
    mensaje += `💰 *Por Cobrar:* ${this.formatearMoneda(stats.totalPorCobrar)}\n`;
    mensaje += `✅ *Cobrado:* ${this.formatearMoneda(stats.totalCobrado)}\n`;
    mensaje += `📈 *Total Vendido:* ${this.formatearMoneda(stats.totalVendido)}\n\n`;
    mensaje += `👥 *Clientes:* ${stats.totalClientes}\n`;
    mensaje += `⏳ *Deudas Pendientes:* ${stats.deudasPendientesCount}\n`;
    mensaje += `✔️ *Deudas Pagadas:* ${stats.deudasPagadasCount}\n\n`;

    if (stats.clientesConDeuda.length > 0) {
      mensaje += '*Top Clientes con Deuda:*\n';
      stats.clientesConDeuda.forEach((cliente, index) => {
        mensaje += `${index + 1}. ${cliente.nombre}: ${this.formatearMoneda(cliente.saldoTotal)}\n`;
      });
    }

    mensaje += `\n_Generado el ${this.formatearFechaLegible(new Date().toISOString())}_`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // Compartir deuda específica por WhatsApp
  async compartirDeudaWhatsApp(deudaId: string) {
    const deuda = await this.deudasService.obtenerDeudaPorId(deudaId);
    if (!deuda) return;

    const abonos = await this.deudasService.obtenerAbonosPorDeuda(deudaId);
    const totalAbonado = abonos.reduce((sum, a) => sum + a.monto, 0);

    let mensaje = `🧾 *DETALLE DE DEUDA*\n\n`;
    mensaje += `👤 *Cliente:* ${deuda.clienteNombre}\n`;
    mensaje += `📅 *Fecha:* ${this.formatearFechaLegible(deuda.fecha)}\n\n`;

    mensaje += `*Productos:*\n`;
    deuda.productos.forEach(p => {
      mensaje += `• ${p.nombre}\n`;
      mensaje += `  ${p.cantidad} x ${this.formatearMoneda(p.valorUnitario)} = ${this.formatearMoneda(p.subtotal)}\n`;
    });

    mensaje += `\n💵 *Total:* ${this.formatearMoneda(deuda.total)}\n`;

    if (abonos.length > 0) {
      mensaje += `✅ *Abonado:* ${this.formatearMoneda(totalAbonado)}\n`;
    }

    mensaje += `⏳ *Saldo Pendiente:* ${this.formatearMoneda(deuda.saldoPendiente)}\n`;

    if (deuda.notas) {
      mensaje += `\n📝 *Notas:* ${deuda.notas}`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // Utilidades
  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  private formatearFechaCSV(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO');
  }

  private formatearFechaLegible(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private obtenerFechaArchivo(): string {
    const ahora = new Date();
    return ahora.toISOString().split('T')[0];
  }
}
