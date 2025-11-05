import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonInput, IonItem, IonLabel,
  IonBackButton, IonButtons, IonTextarea,
  AlertController, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  saveOutline, trashOutline, personOutline,
  cardOutline, callOutline, mailOutline,
  locationOutline, documentTextOutline
} from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-editar-cliente',
  templateUrl: './editar-cliente.page.html',
  styleUrls: ['./editar-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonItem, IonLabel,
    IonBackButton, IonButtons, IonTextarea,
    IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonIcon
  ]
})
export class EditarClientePage implements OnInit {
 clienteId: string = '';
  cliente?: Cliente;

  // Formulario
  nombre: string = '';
  cedula: string = '';
  telefono: string = '';
  email: string = '';
  direccion: string = '';
  notas: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deudasService: DeudasService,
    private alertController: AlertController
  ) {
    addIcons({
      saveOutline, trashOutline, personOutline,
      cardOutline, callOutline, mailOutline,
      locationOutline, documentTextOutline
    });
  }

  async ngOnInit() {
    this.clienteId = this.route.snapshot.paramMap.get('id') || '';
    await this.cargarCliente();
  }

  async cargarCliente() {
    this.cliente = await this.deudasService.obtenerClientePorId(this.clienteId);

    if (this.cliente) {
      this.nombre = this.cliente.nombre;
      this.cedula = this.cliente.cedula || '';
      this.telefono = this.cliente.telefono || '';
      this.email = this.cliente.email || '';
      this.direccion = this.cliente.direccion || '';
      this.notas = this.cliente.notas || '';
    }
  }

  async guardarCambios() {
    if (!this.nombre.trim()) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'El nombre del cliente es obligatorio',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Validar email si se proporciona
    if (this.email && !this.validarEmail(this.email)) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'El email no es válido',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      await this.deudasService.actualizarCliente(
        this.clienteId,
        this.nombre.trim(),
        this.cedula.trim() || undefined,
        this.telefono.trim() || undefined,
        this.email.trim() || undefined,
        this.direccion.trim() || undefined,
        this.notas.trim() || undefined
      );

      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Cliente actualizado correctamente',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.router.navigate(['/detalle-cliente', this.clienteId]);
          }
        }]
      });
      await alert.present();
    } catch (error) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo actualizar el cliente',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async confirmarEliminar() {
    const alert = await this.alertController.create({
      header: '⚠️ Eliminar Cliente',
      message: '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.eliminarCliente();
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarCliente() {
    try {
      await this.deudasService.eliminarCliente(this.clienteId);

      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Cliente eliminado correctamente',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.router.navigate(['/clientes']);
          }
        }]
      });
      await alert.present();
    } catch (error: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: error.message || 'No se pudo eliminar el cliente',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  cancelar() {
    this.router.navigate(['/detalle-cliente', this.clienteId]);
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

}
