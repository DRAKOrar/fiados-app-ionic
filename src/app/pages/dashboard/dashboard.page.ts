import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge, IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonButtons, IonAvatar, IonRouterLinkWithHref } from '@ionic/angular/standalone';
import { Router, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';

import {
  people, cash, trendingUp, checkmarkCircle,
  timeOutline, wallet, cart, refreshOutline,time,
  add, statsChart, personAdd, person, home, list, receipt, settingsOutline } from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { Cliente } from '../../models/cliente.model';
import { Deuda } from '../../models/deuda.model';
import { search } from 'ionicons/icons'; // Agregar
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonAvatar, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonList, IonItem, IonLabel,
    IonBadge, IonGrid, IonRow, IonCol, IonRefresher,
    IonRefresherContent, IonFab, IonFabButton, RouterLinkActive, IonRouterLinkWithHref]
})
export class DashboardPage implements OnInit {

  estadisticas = {
    totalClientes: 0,
    totalDeudas: 0,
    deudasPendientesCount: 0,
    deudasPagadasCount: 0,
    totalPorCobrar: 0,
    totalCobrado: 0,
    totalVendido: 0,
    clientesConDeuda: [] as Cliente[],
    deudasRecientes: [] as Deuda[]
  };

  constructor(
    private deudasService: DeudasService,
    private router: Router
  ) {
    addIcons({statsChart,search,settingsOutline,cash,wallet,trendingUp,people,timeOutline,checkmarkCircle,cart,person,personAdd,add,receipt,list,time,home,refreshOutline});
  }

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async ionViewWillEnter() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    this.estadisticas = await this.deudasService.obtenerEstadisticas();
  }

  async refrescar(event: any) {
    await this.cargarEstadisticas();
    event.target.complete();
  }

  verClientes() {
    this.router.navigate(['/clientes']);
  }

  verCliente(cliente: Cliente) {
    this.router.navigate(['/detalle-cliente', cliente.id]);
  }

  verDeuda(deuda: Deuda) {
    this.router.navigate(['/detalle-deuda', deuda.id]);
  }

  agregarCliente() {
    this.router.navigate(['/agregar-cliente']);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  irABusqueda() { this.router.navigate(['/busqueda']); }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-CO', {
        month: 'short',
        day: 'numeric'
      });
    }
  }
}
