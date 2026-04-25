<template>
  <div class="w-full h-full relative" ref="container">
    <svg ref="svgRef" class="w-full h-full"></svg>
    
    <!-- Tooltip -->
    <div 
      v-show="tooltip.show"
      class="absolute pointer-events-none z-50 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-opacity duration-200"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translate(-50%, -100%) translateY(-10px)' }"
    >
      <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{{ tooltip.state }}</p>
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-6">
          <span class="text-xs text-slate-400 font-medium whitespace-nowrap">Acreditados</span>
          <span class="text-xs font-bold text-white">{{ tooltip.count.toLocaleString() }}</span>
        </div>
        <div class="flex items-center justify-between gap-6">
          <span class="text-xs text-slate-400 font-medium whitespace-nowrap">Monto Total</span>
          <span class="text-xs font-bold text-emerald-400">$ {{ tooltip.monto.toLocaleString() }}</span>
        </div>
      </div>
      <!-- Progress mini-bar for relative volume -->
      <div class="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full" :style="{ width: tooltip.percent + '%' }"></div>
      </div>
    </div>

    <!-- Empty State / Loading -->
    <div v-if="!geoData" class="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4">
        <span class="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
        <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Mapa de México...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue';
import * as d3 from 'd3';
import type { Persona } from '../types';

const props = defineProps<{
  personas: Persona[];
  viewMode?: 'choropleth' | 'bubble';
  dataType?: 'count' | 'monto';
}>();

const container = ref<HTMLElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const geoData = ref<any>(null);

const tooltip = reactive({
  show: false,
  x: 0,
  y: 0,
  state: '',
  count: 0,
  monto: 0,
  percent: 0
});

// ─── Data Processing ──────────────────────────────────────────────────────────
const stateStats = computed(() => {
  const stats: Record<string, { count: number; monto: number }> = {};
  
  // Inicializar todos los estados conocidos (normalización de nombres si es necesario)
  props.personas.forEach(p => {
    if (!stats[p.estado]) stats[p.estado] = { count: 0, monto: 0 };
    stats[p.estado].count++;
    stats[p.estado].monto += p.monto_credito;
  });
  
  return stats;
});

const maxVal = computed(() => {
  const values = Object.values(stateStats.value).map(s => 
    props.dataType === 'monto' ? s.monto : s.count
  );
  return d3.max(values) || 1;
});

// ─── Map Logic ───────────────────────────────────────────────────────────────
async function loadGeoJson() {
  try {
    // Usamos un GeoJSON confiable de México (Estados)
    const res = await fetch('https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json');
    geoData.value = await res.json();
    drawMap();
  } catch (err) {
    console.error('Error cargando GeoJSON:', err);
  }
}

function drawMap() {
  if (!svgRef.value || !geoData.value || !container.value) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove(); // Limpiar previo

  const projection = d3.geoMercator()
    .center([-102, 24]) // Centro aproximado de México
    .scale(Math.min(width, height) * 1.5)
    .translate([width / 2, height / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

  // Escalas de color (Interpolación cinmática Premium)
  const colorScale = d3.scaleSequential(
    props.dataType === 'monto' ? d3.interpolateGreens : d3.interpolateBlues
  ).domain([0, maxVal.value]);

  const g = svg.append("g");

  // Dibujar Estados
  g.selectAll("path")
    .data(geoData.value.features)
    .enter()
    .append("path")
    .attr("d", (d: any) => pathGenerator(d))
    .attr("class", "state-path")
    .attr("fill", (d: any) => {
      if (props.viewMode === 'bubble') return "rgba(255,255,255,0.05)";
      const name = d.properties.name;
      const val = stateStats.value[name] ? (props.dataType === 'monto' ? stateStats.value[name].monto : stateStats.value[name].count) : 0;
      return val > 0 ? colorScale(val) : "rgba(255,255,255,0.03)";
    })
    .attr("stroke", "rgba(255,255,255,0.1)")
    .attr("stroke-width", 0.5)
    .style("transition", "fill 0.4s ease, stroke 0.4s ease")
    .on("mouseenter", function(event, d: any) {
      d3.select(this)
        .attr("stroke", "rgba(255,255,255,0.5)")
        .attr("stroke-width", 1.5)
        .raise();
      
      const name = d.properties.name;
      const stats = stateStats.value[name] || { count: 0, monto: 0 };
      const currentVal = props.dataType === 'monto' ? stats.monto : stats.count;

      tooltip.show = true;
      tooltip.state = name;
      tooltip.count = stats.count;
      tooltip.monto = stats.monto;
      tooltip.percent = (currentVal / maxVal.value) * 100;
      
      moveTooltip(event);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this)
        .attr("stroke", "rgba(255,255,255,0.1)")
        .attr("stroke-width", 0.5);
      tooltip.show = false;
    });

  // Burbujas si el modo está activo
  if (props.viewMode === 'bubble') {
    const bubbleScale = d3.scaleSqrt()
      .domain([0, maxVal.value])
      .range([0, 40]);

    g.selectAll("circle")
      .data(geoData.value.features)
      .enter()
      .append("circle")
      .attr("cx", (d: any) => pathGenerator.centroid(d)[0])
      .attr("cy", (d: any) => pathGenerator.centroid(d)[1])
      .attr("r", (d: any) => {
        const name = d.properties.name;
        const val = stateStats.value[name] ? (props.dataType === 'monto' ? stateStats.value[name].monto : stateStats.value[name].count) : 0;
        return val > 0 ? bubbleScale(val) : 0;
      })
      .attr("fill", props.dataType === 'monto' ? "rgba(52, 211, 153, 0.4)" : "rgba(59, 130, 246, 0.4)")
      .attr("stroke", props.dataType === 'monto' ? "#34d399" : "#60a5fa")
      .attr("stroke-width", 1)
      .attr("pointer-events", "none")
      .style("transition", "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)");
  }
}

function moveTooltip(event: MouseEvent) {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  tooltip.x = event.clientX - rect.left;
  tooltip.y = event.clientY - rect.top;
}

// ─── Lifecycle & Watchers ───────────────────────────────────────────────────
onMounted(() => {
  loadGeoJson();
  
  const resizeObserver = new ResizeObserver(() => {
    drawMap();
  });
  if (container.value) resizeObserver.observe(container.value);
});

watch([() => props.personas, () => props.viewMode, () => props.dataType, geoData], () => {
  drawMap();
}, { deep: true });

</script>

<style scoped>
.state-path {
  cursor: pointer;
}
</style>
