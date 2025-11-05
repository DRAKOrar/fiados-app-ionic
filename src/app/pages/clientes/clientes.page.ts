import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton, IonIcon,
  IonFab, IonFabButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonSearchbar,
  IonButtons, IonMenuButton
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, person, cash, search, personOutline, callOutline, chevronForward, searchOutline, refresh } from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { Cliente } from '../../models/cliente.model';
import { home } from 'ionicons/icons'; // Agregar al import
@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonButton, IonIcon,
    IonFab, IonFabButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonSearchbar,
    IonButtons, IonMenuButton, RouterLink]
})
export class ClientesPage implements OnInit {

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  buscando: string = '';

  constructor(
    private deudasService: DeudasService,
    private router: Router
  ) {
    addIcons({home,personOutline,add,callOutline,chevronForward,searchOutline,refresh,person,search,cash});
  }

  async ngOnInit() {
    await this.cargarClientes();
  }

  async ionViewWillEnter() {
    await this.cargarClientes();
  }

  async cargarClientes() {
    this.clientes = await this.deudasService.obtenerClientes();
    this.clientesFiltrados = [...this.clientes];
  }

  buscarClientes(event: any) {
    const textoBusqueda = event.target.value.toLowerCase();
    this.buscando = textoBusqueda;

    if (!textoBusqueda) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(textoBusqueda) ||
      cliente.telefono?.toLowerCase().includes(textoBusqueda)
    );
  }

  verDetalleCliente(cliente: Cliente) {
    this.router.navigate(['/detalle-cliente', cliente.id]);
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

    // Función para limpiar la búsqueda
  limpiarBusqueda() {
    this.buscando = '';
    this.clientesFiltrados = [...this.clientes];

    // También puedes limpiar el searchbar si es necesario
    const searchbar = document.querySelector('ion-searchbar');
    if (searchbar) {
      (searchbar as any).value = '';
    }
  }

}
