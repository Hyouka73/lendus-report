<template>
  <div class="absolute inset-0 flex items-center justify-center overflow-hidden" ref="container">
    <svg ref="svgRef" class="w-full h-full overflow-visible"></svg>
    
    <!-- Central Info -->
    <div class="absolute flex flex-col items-center justify-center text-center pointer-events-none">
      <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Monto Total</span>
      <span class="text-2xl font-black text-white leading-none">$ {{ (totalMonto / 1000000).toFixed(1) }}M</span>
      <span class="text-[10px] font-bold text-blue-400/80 mt-1 uppercase">{{ totalCount.toLocaleString() }} Créditos</span>
    </div>

    <!-- Tooltip -->
    <div 
      v-show="tooltip.show"
      class="absolute pointer-events-none z-50 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-200"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translate(-50%, -100%) translateY(-15px)' }"
    >
      <div class="flex items-center gap-2 mb-1.5">
        <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: tooltip.color, boxShadow: `0 0 10px ${tooltip.color}40` }"></div>
        <p class="text-xs font-black text-white uppercase tracking-wider">{{ tooltip.label }}</p>
      </div>
      <div class="flex flex-col gap-1.5 min-w-[140px]">
        <div class="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5">
          <span class="text-[10px] text-white/40 uppercase font-bold">Participación</span>
          <span class="text-xs font-black text-white">{{ tooltip.pct }}%</span>
        </div>
        <div class="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5">
          <span class="text-[10px] text-white/40 uppercase font-bold">Monto Acum.</span>
          <span class="text-xs font-black" :style="{ color: tooltip.color }">$ {{ (tooltip.monto / 1000000).toFixed(2) }}M</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, computed } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{
  data: any[];
}>();

const container = ref<HTMLElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const tooltip = reactive({
  show: false,
  x: 0,
  y: 0,
  label: '',
  monto: 0,
  pct: '',
  color: ''
});

const totalMonto = computed(() => d3.sum(props.data, d => d.monto) || 1);
const totalCount = computed(() => d3.sum(props.data, d => d.count) || 0);

function drawChart() {
  if (!svgRef.value || !container.value || !props.data.length) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  if (width === 0 || height === 0) return;

  const size = Math.min(width, height) * 0.95;
  const radius = size / 2;
  const innerRadius = radius * 0.65;
  const outerRadius = radius * 0.88;
  const cornerRadius = 8;
  const padAngle = 0.03;

  const svg = d3.select(svgRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
    
  svg.selectAll("*").remove();

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const pie = d3.pie<any>()
    .value(d => d.monto)
    .sort(null)
    .padAngle(padAngle);

  const arc = d3.arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(cornerRadius);

  const arcHover = d3.arc<any>()
    .innerRadius(innerRadius - 4)
    .outerRadius(outerRadius + 8)
    .cornerRadius(cornerRadius + 2);

  const arcs = pie(props.data);

  // Filtro de brillo para hover
  const filter = svg.append("defs")
    .append("filter")
    .attr("id", "glow");
  filter.append("feGaussianBlur")
    .attr("stdDeviation", "3")
    .attr("result", "blur");
  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "blur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  const path = g.selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", (d: any) => colorScale(d.data.name) as string)
    .attr("fill-opacity", 0.8)
    .attr("stroke", (d: any) => colorScale(d.data.name) as string)
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.5)
    .style("cursor", "pointer")
    .each(function() { (this as any)._current = { startAngle: 0, endAngle: 0 }; });

  path.transition()
    .duration(1200)
    .ease(d3.easeElasticOut.amplitude(0.5).period(0.6))
    .delay((_d, i) => i * 150)
    .attrTween("d", function(d: any) {
      const interpolate = d3.interpolate((this as any)._current, d);
      (this as any)._current = interpolate(0);
      return (t) => arc(interpolate(t)) || "";
    });

  // Interacciones
  path.on("mouseenter", function(event, d: any) {
    d3.select(this)
      .transition().duration(400)
      .attr("d", arcHover(d))
      .attr("fill-opacity", 1)
      .attr("filter", "url(#glow)");

    tooltip.show = true;
    tooltip.label = d.data.name;
    tooltip.monto = d.data.monto;
    tooltip.pct = ((d.data.monto / totalMonto.value) * 100).toFixed(1);
    tooltip.color = colorScale(d.data.name) as string;
    moveTooltip(event);
  })
  .on("mousemove", moveTooltip)
  .on("mouseleave", function(_event, d: any) {
    d3.select(this)
      .transition().duration(400)
      .attr("d", arc(d))
      .attr("fill-opacity", 0.8)
      .attr("filter", null);
    tooltip.show = false;
  });
}

function moveTooltip(event: MouseEvent) {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  tooltip.x = event.clientX - rect.left;
  tooltip.y = event.clientY - rect.top;
}

let resizeTimer: any;
let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  drawChart();
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawChart, 100);
  });
  if (container.value) resizeObserver.observe(container.value);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  clearTimeout(resizeTimer);
});

watch(() => props.data, () => drawChart());
</script>

<style scoped>
.leading-none { line-height: 1; }
</style>
