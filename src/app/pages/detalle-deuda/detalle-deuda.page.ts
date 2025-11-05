import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonLabel,
  IonBackButton, IonButtons, IonIcon, IonBadge,
  IonInput, IonNote, AlertController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  calendar, cart, cash, checkmarkCircle,
  documentText, person, walletOutline
} from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { Deuda } from '../../models/deuda.model';
import { Abono } from '../../models/abono.model';
@Component({
  selector: 'app-detalle-deuda',
  templateUrl: './detalle-deuda.page.html',
  styleUrls: ['./detalle-deuda.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonList, IonItem, IonLabel,
    IonBackButton, IonButtons, IonIcon, IonBadge,
    IonInput, IonNote]
})
export class DetalleDeudaPage implements OnInit {

  deuda?: Deuda;
  abonos: Abono[] = [];
  deudaId: string = '';

  // Para registrar nuevo abono
  montoAbono: number = 0;
  notasAbono: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deudasService: DeudasService,
    private alertController: AlertController
  ) {
    addIcons({
      calendar, cart, cash, checkmarkCircle,
      documentText, person, walletOutline
    });
  }

  async ngOnInit() {
    this.deudaId = this.route.snapshot.paramMap.get('id') || '';
    await this.cargarDatos();
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.deuda = await this.deudasService.obtenerDeudaPorId(this.deudaId);
    this.abonos = await this.deudasService.obtenerAbonosPorDeuda(this.deudaId);
    // Ordenar abonos por fecha (más recientes primero)
    this.abonos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async abrirDialogoAbono() {
    if (!this.deuda || this.deuda.estado === 'pagada') {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Registrar Abono',
      inputs: [
        {
          name: 'monto',
          type: 'number',
          placeholder: 'Monto del abono',
          min: 0,
          max: this.deuda.saldoPendiente,
          value: this.deuda.saldoPendiente // Por defecto el saldo completo
        },
        {
          name: 'notas',
          type: 'textarea',
          placeholder: 'Notas (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            await this.registrarAbono(parseFloat(data.monto), data.notas);
          }
        }
      ]
    });

    await alert.present();
  }

  async registrarAbono(monto: number, notas?: string) {
    if (!this.deuda) return;

    if (monto <= 0) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'El monto debe ser mayor a 0',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (monto > this.deuda.saldoPendiente) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'El monto no puede ser mayor al saldo pendiente',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      await this.deudasService.registrarAbono(
        this.deudaId,
        monto,
        notas
      );

      // Mostrar confirmación
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: `Abono de ${this.formatearMoneda(monto)} registrado correctamente`,
        buttons: ['OK']
      });
      await alert.present();

      await this.cargarDatos();
    } catch (error: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: error.message || 'Error al registrar el abono',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  calcularTotalAbonos(): number {
    return this.abonos.reduce((sum, a) => sum + a.monto, 0);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  volver() {
    if (this.deuda) {
      this.router.navigate(['/detalle-cliente', this.deuda.clienteId]);
    } else {
      this.router.navigate(['/clientes']);
    }
  }
}
