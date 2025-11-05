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
  cedula: string = '';
  telefono: string = '';
  email: string = '';
  direccion: string = '';
  notas: string = '';

  constructor(
    private deudasService: DeudasService,
    private router: Router
  ) {}

  async guardarCliente() {
    if (!this.nombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    // Validar email si se proporciona
    if (this.email && !this.validarEmail(this.email)) {
      alert('El email no es válido');
      return;
    }

    try {
      await this.deudasService.crearCliente(
        this.nombre.trim(),
        this.cedula.trim() || undefined,
        this.telefono.trim() || undefined,
        this.email.trim() || undefined,
        this.direccion.trim() || undefined,
        this.notas.trim() || undefined
      );

      this.router.navigate(['/clientes']);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    }
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }

}
