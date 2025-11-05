import { Injectable } from '@angular/core';
import { DeudasService } from './deudas';
import { StorageService } from './storage';
import { Cliente } from '../models/cliente.model';
import { Deuda } from '../models/deuda.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportarService {

  constructor(
    private deudasService: DeudasService,
    private storageService: StorageService
  ) {}

  // ========== JSON ==========
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

  // ========== PDF COMPLETO (Todos los clientes) ==========
  async generarPDFCompleto() {
    const clientes = await this.storageService.getClientes();
    const deudas = await this.storageService.getDeudas();
    const abonos = await this.storageService.getAbonos();
    const stats = await this.deudasService.obtenerEstadisticas();

    const doc = new jsPDF();
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE GENERAL DE FIADOS', 105, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.formatearFechaLegible(new Date().toISOString())}`, 105, yPos, { align: 'center' });

    // Resumen general
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL', 14, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const resumenData = [
      ['Total Clientes', stats.totalClientes.toString()],
      ['Deudas Pendientes', stats.deudasPendientesCount.toString()],
      ['Deudas Pagadas', stats.deudasPagadasCount.toString()],
      ['Total Por Cobrar', this.formatearMoneda(stats.totalPorCobrar)],
      ['Total Cobrado', this.formatearMoneda(stats.totalCobrado)],
      ['Total Vendido', this.formatearMoneda(stats.totalVendido)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Concepto', 'Valor']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Detalles por cliente
    yPos = (doc as any).lastAutoTable.finalY + 15;

    for (const cliente of clientes) {
      const deudasCliente = deudas.filter(d => d.clienteId === cliente.id);

      if (deudasCliente.length === 0) continue;

      // Verificar si necesitamos nueva página
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Encabezado del cliente
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`CLIENTE: ${cliente.nombre.toUpperCase()}`, 14, yPos);

      yPos += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (cliente.telefono) doc.text(`Tel: ${cliente.telefono}`, 14, yPos);
      if (cliente.direccion) doc.text(`Dir: ${cliente.direccion}`, 100, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(`Saldo Total: ${this.formatearMoneda(cliente.saldoTotal)}`, 14, yPos);
      doc.setTextColor(0, 0, 0);

      yPos += 8;

      // Tabla de deudas
      const deudasData = deudasCliente.map(deuda => {
        const productosTexto = deuda.productos.map(p =>
          `${p.nombre} (${p.cantidad}x${this.formatearMoneda(p.valorUnitario)})`
        ).join(', ');

        return [
          this.formatearFechaCorta(deuda.fecha),
          productosTexto,
          this.formatearMoneda(deuda.total),
          this.formatearMoneda(deuda.saldoPendiente),
          deuda.estado === 'pagada' ? 'PAGADA' : 'PENDIENTE'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Productos', 'Total', 'Pendiente', 'Estado']],
        body: deudasData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 80 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Guardar PDF
    doc.save(`reporte-completo-${this.obtenerFechaArchivo()}.pdf`);
  }

  // ========== PDF POR CLIENTE ==========
  async generarPDFCliente(clienteId: string) {
    const cliente = await this.deudasService.obtenerClientePorId(clienteId);
    if (!cliente) return;

    const deudas = await this.deudasService.obtenerDeudasPorCliente(clienteId);
    const doc = new jsPDF();
    let yPos = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', 105, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.formatearFechaLegible(new Date().toISOString())}`, 105, yPos, { align: 'center' });

    // Información del cliente
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 14, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${cliente.nombre}`, 14, yPos);

    yPos += 7;
    if (cliente.telefono) {
      doc.text(`Teléfono: ${cliente.telefono}`, 14, yPos);
      yPos += 7;
    }
    if (cliente.direccion) {
      doc.text(`Dirección: ${cliente.direccion}`, 14, yPos);
      yPos += 7;
    }

    doc.text(`Cliente desde: ${this.formatearFechaLegible(cliente.fechaRegistro)}`, 14, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text(`SALDO TOTAL: ${this.formatearMoneda(cliente.saldoTotal)}`, 14, yPos);
    doc.setTextColor(0, 0, 0);

    // Resumen
    const deudasPendientes = deudas.filter(d => d.estado === 'pendiente');
    const deudasPagadas = deudas.filter(d => d.estado === 'pagada');
    const totalVendido = deudas.reduce((sum, d) => sum + d.total, 0);

    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', 14, yPos);

    yPos += 8;
    const resumenData = [
      ['Deudas Pendientes', deudasPendientes.length.toString()],
      ['Deudas Pagadas', deudasPagadas.length.toString()],
      ['Total Vendido', this.formatearMoneda(totalVendido)],
      ['Saldo Pendiente', this.formatearMoneda(cliente.saldoTotal)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Concepto', 'Valor']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detalles de deudas
    if (deudas.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE DEUDAS', 14, yPos);
      yPos += 8;

      for (const deuda of deudas) {
        // Verificar si necesitamos nueva página
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        // Encabezado de deuda
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const estadoColor = deuda.estado === 'pagada' ? [34, 197, 94] : [234, 179, 8];
        doc.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2]);
        doc.text(`${deuda.estado.toUpperCase()} - ${this.formatearFechaCorta(deuda.fecha)}`, 14, yPos);
        doc.setTextColor(0, 0, 0);

        yPos += 6;

        // Productos de la deuda
        const productosData = deuda.productos.map(p => [
          p.nombre,
          p.cantidad.toString(),
          this.formatearMoneda(p.valorUnitario),
          this.formatearMoneda(p.subtotal)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
          body: productosData,
          theme: 'plain',
          headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontSize: 9 },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 3;

        // Abonos si existen
        const abonos = await this.deudasService.obtenerAbonosPorDeuda(deuda.id);
        if (abonos.length > 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Abonos:', 14, yPos);
          yPos += 5;

          const abonosData = abonos.map(a => [
            this.formatearFechaCorta(a.fecha),
            this.formatearMoneda(a.monto),
            a.notas || '-'
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [['Fecha', 'Monto', 'Notas']],
            body: abonosData,
            theme: 'plain',
            headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontSize: 8 },
            styles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 30 },
              2: { cellWidth: 120 }
            }
          });

          yPos = (doc as any).lastAutoTable.finalY + 3;
        }

        // Totales de la deuda
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${this.formatearMoneda(deuda.total)}`, 140, yPos);
        if (deuda.estado === 'pendiente') {
          doc.setTextColor(220, 38, 38);
          doc.text(`Pendiente: ${this.formatearMoneda(deuda.saldoPendiente)}`, 140, yPos + 5);
          doc.setTextColor(0, 0, 0);
        }

        if (deuda.notas) {
          yPos += 5;
          doc.setFont('helvetica', 'italic');
          doc.text(`Nota: ${deuda.notas}`, 14, yPos);
        }

        yPos += 12;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPos, 196, yPos);
        yPos += 8;
      }
    }

    // Guardar PDF
    doc.save(`estado-cuenta-${cliente.nombre.replace(/\s+/g, '-')}-${this.obtenerFechaArchivo()}.pdf`);
  }

 // ========== EXCEL COMPLETO ==========
async generarExcelCompleto() {
  const clientes = await this.storageService.getClientes();
  const deudas = await this.storageService.getDeudas();
  const abonos = await this.storageService.getAbonos();

  // Crear libro de Excel
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const stats = await this.deudasService.obtenerEstadisticas();
  const resumenData = [
    ['REPORTE GENERAL DE FIADOS'],
    [`Fecha: ${this.formatearFechaLegible(new Date().toISOString())}`],
    [],
    ['Concepto', 'Valor'],
    ['Total Clientes', stats.totalClientes.toString()],
    ['Deudas Pendientes', stats.deudasPendientesCount.toString()],
    ['Deudas Pagadas', stats.deudasPagadasCount.toString()],
    ['Total Por Cobrar', stats.totalPorCobrar.toString()],
    ['Total Cobrado', stats.totalCobrado.toString()],
    ['Total Vendido', stats.totalVendido.toString()]
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Hoja 2: Clientes
  const clientesData = [
    ['ID', 'Nombre', 'Teléfono', 'Dirección', 'Saldo Total', 'Fecha Registro']
  ];
  clientes.forEach(c => {
    clientesData.push([
      c.id,
      c.nombre,
      c.telefono || '',
      c.direccion || '',
      c.saldoTotal.toString(), // ← Convertir a string
      this.formatearFechaCorta(c.fechaRegistro)
    ]);
  });
  const wsClientes = XLSX.utils.aoa_to_sheet(clientesData);
  XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

  // Hoja 3: Deudas
  const deudasData = [
    ['ID Deuda', 'Cliente', 'Fecha', 'Total', 'Saldo Pendiente', 'Estado', 'Productos', 'Notas']
  ];
  deudas.forEach(d => {
    const productosTexto = d.productos.map(p =>
      `${p.nombre} (${p.cantidad}x$${p.valorUnitario})`
    ).join('; ');
    deudasData.push([
      d.id,
      d.clienteNombre,
      this.formatearFechaCorta(d.fecha),
      d.total.toString(), // ← Convertir a string
      d.saldoPendiente.toString(), // ← Convertir a string
      d.estado,
      productosTexto,
      d.notas || ''
    ]);
  });
  const wsDeudas = XLSX.utils.aoa_to_sheet(deudasData);
  XLSX.utils.book_append_sheet(wb, wsDeudas, 'Deudas');

  // Hoja 4: Abonos
  const abonosData = [
    ['ID Abono', 'ID Deuda', 'Cliente', 'Monto', 'Fecha', 'Notas']
  ];
  for (const abono of abonos) {
    const deuda = deudas.find(d => d.id === abono.deudaId);
    abonosData.push([
      abono.id,
      abono.deudaId,
      deuda?.clienteNombre || 'N/A',
      abono.monto.toString(), // ← Convertir a string
      this.formatearFechaCorta(abono.fecha),
      abono.notas || ''
    ]);
  }
  const wsAbonos = XLSX.utils.aoa_to_sheet(abonosData);
  XLSX.utils.book_append_sheet(wb, wsAbonos, 'Abonos');

  // Guardar archivo
  XLSX.writeFile(wb, `reporte-completo-${this.obtenerFechaArchivo()}.xlsx`);
}

// ========== EXCEL POR CLIENTE ==========
async generarExcelCliente(clienteId: string) {
  const cliente = await this.deudasService.obtenerClientePorId(clienteId);
  if (!cliente) return;

  const deudas = await this.deudasService.obtenerDeudasPorCliente(clienteId);
  const wb = XLSX.utils.book_new();

  // Hoja 1: Información del cliente
  const infoData = [
    ['ESTADO DE CUENTA'],
    [`Fecha: ${this.formatearFechaLegible(new Date().toISOString())}`],
    [],
    ['Cliente', cliente.nombre],
    ['Teléfono', cliente.telefono || 'N/A'],
    ['Dirección', cliente.direccion || 'N/A'],
    ['Cliente desde', this.formatearFechaLegible(cliente.fechaRegistro)],
    ['Saldo Total', cliente.saldoTotal.toString()], // ← Convertir a string
    [],
    ['Total Deudas', deudas.length.toString()],
    ['Deudas Pendientes', deudas.filter(d => d.estado === 'pendiente').length.toString()],
    ['Deudas Pagadas', deudas.filter(d => d.estado === 'pagada').length.toString()]
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info Cliente');

  // Hoja 2: Deudas
  const deudasData = [
    ['Fecha', 'Productos', 'Total', 'Saldo Pendiente', 'Estado', 'Notas']
  ];
  deudas.forEach(d => {
    const productosTexto = d.productos.map(p =>
      `${p.nombre} (${p.cantidad}x$${p.valorUnitario})`
    ).join('; ');
    deudasData.push([
      this.formatearFechaCorta(d.fecha),
      productosTexto,
      d.total.toString(), // ← Convertir a string
      d.saldoPendiente.toString(), // ← Convertir a string
      d.estado,
      d.notas || ''
    ]);
  });
  const wsDeudas = XLSX.utils.aoa_to_sheet(deudasData);
  XLSX.utils.book_append_sheet(wb, wsDeudas, 'Deudas');

  // Hoja 3: Abonos
  const abonosData = [['Fecha Deuda', 'Fecha Abono', 'Monto', 'Notas']];
  for (const deuda of deudas) {
    const abonos = await this.deudasService.obtenerAbonosPorDeuda(deuda.id);
    abonos.forEach(a => {
      abonosData.push([
        this.formatearFechaCorta(deuda.fecha),
        this.formatearFechaCorta(a.fecha),
        a.monto.toString(), // ← Convertir a string
        a.notas || ''
      ]);
    });
  }
  const wsAbonos = XLSX.utils.aoa_to_sheet(abonosData);
  XLSX.utils.book_append_sheet(wb, wsAbonos, 'Abonos');

  // Guardar archivo
  XLSX.writeFile(wb, `estado-cuenta-${cliente.nombre.replace(/\s+/g, '-')}-${this.obtenerFechaArchivo()}.xlsx`);
}

  // ========== WHATSAPP ==========
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

  // ========== IMPORTAR ==========
  async importarDesdeJSON(jsonString: string): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const backup = JSON.parse(jsonString);

      if (!backup.datos || !backup.datos.clientes || !backup.datos.deudas || !backup.datos.abonos) {
        return {
          exito: false,
          mensaje: 'Archivo JSON inválido. Formato incorrecto.'
        };
      }

      await this.storageService.setClientes(backup.datos.clientes);
      await this.storageService.setDeudas(backup.datos.deudas);
      await this.storageService.setAbonos(backup.datos.abonos);

      return {
        exito: true,
        mensaje: `Datos restaurados correctamente:\n${backup.datos.clientes.length} clientes\n${backup.datos.deudas.length} deudas\n${backup.datos.abonos.length} abonos`
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: 'Error al leer el archivo. Asegúrate de que sea un respaldo válido.'
      };
    }
  }

  // ========== UTILIDADES ==========
  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  private formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
