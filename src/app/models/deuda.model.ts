import { ProductoItem } from './producto-item.model';

export interface Deuda {
  id: string;
  clienteId: string;
  clienteNombre: string; // Denormalizado para consultas rápidas
  fecha: string; // ISO string
  productos: ProductoItem[];
  total: number;
  saldoPendiente: number; // Total - suma de abonos
  estado: 'pendiente' | 'pagada';
  notas?: string;
}
