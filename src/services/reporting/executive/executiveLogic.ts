// src/services/reporting/executive/executiveLogic.ts
import type { Persona } from '../../../types';
import type { DatosReporte } from './types';

/**
 * El "Cerebro": Procesa la data cruda, realiza cálculos financieros y
 * devuelve un objeto estrictamente tipado para el generador de PDF.
 */
export function processExecutiveData(rows: Persona[], periodo: { inicio: string; fin: string }): DatosReporte {
  let montoOriginado = 0;
  let saldoTotal = 0;
  let weightedInterestSum = 0; // Para el rendimiento ponderado
  let sumaEdad = 0;
  let carteraRiesgo = 0;
  
  const countGeneros = { M: 0, F: 0, X: 0 };
  const volumenPorEstado: Record<string, number> = {};
  const volumenPorProducto: Record<string, number> = {};
  const totalCuentas = rows.length;

  for (const p of rows) {
    const monto = p.monto_credito || 0;
    montoOriginado += monto;
    saldoTotal += p.saldo_pendiente || 0;
    
    // Rendimiento: Tasa de interés promedio ponderada
    weightedInterestSum += (p.tasa_interes || 0) * monto;
    
    sumaEdad += p.edad || 0;
    
    if (p.estatus === 'Moroso') {
      carteraRiesgo += p.saldo_pendiente || 0;
    }

    if (p.genero in countGeneros) {
      countGeneros[p.genero as keyof typeof countGeneros]++;
    }

    volumenPorEstado[p.estado] = (volumenPorEstado[p.estado] || 0) + monto;
    volumenPorProducto[p.producto] = (volumenPorProducto[p.producto] || 0) + monto;
  }

  const capitalRecuperado = montoOriginado - saldoTotal;
  
  // Tasa promedio ponderada: sum(tasa * monto) / sum(monto)
  const tasaPonderada = montoOriginado > 0 ? weightedInterestSum / montoOriginado : 0;
  
  const edadPromedio = totalCuentas > 0 ? sumaEdad / totalCuentas : 0;
  const indiceMorosidad = montoOriginado > 0 ? (carteraRiesgo / montoOriginado) * 100 : 0;

  // Top 3 Estados por Volumen de Dinero
  const topEstados = Object.entries(volumenPorEstado)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([estado, vol]) => ({
      estado,
      volumen: `$${vol.toLocaleString('es-MX')}`
    }));

  // Distribución por Producto para la Gráfica
  const distribucionProductos = Object.entries(volumenPorProducto)
    .sort(([, a], [, b]) => b - a)
    .map(([producto, monto]) => ({
      producto,
      monto: `$${monto.toLocaleString('es-MX')}`
    }));

  const formatPercent = (val: number) => totalCuentas > 0 
    ? `${((val / totalCuentas) * 100).toFixed(2)}%` 
    : '0.00%';

  const observaciones: string[] = [
    `Análisis de cartera de alta fidelidad sobre ${totalCuentas.toLocaleString()} registros.`,
    `Capital Recuperado de $${capitalRecuperado.toLocaleString('es-MX')}, reflejando eficiencia operativa.`,
    indiceMorosidad > 10 
      ? `ALERTA CRÍTICA: La morosidad ponderada (${indiceMorosidad.toFixed(2)}%) supera el umbral de riesgo institucional.` 
      : `Estabilidad de cartera confirmada con un índice de morosidad controlado del ${indiceMorosidad.toFixed(2)}%.`,
    `Rendimiento Financiero: La tasa ponderada del ${tasaPonderada.toFixed(2)}% optimiza el valor del portafolio.`
  ];

  return {
    periodo: `${periodo.inicio} al ${periodo.fin}`,
    kpisPrincipales: {
      montoOriginado: `$${montoOriginado.toLocaleString('es-MX')}`,
      saldoPendienteTotal: `$${saldoTotal.toLocaleString('es-MX')}`,
      capitalRecuperado: `$${capitalRecuperado.toLocaleString('es-MX')}`,
      carteraEnRiesgo: `$${carteraRiesgo.toLocaleString('es-MX')}`,
    },
    metricasOperativas: {
      tasaInteresPromedio: `${tasaPonderada.toFixed(2)}%`,
      edadPromedio: `${edadPromedio.toFixed(1)} años`,
      indiceMorosidad: `${indiceMorosidad.toFixed(2)}%`,
      totalCuentas: totalCuentas.toLocaleString(),
    },
    distribucionGeografica: topEstados,
    distribucionDemografica: {
      m: formatPercent(countGeneros.M),
      f: formatPercent(countGeneros.F),
      x: formatPercent(countGeneros.X),
    },
    distribucionProductos,
    observaciones,
    fechaEmision: new Date().toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }),
  };
}
