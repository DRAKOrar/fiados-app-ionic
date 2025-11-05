export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro: string; // ISO string
  saldoTotal: number; // Suma de todas las deudas pendientes
}
