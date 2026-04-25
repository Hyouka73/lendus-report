// src/services/reporting/executive/chartGenerator.ts
import * as d3 from 'd3';

/**
 * Genera una gráfica de Barras Horizontales con diseño ejecutivo.
 * Soluciona problemas de legibilidad de segmentos pequeños y solapamiento.
 */
export async function generateProductChart(data: { producto: string; monto: string }[]): Promise<string> {
  const width = 1000;
  const height = 500;
  const margin = { top: 80, right: 180, bottom: 50, left: 180 };
  const contentWidth = width - margin.left - margin.right;
  const contentHeight = height - margin.top - margin.bottom;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fondo blanco impecable
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const processedData = data.map(d => ({
    label: d.producto,
    value: parseFloat(d.monto.replace(/[$,]/g, '')) || 0
  })).sort((a, b) => b.value - a.value);

  const maxValue = d3.max(processedData, d => d.value) || 1;
  const totalValue = d3.sum(processedData, d => d.value) || 1;

  // Escalas
  const yScale = d3.scaleBand()
    .domain(processedData.map(d => d.label))
    .range([0, contentHeight])
    .padding(0.4);

  const xScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, contentWidth]);

  // Paleta Lendus Core
  const colors = ['#0f172a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa'];

  // Dibujar cada barra
  processedData.forEach((d, i) => {
    const y = (yScale(d.label) || 0) + margin.top;
    const barWidth = xScale(d.value);
    const barHeight = yScale.bandwidth();
    const percentage = ((d.value / totalValue) * 100).toFixed(1);

    // 1. Barra con gradiente
    const gradient = ctx.createLinearGradient(margin.left, 0, margin.left + barWidth, 0);
    gradient.addColorStop(0, colors[i % colors.length]);
    gradient.addColorStop(1, colors[i % colors.length] + 'CC');
    
    ctx.fillStyle = gradient;
    
    // Rectángulo redondeado manual para compatibilidad
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + barWidth - r, y);
    ctx.quadraticCurveTo(margin.left + barWidth, y, margin.left + barWidth, y + r);
    ctx.lineTo(margin.left + barWidth, y + barHeight - r);
    ctx.quadraticCurveTo(margin.left + barWidth, y + barHeight, margin.left + barWidth - r, y + barHeight);
    ctx.lineTo(margin.left, y + barHeight);
    ctx.closePath();
    ctx.fill();

    // 2. Nombre del Producto (Izquierda)
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 22px Helvetica';
    ctx.textAlign = 'right';
    ctx.fillText(d.label, margin.left - 20, y + barHeight / 2 + 8);

    // 3. Monto y Porcentaje (Derecha de la barra)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Helvetica';
    ctx.textAlign = 'left';
    ctx.fillText(`$${d.value.toLocaleString('es-MX')}`, margin.left + barWidth + 15, y + barHeight / 2 + 8);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Helvetica';
    ctx.fillText(`(${percentage}%)`, margin.left + barWidth + 15, y + barHeight / 2 + 28);
  });

  // Título
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 32px Helvetica';
  ctx.textAlign = 'center';
  ctx.fillText('CONCENTRACIÓN DE CARTERA POR PRODUCTO', width / 2, 45);

  // Línea de base sutil
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + contentHeight);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}
