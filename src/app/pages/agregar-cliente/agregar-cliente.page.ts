import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonInput, IonItem, IonLabel,
  IonBackButton, IonButtons, IonTextarea, IonIcon, IonCardContent, IonCard } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { DeudasService } from 'src/app/services/deudas';

@Component({
  selector: 'app-agregar-cliente',
  templateUrl: './agregar-cliente.page.html',
  styleUrls: ['./agregar-cliente.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardContent, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonItem, IonLabel,
    IonBackButton, IonButtons, IonTextarea]
})
export class AgregarClientePage{

  nombre: string = '';
  telefono: string = '';
  direccion: string = '';

  constructor(
    private deudasService: DeudasService,
    private router: Router
  ) {}

  async guardarCliente() {
    if (!this.nombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    try {
      await this.deudasService.crearCliente(
        this.nombre.trim(),
        this.telefono.trim() || undefined,
        this.direccion.trim() || undefined
      );

      this.router.navigate(['/clientes']);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    }
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }

}
