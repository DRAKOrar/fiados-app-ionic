import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButtons, IonBackButton, IonNote, AlertController,
  IonToggle
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  downloadOutline, cloudUploadOutline, trashOutline,
  informationCircleOutline, shieldCheckmarkOutline,
  documentTextOutline, settingsOutline, warning } from 'ionicons/icons';
import { ExportarService } from 'src/app/services/exportar';
import { DeudasService } from 'src/app/services/deudas';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButtons, IonBackButton, IonNote, IonToggle
  ]
})
export class ConfiguracionPage implements OnInit {

  estadisticas = {
    totalClientes: 0,
    totalDeudas: 0,
    totalAbonos: 0
  };

  constructor(
    private router: Router,
    private deudasService: DeudasService,
    private exportarService: ExportarService,
    private alertController: AlertController
  ) {
    addIcons({settingsOutline,shieldCheckmarkOutline,downloadOutline,cloudUploadOutline,informationCircleOutline,documentTextOutline,trashOutline,warning});
  }

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    const stats = await this.deudasService.obtenerEstadisticas();
    this.estadisticas = {
      totalClientes: stats.totalClientes,
      totalDeudas: stats.totalDeudas,
      totalAbonos: 0 // Puedes agregarlo al servicio si quieres
    };
  }

  async exportarRespaldo() {
    const alert = await this.alertController.create({
      header: 'Exportar Respaldo',
      message: 'Se descargará un archivo JSON con todos tus datos.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Descargar',
          handler: async () => {
            try {
              await this.exportarService.descargarJSON();
              this.mostrarExito('Respaldo exportado correctamente');
            } catch (error) {
              this.mostrarError('Error al exportar respaldo');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async importarRespaldo() {
    const alert = await this.alertController.create({
      header: '⚠️ Advertencia',
      message: 'Esto reemplazará TODOS tus datos actuales. ¿Estás seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: () => {
            this.seleccionarArchivo();
          }
        }
      ]
    });
    await alert.present();
  }

  seleccionarArchivo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          const jsonString = e.target.result;
          const resultado = await this.exportarService.importarDesdeJSON(jsonString);

          if (resultado.exito) {
            await this.cargarEstadisticas();
            this.mostrarExito(resultado.mensaje);
          } else {
            this.mostrarError(resultado.mensaje);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  async limpiarTodosDatos() {
  const alert = await this.alertController.create({
    header: '⚠️ ¡PELIGRO!',
    message: 'Esto ELIMINARÁ PERMANENTEMENTE todos los datos:\n\n• Todos los clientes\n• Todas las deudas\n• Todos los abonos\n\nEsta acción NO se puede deshacer.',
    inputs: [
      {
        name: 'confirmacion',
        type: 'text',
        placeholder: 'Escribe ELIMINAR para confirmar'
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar Todo',
        role: 'destructive',
        handler: async (data) => {
          if (data.confirmacion === 'ELIMINAR') {
            await this.deudasService.limpiarTodosDatos();
            await this.cargarEstadisticas();
            this.mostrarExito('Todos los datos han sido eliminados');
            this.router.navigate(['/dashboard']);
            return true; // ← Agregar este return
          } else {
            this.mostrarError('Debes escribir ELIMINAR para confirmar');
            return false;
          }
        }
      }
    ]
  });
  await alert.present();
}

  async mostrarAcercaDe() {
    const alert = await this.alertController.create({
      header: 'Fiados App',
      message: `
        <strong>Versión:</strong> 1.0.0<br>
        <strong>Desarrollado con:</strong><br>
        • Ionic 8<br>
        • Angular 19<br>
        • Capacitor<br><br>

        <strong>Características:</strong><br>
        ✓ Registro de clientes<br>
        ✓ Control de deudas<br>
        ✓ Registro de abonos<br>
        ✓ Estadísticas en tiempo real<br>
        ✓ Exportación de datos<br>
        ✓ Compartir por WhatsApp<br>
        ✓ Sin necesidad de internet<br>
        ✓ 100% gratuito<br><br>

        <em>App diseñada para pequeños negocios y tenderos.</em>
      `,
      buttons: ['Cerrar']
    });
    await alert.present();
  }

  async mostrarAyuda() {
    const alert = await this.alertController.create({
      header: 'Ayuda',
      message: `
        <strong>¿Cómo usar la app?</strong><br><br>

        <strong>1. Agregar Cliente:</strong><br>
        Desde "Mis Clientes", toca el botón + para agregar un nuevo cliente.<br><br>

        <strong>2. Registrar Deuda:</strong><br>
        Entra al detalle del cliente y toca + para crear una nueva deuda. Agrega los productos y sus valores.<br><br>

        <strong>3. Registrar Abono:</strong><br>
        En el detalle de la deuda, toca "Registrar Abono" para agregar un pago.<br><br>

        <strong>4. Exportar Datos:</strong><br>
        Usa "Búsqueda" para exportar tus datos en CSV o JSON, o compartir por WhatsApp.<br><br>

        <strong>5. Respaldo:</strong><br>
        Haz respaldos regularmente desde Configuración para no perder tu información.
      `,
      buttons: ['Entendido']
    });
    await alert.present();
  }

  private async mostrarExito(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}
