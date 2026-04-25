<template>
  <div class="flex flex-col gap-4 h-full w-full">
    
    <div class="rounded-xl p-5 bg-slate-800 border border-slate-700 shadow-lg flex-1 min-h-[250px]">
      <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        📊 Top 10 Estados por Créditos
      </h3>
      <svg ref="barRef" class="w-full" :height="barHeight" />
    </div>

    <div class="rounded-xl p-5 bg-slate-800 border border-slate-700 shadow-lg flex-1 min-h-[250px] flex flex-col">
      <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        🍩 Distribución por Estatus
      </h3>
      <div class="flex items-center gap-8 my-auto justify-center">
        <svg ref="donutRef" width="160" height="160" class="drop-shadow-lg" />
        <div class="flex flex-col gap-3 text-sm">
          <div v-for="item in donutData" :key="item.label" class="flex items-center gap-3">
            <span class="w-3 h-3 rounded-full shadow-sm" :style="{ background: item.color }" />
            <span class="text-slate-300 w-24">{{ item.label }}</span>
            <span class="font-bold text-white bg-slate-900 px-2 py-1 rounded">{{ item.pct }}%</span>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as d3 from 'd3';
import type { Persona } from '../types';

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps<{ personas: Persona[] }>();

const barRef  = ref<SVGSVGElement | null>(null);
const donutRef = ref<SVGSVGElement | null>(null);
const barHeight = 220;

const STATUS_COLORS: Record<string, string> = {
  'Activo':      '#3B82F6',
  'Pagado':      '#10B981',
  'Moroso':      '#EF4444',
  'En Revisión': '#F59E0B',
};

// ─── Donut data reactivo ─────────────────────────────────────────────────────
const donutData = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of props.personas) {
    counts[p.estatus] = (counts[p.estatus] ?? 0) + 1;
  }
  const total = props.personas.length || 1;
  return Object.entries(counts).map(([label, count]) => ({
    label,
    count,
    color: STATUS_COLORS[label] ?? '#64748B',
    pct: ((count / total) * 100).toFixed(1),
  }));
});

// ─── Bar Chart: Top 10 estados ───────────────────────────────────────────────
function renderBar() {
  if (!barRef.value) return;
  const svg = d3.select(barRef.value);
  svg.selectAll('*').remove();

  const w = barRef.value.getBoundingClientRect().width || 400;
  const margin = { top: 10, right: 20, bottom: 60, left: 50 };
  const innerW = w - margin.left - margin.right;
  const innerH = barHeight - margin.top - margin.bottom;

  // Agrupar por estado
  const byEstado = d3.rollup(props.personas, (v) => v.length, (d) => d.estado);
  const top10 = [...byEstado.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const x = d3.scaleBand().domain(top10.map((d) => d[0])).range([0, innerW]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(top10, (d) => d[1]) ?? 1]).nice().range([innerH, 0]);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Barras
  g.selectAll('rect')
    .data(top10)
    .join('rect')
    .attr('x', (d) => x(d[0])!)
    .attr('y', (d) => y(d[1]))
    .attr('width', x.bandwidth())
    .attr('height', (d) => innerH - y(d[1]))
    .attr('rx', 4)
    .attr('fill', '#3B82F6')
    .attr('opacity', 0.85);

  // Eje X
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('fill', '#94A3B8').attr('font-size', 10)
    .attr('transform', 'rotate(-35)').attr('text-anchor', 'end');

  g.selectAll('.domain, .tick line').attr('stroke', '#334155');

  // Eje Y
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2s')))
    .selectAll('text').attr('fill', '#94A3B8').attr('font-size', 10);
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function renderDonut() {
  if (!donutRef.value) return;
  const svg = d3.select(donutRef.value);
  svg.selectAll('*').remove();

  const size = 160;
  const radius = size / 2;
  const arc = d3.arc<d3.PieArcDatum<(typeof donutData.value)[0]>>()
    .innerRadius(radius * 0.55)
    .outerRadius(radius * 0.9);

  const pie = d3.pie<(typeof donutData.value)[0]>().value((d) => d.count).sort(null);
  const arcs = pie(donutData.value);

  const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

  g.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', (d) => d.data.color)
    .attr('stroke', '#0F172A')
    .attr('stroke-width', 2);
}

function render() { renderBar(); renderDonut(); }

onMounted(() => render());
watch(() => props.personas, () => render(), { deep: false });
</script>
