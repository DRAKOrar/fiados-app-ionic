export interface Cliente {
  id: string;
  nombre: string;
  cedula?: string; // NUEVO
  telefono?: string;
  email?: string; // NUEVO
  direccion?: string;
  fechaRegistro: string; // ISO string
  saldoTotal: number; // Suma de todas las deudas pendientes
  notas?: string; // NUEVO - Notas adicionales del cliente
}
