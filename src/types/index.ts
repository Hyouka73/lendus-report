/**
 * ─── Data Types: Persona ─────────────────────────────────────────────────────
 * Definición central del modelo de datos para los acreditados (Personas)
 * utilizado en el Dashboard de Lendus.
 */

export interface Persona {
  id: string;
  nombre: string;
  rfc: string;
  curp: string;
  estado: string;
  monto_credito: number;
  saldo_pendiente: number;
  estatus: 'Pagado' | 'Moroso' | 'Activo' | 'En Revisión';
  producto: 'Personal' | 'Nómina' | 'Automotriz' | 'Hipotecario' | 'PyME';
  genero: 'M' | 'F' | 'X';
  edad: number;
  tasa_interes: number;
  fecha_registro: string;
}
