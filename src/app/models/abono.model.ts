export interface Abono {
  id: string;
  deudaId: string;
  monto: number;
  fecha: string; // ISO string
  notas?: string;
}
