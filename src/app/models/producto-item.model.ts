export interface ProductoItem {
  id: string;
  nombre: string;
  cantidad: number;
  valorUnitario: number;
  subtotal: number; // cantidad * valorUnitario
}
