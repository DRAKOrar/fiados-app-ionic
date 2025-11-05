import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonInput, IonItem, IonLabel,
  IonBackButton, IonButtons, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonTextarea,
  IonList, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, cart } from 'ionicons/icons';
import { DeudasService } from 'src/app/services/deudas';
import { Cliente } from '../../models/cliente.model';
import { ProductoItem } from '../../models/producto-item.model';

@Component({
  selector: 'app-nueva-deuda',
  templateUrl: './nueva-deuda.page.html',
  styleUrls: ['./nueva-deuda.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonItem, IonLabel,
    IonBackButton, IonButtons, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonIcon, IonTextarea,
    IonList, IonItemSliding, IonItemOptions, IonItemOption]
})
export class NuevaDeudaPage implements OnInit {

  cliente?: Cliente;
  clienteId: string = '';

  // Lista de productos agregados
  productos: ProductoItem[] = [];

  // Formulario para nuevo producto
  productoNombre: string = '';
  productoCantidad: number = 1;
  productoValorUnitario: number = 0;

  // Notas opcionales
  notas: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deudasService: DeudasService
  ) {
    addIcons({ add, trash, cart });
  }

  async ngOnInit() {
    this.clienteId = this.route.snapshot.paramMap.get('clienteId') || '';
    this.cliente = await this.deudasService.obtenerClientePorId(this.clienteId);
  }

  agregarProducto() {
    if (!this.productoNombre.trim()) {
      alert('Ingresa el nombre del producto');
      return;
    }

    if (this.productoCantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (this.productoValorUnitario <= 0) {
      alert('El valor unitario debe ser mayor a 0');
      return;
    }

    const subtotal = this.deudasService.calcularSubtotal(
      this.productoCantidad,
      this.productoValorUnitario
    );

    const producto: ProductoItem = {
      id: this.generarIdTemporal(),
      nombre: this.productoNombre.trim(),
      cantidad: this.productoCantidad,
      valorUnitario: this.productoValorUnitario,
      subtotal
    };

    this.productos.push(producto);
    this.limpiarFormularioProducto();
  }

  eliminarProducto(producto: ProductoItem) {
    this.productos = this.productos.filter(p => p.id !== producto.id);
  }

  limpiarFormularioProducto() {
    this.productoNombre = '';
    this.productoCantidad = 1;
    this.productoValorUnitario = 0;
  }

  calcularTotal(): number {
    return this.productos.reduce((sum, p) => sum + p.subtotal, 0);
  }

  async guardarDeuda() {
    if (this.productos.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    try {
      await this.deudasService.crearDeuda(
        this.clienteId,
        this.productos,
        this.notas.trim() || undefined
      );

      this.router.navigate(['/detalle-cliente', this.clienteId]);
    } catch (error) {
      console.error('Error al guardar deuda:', error);
      alert('Error al guardar la deuda');
    }
  }

  cancelar() {
    this.router.navigate(['/detalle-cliente', this.clienteId]);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  private generarIdTemporal(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
