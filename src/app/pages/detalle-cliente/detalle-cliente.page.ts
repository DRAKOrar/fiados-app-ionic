import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonLabel,
  IonBackButton, IonButtons, IonIcon, IonBadge,
  IonFab, IonFabButton, IonChip
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, calendar, cart, checkmarkCircle, timeOutline, documentText } from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { Cliente } from '../../models/cliente.model';
import { Deuda } from '../../models/deuda.model';

@Component({
  selector: 'app-detalle-cliente',
  templateUrl: './detalle-cliente.page.html',
  styleUrls: ['./detalle-cliente.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonList, IonItem, IonLabel,
    IonBackButton, IonButtons, IonIcon, IonBadge,
    IonFab, IonFabButton, IonChip]
})
export class DetalleClientePage implements OnInit {
  cliente?: Cliente;
  deudas: Deuda[] = [];
  deudasPendientes: Deuda[] = [];
  deudasPagadas: Deuda[] = [];
  clienteId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deudasService: DeudasService
  ) {
    addIcons({timeOutline,checkmarkCircle,calendar,cart,documentText,add});
  }

  async ngOnInit() {
    this.clienteId = this.route.snapshot.paramMap.get('id') || '';
    await this.cargarDatos();
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cliente = await this.deudasService.obtenerClientePorId(this.clienteId);
    this.deudas = await this.deudasService.obtenerDeudasPorCliente(this.clienteId);

    this.deudasPendientes = this.deudas.filter(d => d.estado === 'pendiente');
    this.deudasPagadas = this.deudas.filter(d => d.estado === 'pagada');
  }

  agregarDeuda() {
    this.router.navigate(['/nueva-deuda', this.clienteId]);
  }

verDetalleDeuda(deuda: Deuda) {
  this.router.navigate(['/detalle-deuda', deuda.id]);
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

}
