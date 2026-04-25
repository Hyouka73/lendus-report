// src/services/reporting/pdfMakeService.ts
import type { Persona } from '../../types';

/**
 * Servicio para exportación de tablas detalladas usando PDFMake.
 * Ideal para grandes volúmenes de datos en formato tabular.
 */
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

export async function exportTableWithPdfMake(
  rows: Persona[], 
  filtersText: string, 
  columns?: { header: string; field: keyof Persona }[]
): Promise<void> {
  const pdfMakeInstance = (pdfMake as any).default || pdfMake;
  const vfsInstance = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;
  
  (pdfMakeInstance as any).vfs = vfsInstance;

  // Definimos columnas por defecto si no se pasan
  const activeCols = columns || [
    { header: 'Acreditado', field: 'nombre' },
    { header: 'RFC', field: 'rfc' },
    { header: 'Estado', field: 'estado' },
    { header: 'Monto Crédito', field: 'monto_credito' },
    { header: 'Estatus', field: 'estatus' },
  ];

  // Inyectamos la columna de Salud del Crédito de forma consistente
  const displayCols = [
    ...activeCols,
    { header: 'Salud del Crédito', field: 'salud_credito' as any }
  ];

  const tableHeader = displayCols.map(col => ({
    text: col.header,
    style: 'tableHeader',
    alignment: (col.field === 'monto_credito' || col.field === 'saldo_pendiente') 
      ? 'right' 
      : (col.field === 'salud_credito' ? 'center' : 'left')
  }));

  const tableRows = rows.map(p => displayCols.map(col => {
    // Caso especial: Columna Visual de Salud del Crédito
    if (col.field === 'salud_credito') {
      const progreso = Math.min(100, Math.max(0, (1 - (p.saldo_pendiente / p.monto_credito)) * 100));
      
      let colorCode = '#3B82F6'; // Azul: Activo (default)
      if (p.estatus === 'Pagado' || progreso >= 100) {
        colorCode = '#10B981'; // Verde
      } else if (p.estatus === 'Moroso') {
        colorCode = '#EF4444'; // Rojo
      }

      return {
        margin: [0, 2, 0, 0],
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: 80,
            h: 6,
            color: '#E2E8F0',
            r: 3
          },
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: (progreso / 100) * 80,
            h: 6,
            color: colorCode,
            r: 3
          }
        ]
      };
    }

    let val = p[col.field as keyof Persona];
    
    if (col.field === 'monto_credito' || col.field === 'saldo_pendiente') {
      return { 
        text: `$${(val as number).toLocaleString('es-MX')}`, 
        alignment: 'right', 
        style: 'mono' 
      };
    }
    if (col.field === 'rfc' || col.field === 'curp') {
      return { text: val as string, style: 'mono' };
    }
    return { text: String(val) };
  }));

  const tableBody = [tableHeader, ...tableRows];

  const docDefinition = {
    pageOrientation: 'landscape' as const,
    pageMargins: [30, 60, 30, 40] as [number, number, number, number],
    header: { 
      text: 'LENDUS — Reporte Detallado de Cartera', 
      style: 'headerText', 
      margin: [30, 20, 30, 0] as [number, number, number, number] 
    },
    footer: (currentPage: number, pageCount: number) => ({ 
      text: `Página ${currentPage} de ${pageCount}`, 
      style: 'footerText', 
      margin: [30, 0, 30, 15] as [number, number, number, number] 
    }),
    content: [
      { text: 'Reporte de Operaciones', style: 'title', margin: [0, 0, 0, 5] as [number, number, number, number] },
      { text: `Filtros aplicados: ${filtersText}`, style: 'subtitle', margin: [0, 0, 0, 15] as [number, number, number, number] },
      {
        table: { 
          headerRows: 1, 
          widths: displayCols.map(col => col.field === 'salud_credito' ? 80 : 'auto'),
          body: tableBody 
        },
        layout: 'lightHorizontalLines'
      },
    ],
    styles: {
      headerText: { fontSize: 8, color: '#94A3B8', alignment: 'right' as const },
      footerText: { fontSize: 8, color: '#94A3B8', alignment: 'center' as const },
      title: { fontSize: 16, bold: true, color: '#0F172A' },
      subtitle: { fontSize: 9, color: '#64748B' },
      tableHeader: { bold: true, fillColor: '#F8FAFC', color: '#0F172A', fontSize: 9 },
      mono: { fontSize: 8, color: '#475569', bold: true }
    },
    defaultStyle: { fontSize: 8, color: '#334155' },
  };

  pdfMakeInstance.createPdf(docDefinition as any).download(`Lendus_Tabla_${new Date().getTime()}.pdf`);
}
