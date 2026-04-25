<template>
  <div class="absolute inset-0 overflow-hidden" ref="container">
    <div class="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
      <svg ref="svgRef" class="w-full h-full min-w-[1000px] overflow-visible"></svg>
    </div>
    
    <!-- Premium Tooltip -->
    <div 
      v-show="tooltip.show"
      class="absolute pointer-events-none z-50 px-5 py-4 rounded-[1.5rem] bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-3xl transition-all duration-150"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translate(-50%, -100%) translateY(-20px)' }"
    >
      <div class="flex flex-col gap-2 min-w-[140px]">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ tooltip.estado }}</span>
          <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: tooltip.color }"></div>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs font-black text-white italic opacity-80">{{ tooltip.producto }}</span>
          <span class="text-xl font-black text-white">$ {{ (tooltip.monto / 1000000).toFixed(1) }}<span class="text-[10px] text-slate-500 ml-0.5 font-bold uppercase">M</span></span>
        </div>
        <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-2">
          <div class="h-full rounded-full transition-all duration-500" :style="{ width: tooltip.pct + '%', backgroundColor: tooltip.color }"></div>
        </div>
        <div class="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1">
          <span class="opacity-60">Mix State Pct</span>
          <span>{{ tooltip.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{ data: any[] }>();
const container = ref<HTMLElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const tooltip = reactive({ show: false, x: 0, y: 0, estado: '', producto: '', monto: 0, pct: '', color: '' });

function drawChart() {
  if (!svgRef.value || !container.value || !props.data.length) return;

  const width = Math.max(container.value.clientWidth, 1000); // Minimum width for 32 states
  const height = container.value.clientHeight - 60; // Padding for tilted labels
  if (width === 0 || height === 0) return;

  const margin = { top: 30, right: 30, bottom: 100, left: 60 };

  const svg = d3.select(svgRef.value)
    .attr("width", width)
    .attr("height", height + margin.bottom);
    
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Constants
  const products = ['Personal', 'Nómina', 'Automotriz', 'Hipotecario', 'PyME'];
  const CATEGORY_COLORS: Record<string, string> = {
    'Personal': '#3B82F6', 
    'Nómina': '#F59E0B', 
    'Automotriz': '#EF4444', 
    'Hipotecario': '#10B981', 
    'PyME': '#8B5CF6'
  };
  
  const processedData = props.data;

  // Escalas
  const xScale = d3.scaleBand()
    .domain(processedData.map(d => d.estado))
    .range([0, innerWidth])
    .padding(0.35);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.total) || 1])
    .range([innerHeight, 0])
    .nice();

  const stack = d3.stack().keys(products);
  const series = stack(processedData as any);

  // Background Grid (Vertical)
  g.append("g")
    .attr("opacity", 0.03)
    .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""))
    .select(".domain").remove();

  // Drawing Segments
  const layer = g.selectAll(".layer")
    .data(series)
    .join("g")
    .attr("class", "layer")
    .attr("fill", d => CATEGORY_COLORS[d.key]);

  layer.selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", (d: any) => xScale(d.data.estado) || 0)
    .attr("y", (d: any) => yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("fill-opacity", 0.8)
    .attr("rx", 3)
    .style("cursor", "pointer")
    .on("mouseenter", function(event, d: any) {
      const parent = (this as any).parentNode;
      if (!parent) return;
      const producto = d3.select(parent as any).datum() as any;
      const val = d[1] - d[0];
      if (val === 0) return;

      d3.select(this)
        .transition().duration(200)
        .attr("fill-opacity", 1)
        .attr("transform", "translate(0, -2)");
        
      tooltip.show = true;
      tooltip.estado = d.data.estado;
      tooltip.producto = producto.key;
      tooltip.monto = val;
      tooltip.pct = ((val / d.data.total) * 100).toFixed(1);
      tooltip.color = CATEGORY_COLORS[producto.key];
      moveTooltip(event);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function() {
      d3.select(this)
        .transition().duration(200)
        .attr("fill-opacity", 0.8)
        .attr("transform", "translate(0, 0)");
      tooltip.show = false;
    })
    .transition()
    .duration(1200)
    .delay((_d, i) => i * 15)
    .attr("height", (d: any) => Math.max(0, yScale(d[0]) - yScale(d[1])));

  // X Axis (Tilted Labels)
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).tickSize(0));

  xAxis.select(".domain").remove();
    
  xAxis.selectAll(".tick text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "10px")
    .style("font-weight", "800")
    .attr("fill", "#64748b")
    .attr("dx", "-0.8em")
    .attr("dy", "0.5em")
    .text(d => String(d).toLowerCase().replace(/\b\w/g, c => c.toUpperCase()));

  // Y Axis
  const yAxis = g.append("g")
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `$${(Number(d) / 1000000).toFixed(0)}M`).tickSize(0));
    
  yAxis.select(".domain").remove();
  yAxis.selectAll(".tick text")
    .style("font-size", "10px")
    .style("font-weight", "900")
    .attr("fill", "#475569")
    .attr("dx", "-1em");
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
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>