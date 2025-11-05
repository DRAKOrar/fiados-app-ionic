import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonSearchbar, IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem, IonIcon, IonBadge, IonButton,
  IonSelect, IonSelectOption, IonDatetime, IonModal,
  IonButtons, IonBackButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  search, calendar, funnel, person, cart,
  downloadOutline, shareSocial, filterOutline, codeOutline, documentTextOutline, gridOutline, logoWhatsapp } from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { ExportarService } from 'src/app/services/exportar';
import { Deuda } from '../../models/deuda.model';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.page.html',
  styleUrls: ['./busqueda.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonSearchbar, IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonIcon, IonBadge, IonButton,
    IonSelect, IonSelectOption, IonDatetime, IonModal,
    IonButtons, IonBackButton, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle]
})
export class BusquedaPage implements OnInit {

  // Vista activa
  vistaActual: 'deudas' | 'clientes' = 'deudas';

  // Búsqueda
  textoBusqueda: string = '';

  // Filtros de deudas
  filtroEstado: 'todas' | 'pendiente' | 'pagada' = 'todas';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroMontoMin: number = 0;
  filtroMontoMax: number = 0;

  // Datos
  todasDeudas: Deuda[] = [];
  deudasFiltradas: Deuda[] = [];
  todosClientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];

  // Modal de filtros
  mostrarFiltros: boolean = false;

  constructor(
    private router: Router,
    private deudasService: DeudasService,
    private exportarService: ExportarService
  ) {
    addIcons({filterOutline,codeOutline,documentTextOutline,gridOutline,logoWhatsapp,cart,search,person,calendar,funnel,downloadOutline,shareSocial});
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.todasDeudas = await this.deudasService.obtenerDeudas();
    this.todosClientes = await this.deudasService.obtenerClientes();
    this.aplicarFiltros();
  }

  cambiarVista(event: any) {
    this.vistaActual = event.detail.value;
    this.textoBusqueda = '';
    this.aplicarFiltros();
  }

  buscar(event: any) {
    this.textoBusqueda = event.target.value.toLowerCase();
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    if (this.vistaActual === 'deudas') {
      this.filtrarDeudas();
    } else {
      this.filtrarClientes();
    }
  }

  filtrarDeudas() {
    let resultado = [...this.todasDeudas];

    // Filtro de texto
    if (this.textoBusqueda) {
      resultado = resultado.filter(d =>
        d.clienteNombre.toLowerCase().includes(this.textoBusqueda) ||
        d.productos.some(p => p.nombre.toLowerCase().includes(this.textoBusqueda)) ||
        d.notas?.toLowerCase().includes(this.textoBusqueda)
      );
    }

    // Filtro de estado
    if (this.filtroEstado !== 'todas') {
      resultado = resultado.filter(d => d.estado === this.filtroEstado);
    }

    // Filtro de fecha desde
    if (this.filtroFechaDesde) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      resultado = resultado.filter(d => new Date(d.fecha) >= fechaDesde);
    }

    // Filtro de fecha hasta
    if (this.filtroFechaHasta) {
      const fechaHasta = new Date(this.filtroFechaHasta);
      resultado = resultado.filter(d => new Date(d.fecha) <= fechaHasta);
    }

    // Filtro de monto mínimo
    if (this.filtroMontoMin > 0) {
      resultado = resultado.filter(d => d.total >= this.filtroMontoMin);
    }

    // Filtro de monto máximo
    if (this.filtroMontoMax > 0) {
      resultado = resultado.filter(d => d.total <= this.filtroMontoMax);
    }

    // Ordenar por fecha más reciente
    resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    this.deudasFiltradas = resultado;
  }

  filtrarClientes() {
    let resultado = [...this.todosClientes];

    if (this.textoBusqueda) {
      resultado = resultado.filter(c =>
        c.nombre.toLowerCase().includes(this.textoBusqueda) ||
        c.telefono?.toLowerCase().includes(this.textoBusqueda) ||
        c.direccion?.toLowerCase().includes(this.textoBusqueda)
      );
    }

    // Ordenar por saldo mayor
    resultado.sort((a, b) => b.saldoTotal - a.saldoTotal);

    this.clientesFiltrados = resultado;
  }

  limpiarFiltros() {
    this.filtroEstado = 'todas';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroMontoMin = 0;
    this.filtroMontoMax = 0;
    this.aplicarFiltros();
    this.mostrarFiltros = false;
  }

  verDeuda(deuda: Deuda) {
    this.router.navigate(['/detalle-deuda', deuda.id]);
  }

  verCliente(cliente: Cliente) {
    this.router.navigate(['/detalle-cliente', cliente.id]);
  }

  async exportarJSON() {
  await this.exportarService.descargarJSON();
}

async exportarPDFCompleto() {
  await this.exportarService.generarPDFCompleto();
}

async exportarExcelCompleto() {
  await this.exportarService.generarExcelCompleto();
}

  async compartirWhatsApp() {
    await this.exportarService.compartirResumenWhatsApp();
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  hayFiltrosActivos(): boolean {
    return this.filtroEstado !== 'todas' ||
      this.filtroFechaDesde !== '' ||
      this.filtroFechaHasta !== '' ||
      this.filtroMontoMin > 0 ||
      this.filtroMontoMax > 0;
  }
}
