// src/services/reporting/executive/executiveView.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DatosReporte } from './types';

// ─── HELPER: Algoritmo para salto de línea automático ────────────────────────
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function drawExecutiveReport(datos: DatosReporte, graficaBase64: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Tamaño Carta
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Paleta de colores minimalista y robusta
  const colors = {
    primary: rgb(0.06, 0.09, 0.16),      // Slate 950
    secondary: rgb(0.39, 0.45, 0.55),    // Slate 500
    accent: rgb(0.15, 0.38, 0.96),       // Blue 600
    dangerNeon: rgb(1, 0, 0.3),          // Rojo Neón (Morosidad)
    divider: rgb(0.88, 0.90, 0.94),      // Slate 200 (Sutil)
  };

  const margin = 50;
  const contentWidth = width - (margin * 2);

  // ─── 1. HEADER DINÁMICO ─────────────────────────────────────────────────────
  let currentY = height - 60;

  page.drawText('RESUMEN EJECUTIVO', { 
    x: margin, 
    y: currentY, 
    size: 20, 
    font: fontBold, 
    color: colors.primary 
  });
  
  page.drawText('PORTAFOLIO DE CARTERA LENDUS', { 
    x: margin, 
    y: currentY - 14, 
    size: 10, 
    font: fontRegular, 
    color: colors.secondary 
  });

  const dateText = `Corte: ${datos.periodo}`;
  const dateWidth = fontRegular.widthOfTextAtSize(dateText, 10);
  page.drawText(dateText, { 
    x: width - margin - dateWidth, 
    y: currentY, 
    size: 10, 
    font: fontBold, 
    color: colors.accent 
  });

  currentY -= 35;
  page.drawLine({ 
    start: { x: margin, y: currentY }, 
    end: { x: width - margin, y: currentY }, 
    thickness: 1.5, 
    color: colors.primary 
  });

  // ─── 2. KPIs PRINCIPALES (OPEN GRID) ────────────────────────────────────────
  currentY -= 30;
  const kpiColWidth = contentWidth / 4;

  const drawKpi = (x: number, y: number, label: string, value: string, isDanger = false) => {
    page.drawText(label, { x, y, size: 7.5, font: fontBold, color: colors.secondary });
    page.drawText(value, { 
      x, 
      y: y - 18, 
      size: 13, 
      font: fontBold, 
      color: isDanger ? colors.dangerNeon : colors.primary 
    });
  };

  drawKpi(margin, currentY, 'MONTO ORIGINADO', datos.kpisPrincipales.montoOriginado);
  drawKpi(margin + kpiColWidth, currentY, 'SALDO PENDIENTE', datos.kpisPrincipales.saldoPendienteTotal);
  drawKpi(margin + kpiColWidth * 2, currentY, 'CAPITAL RECUPERADO', datos.kpisPrincipales.capitalRecuperado);
  drawKpi(margin + kpiColWidth * 3, currentY, 'CARTERA EN RIESGO', datos.kpisPrincipales.carteraEnRiesgo, true);

  currentY -= 40;
  page.drawLine({ 
    start: { x: margin, y: currentY }, 
    end: { x: width - margin, y: currentY }, 
    thickness: 0.8, 
    color: colors.divider 
  });

  // ─── 3. MÉTRICAS OPERATIVAS ─────────────────────────────────────────────────
  currentY -= 25;
  drawKpi(margin, currentY, 'TOTAL CUENTAS', datos.metricasOperativas.totalCuentas);
  drawKpi(margin + kpiColWidth, currentY, 'ÍNDICE MOROSIDAD', datos.metricasOperativas.indiceMorosidad, parseFloat(datos.metricasOperativas.indiceMorosidad) > 10);
  drawKpi(margin + kpiColWidth * 2, currentY, 'RENDIMIENTO POND.', datos.metricasOperativas.tasaInteresPromedio);
  drawKpi(margin + kpiColWidth * 3, currentY, 'EDAD PROM.', datos.metricasOperativas.edadPromedio);

  currentY -= 40;
  page.drawLine({ 
    start: { x: margin, y: currentY }, 
    end: { x: width - margin, y: currentY }, 
    thickness: 0.8, 
    color: colors.divider 
  });

  // ─── 4. GRÁFICA DE CONCENTRACIÓN (D3.JS) ────────────────────────────────────
  if (graficaBase64) {
    try {
      // Limpiar prefijo base64 si existe
      const base64Data = graficaBase64.replace(/^data:image\/\w+;base64,/, '');
      const chartImage = await pdfDoc.embedPng(base64Data);
      
      const chartHeight = 230; // Mantener relación de aspecto profesional
      currentY -= (chartHeight + 25);

      page.drawImage(chartImage, {
        x: margin,
        y: currentY,
        width: contentWidth,
        height: chartHeight,
      });

      currentY -= 15; // Espacio post-gráfica
    } catch (error) {
      console.error('[PDF-Lib] Error al incrustar la gráfica:', error);
      currentY -= 20;
    }
  }

  // ─── 5. CUERPO TÉCNICO ──────────────────────────────────────────────────────
  currentY -= 25;
  const leftColWidth = contentWidth * 0.35;
  const rightColX = margin + leftColWidth + 30;
  const rightColWidth = contentWidth - leftColWidth - 30;

  // --- Geografía y Demografía ---
  page.drawText('DESGLOSE TERRITORIAL (TOP 3 VOL.)', { x: margin, y: currentY, size: 8.5, font: fontBold, color: colors.accent });
  let geoY = currentY - 22;
  datos.distribucionGeografica.forEach(g => {
    page.drawText(g.estado, { x: margin, y: geoY, size: 9, font: fontBold, color: colors.primary });
    const volWidth = fontRegular.widthOfTextAtSize(g.volumen, 9);
    page.drawText(g.volumen, { x: margin + leftColWidth - volWidth, y: geoY, size: 9, font: fontRegular, color: colors.secondary });
    geoY -= 16;
  });

  geoY -= 20;
  page.drawText('COMPOSICIÓN DEMOGRÁFICA', { x: margin, y: geoY, size: 8.5, font: fontBold, color: colors.accent });
  geoY -= 22;
  const demoEntries = [
    { label: 'Masculino (M)', val: datos.distribucionDemografica.m },
    { label: 'Femenino (F)', val: datos.distribucionDemografica.f },
    { label: 'No Binario / X', val: datos.distribucionDemografica.x }
  ];
  demoEntries.forEach(d => {
    page.drawText(d.label, { x: margin, y: geoY, size: 9, font: fontRegular, color: colors.primary });
    const valWidth = fontRegular.widthOfTextAtSize(d.val, 9);
    page.drawText(d.val, { x: margin + leftColWidth - valWidth, y: geoY, size: 9, font: fontRegular, color: colors.secondary });
    geoY -= 16;
  });

  // --- Observaciones con Wrapping ---
  page.drawText('OBSERVACIONES CLAVE Y HALLAZGOS', { x: rightColX, y: currentY, size: 8.5, font: fontBold, color: colors.accent });
  let obsY = currentY - 22;
  datos.observaciones.forEach(obs => {
    const lines = wrapText(obs, rightColWidth - 15, fontRegular, 9);
    
    // Bullet minimalista
    page.drawSquare({ x: rightColX, y: obsY + 2, size: 3, color: colors.accent });
    
    lines.forEach(line => {
      page.drawText(line, { x: rightColX + 12, y: obsY, size: 9, font: fontRegular, color: colors.primary });
      obsY -= 13;
    });
    obsY -= 8;
  });

  // ─── 6. FOOTER DE PRECISIÓN ─────────────────────────────────────────────────
  const footerY = 45;
  page.drawLine({ start: { x: margin, y: footerY + 15 }, end: { x: width - margin, y: footerY + 15 }, thickness: 0.5, color: colors.divider });
  
  const footerLegal = 'Lendus Fintech S.A. de C.V. | Confidencial y de Uso Interno';
  page.drawText(footerLegal, { x: margin, y: footerY, size: 7, font: fontRegular, color: colors.secondary });

  const footerEmission = `Emitido: ${datos.fechaEmision} | Pág. 1 de 1`;
  const emissionWidth = fontRegular.widthOfTextAtSize(footerEmission, 7);
  page.drawText(footerEmission, { 
    x: width - margin - emissionWidth, 
    y: footerY, 
    size: 7, 
    font: fontRegular, 
    color: colors.secondary 
  });

  return await pdfDoc.save();
}
