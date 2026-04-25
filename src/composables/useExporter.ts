// src/composables/useExporter.ts
import type { Persona } from '../types';
import { exportTableWithPdfMake } from '../services/reporting/pdfMakeService';
import { processExecutiveData } from '../services/reporting/executive/executiveLogic';
import { drawExecutiveReport } from '../services/reporting/executive/executiveView';

/**
 * Composables Orchestrator para la exportación de reportes.
 * Centraliza la lógica de decisión sobre qué motor y servicio utilizar.
 */
export function useExporter() {
  
  /**
   * Exportación tabular detallada usando PDFMake.
   */
  async function exportTableData(
    rows: Persona[], 
    filtersText = 'Sin filtros', 
    columns?: { header: string; field: keyof Persona }[]
  ) {
    console.log(`[Orchestrator] Iniciando exportación PDFMake para ${rows.length} registros.`);
    await exportTableWithPdfMake(rows, filtersText, columns);
  }

  /**
   * Exportación de resumen ejecutivo premium usando PDF-Lib.
   * Divide la responsabilidad entre Logic (Cerebro) y View (Pintor).
   */
  async function exportExecutiveReport(rows: Persona[], rango: { inicio: string; fin: string }) {
    console.log(`[Orchestrator] Iniciando Reporte Ejecutivo para periodo ${rango.inicio} - ${rango.fin}`);

    // 1. El Cerebro calcula la data
    const datosProcesados = processExecutiveData(rows, rango);

    // 2. El Pintor genera el binario
    const pdfBytes = await drawExecutiveReport(datosProcesados);

    // 3. Descarga del archivo
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lendus_Ejecutivo_${new Date().getTime()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { 
    exportTableData, 
    exportExecutiveReport 
  };
}