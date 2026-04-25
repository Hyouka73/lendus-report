// src/services/reporting/executive/types.ts

/**
 * Interfaz estricta para el intercambio de datos entre la lógica de cálculo
 * y el motor de renderizado de PDF-Lib.
 */
export interface DatosReporte {
  periodo: string;
  kpisPrincipales: {
    montoOriginado: string;
    saldoPendienteTotal: string;
    capitalRecuperado: string;
    carteraEnRiesgo: string;
  };
  metricasOperativas: {
    tasaInteresPromedio: string;
    edadPromedio: string;
    indiceMorosidad: string;
    totalCuentas: string;
  };
  distribucionGeografica: {
    estado: string;
    volumen: string;
  }[];
  distribucionDemografica: {
    m: string;
    f: string;
    x: string;
  };
  distribucionProductos: {
    producto: string;
    monto: string;
  }[];
  observaciones: string[];
  fechaEmision: string;
}
