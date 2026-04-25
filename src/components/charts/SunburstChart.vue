<template>
  <div class="absolute inset-0 flex items-center justify-center overflow-hidden" ref="container">
    <svg ref="svgRef" class="w-full h-full overflow-visible"></svg>
    
    <!-- Central Label (Deluxe) -->
    <div 
      v-if="selectedNode" 
      class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10 p-4"
    >
      <div class="flex flex-col items-center transition-all duration-300 transform scale-110">
        <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5 opacity-60">
          {{ selectedNode.parent ? selectedNode.parent.data.name : 'VISTA GLOBAL' }}
        </span>
        <span class="text-2xl font-black text-white leading-none whitespace-nowrap tracking-tight drop-shadow-2xl">
          {{ selectedNode.data.name }}
        </span>
        <div class="h-0.5 w-12 bg-emerald-500/30 my-2 rounded-full"></div>
        <span class="text-sm font-black text-emerald-400 uppercase tracking-widest tabular-nums italic">
          $ {{ (selectedNode.value / 1000000).toFixed(1) }}M
        </span>
        <span class="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-tighter">
          {{ ((selectedNode.value / (selectedNode.parent?.value || selectedNode.value)) * 100).toFixed(1) }}% de la rama
        </span>
      </div>
    </div>

    <!-- Instructions -->
    <div class="absolute bottom-4 left-4 flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Interactúa para explorar detalles</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{ data: any }>();
const container = ref<HTMLElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const selectedNode = ref<any>(null);

function drawChart() {
  if (!svgRef.value || !container.value || !props.data) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  if (width === 0 || height === 0) return;

  const radius = Math.min(width, height) / 2;

  const svg = d3.select(svgRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
    
  svg.selectAll("*").remove();

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const root = d3.hierarchy(props.data)
    .sum(d => d.value)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const partition = d3.partition().size([2 * Math.PI, radius * 0.9]);
  partition(root);

  const arc = d3.arc<any>()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius / 2)
    .cornerRadius(4);

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(props.data.children.map((c: any) => c.name));

  selectedNode.value = root;

  const path = g.selectAll("path")
    .data(root.descendants().filter(d => d.depth > 0))
    .join("path")
    .attr("display", d => d.depth ? null : "none")
    .attr("d", arc)
    .attr("fill", (d: any) => {
      let curr = d;
      while (curr.depth > 1) curr = curr.parent;
      return colorScale(curr.data.name) as string;
    })
    .attr("fill-opacity", d => (d.depth === 1 ? 0.8 : 0.4))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1)
    .style("cursor", "pointer");

  path.on("mouseenter", function(_event, d) {
    d3.select(this)
      .transition().duration(200)
      .attr("fill-opacity", 1)
      .attr("stroke-width", 2)
      .attr("stroke", "white");
    
    selectedNode.value = d;
  })
  .on("mouseleave", function(_event, d) {
    d3.select(this)
      .transition().duration(200)
      .attr("fill-opacity", d.depth === 1 ? 0.8 : 0.4)
      .attr("stroke-width", 1)
      .attr("stroke", "#0f172a");
    
    selectedNode.value = root;
  });

  // Animación de entrada
  path.transition()
    .duration(1000)
    .delay((_d, i) => i * 10)
    .attrTween("d", function(d: any) {
      const i = d3.interpolate({ x0: d.x0, x1: d.x0 } as any, d);
      return (t: number) => arc(i(t)) || "";
    });
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
