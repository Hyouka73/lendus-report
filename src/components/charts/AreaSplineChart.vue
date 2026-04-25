<template>
  <div class="absolute inset-0 flex flex-col gap-4 select-none" ref="container">
    <!-- Interactive Legend -->
    <div class="flex flex-wrap gap-2 px-1">
      <button 
        v-for="series in legendItems" 
        :key="series.key"
        @click="toggleSeries(series.key)"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
        :class="[
          activeSeries[series.key] 
            ? 'bg-slate-700/50 border-white/20 text-white shadow-lg' 
            : 'bg-transparent border-white/5 text-slate-500 opacity-40 hover:opacity-100'
        ]"
      >
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: series.color }"></span>
        <span class="text-[9px] font-black uppercase tracking-widest">{{ series.name }}</span>
      </button>
    </div>

    <div class="flex-1 relative min-h-0">
      <svg ref="svgRef" class="w-full h-full overflow-hidden"></svg>
      
      <!-- Multi-Series Tooltip -->
      <div 
        v-show="tooltip.show"
        class="absolute pointer-events-none z-[100] px-5 py-4 rounded-[2rem] bg-slate-950/90 shadow-[0_25px_70px_rgba(0,0,0,0.8)] border border-white/20 backdrop-blur-3xl transition-all duration-200 ease-out"
        :style="{ 
          left: tooltip.x + 'px', 
          top: tooltip.y + 'px', 
          transform: `translate(${tooltip.x > (containerWidth / 2) ? '-100%' : '0%'}, ${tooltip.y < 100 ? '20px' : '-100%'}) translate(${tooltip.x > (containerWidth / 2) ? '-20px' : '20px'}, ${tooltip.y < 100 ? '0' : '-20px'})`
        }"
      >
        <div class="flex flex-col gap-3 min-w-[160px]">
          <div class="flex flex-col gap-0.5">
            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ tooltip.date }}</span>
            <p class="text-sm font-black text-white">Historial de Colocación</p>
          </div>
          <div class="h-px bg-white/5"></div>
          <div class="flex flex-col gap-2">
            <template v-for="item in tooltip.items" :key="item.name">
              <div v-show="activeSeries[item.key]" class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: item.color }"></div>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{{ item.name }}</span>
                </div>
                <span class="text-xs font-black text-white italic">$ {{ (item.value / 1000000).toFixed(1) }}M</span>
              </div>
            </template>
            <div class="h-px bg-white/10 my-1"></div>
            <div v-show="activeSeries['Total']" class="flex justify-between items-center text-white">
              <span class="text-[10px] font-black uppercase">TOTAL</span>
              <span class="text-sm font-black italic">$ {{ (tooltip.total / 1000000).toFixed(1) }}M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{
  data: any[];
}>();

const container = ref<HTMLElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const containerWidth = ref(0);

const products = ['Personal', 'Nómina', 'Automotriz', 'Hipotecario', 'PyME'];
const CATEGORY_COLORS: Record<string, string> = {
  'Personal': '#3B82F6', 
  'Nómina': '#F59E0B', 
  'Automotriz': '#EF4444', 
  'Hipotecario': '#10B981', 
  'PyME': '#8B5CF6',
  'Total': '#FFFFFF'
};

const legendItems = [
  ...products.map(p => ({ name: p, key: p, color: CATEGORY_COLORS[p] })),
  { name: 'Total Cartera', key: 'Total', color: '#FFFFFF' }
];

const activeSeries = reactive<Record<string, boolean>>({
  'Personal': true, 'Nómina': true, 'Automotriz': true, 'Hipotecario': true, 'PyME': true, 'Total': true
});

const tooltip = reactive({ 
  show: false, x: 0, y: 0, date: '', 
  items: [] as { name: string, key: string, value: number, color: string }[],
  total: 0
});

function toggleSeries(key: string) {
  activeSeries[key] = !activeSeries[key];
  drawChart();
}

function drawChart() {
  if (!svgRef.value || !container.value || !props.data.length) return;

  const width = container.value.clientWidth;
  const height = svgRef.value.parentElement?.clientHeight || 300;
  if (width === 0 || height === 0) return;

  const margin = { top: 10, right: 20, bottom: 30, left: 50 };

  const svg = d3.select(svgRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
    
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const data = props.data;
  
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Total) || 1])
    .range([innerHeight, 0])
    .nice();

  // Grid
  g.append("g")
    .attr("opacity", 0.03)
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
    .select(".domain").remove();

  // Area/Line Generators
  const areaGen = d3.area<any>()
    .curve(d3.curveBasis)
    .x(d => x(d.date))
    .y0(innerHeight)
    .y1(d => y(d.value));

  const lineGen = d3.line<any>()
    .curve(d3.curveBasis)
    .x(d => x(d.date))
    .y(d => y(d.value));

  // Draw Series
  const seriesToDraw = [...products, 'Total'].filter(p => activeSeries[p]);

  const defs = svg.append("defs");

  seriesToDraw.forEach(prod => {
    const color = CATEGORY_COLORS[prod];
    const isTotal = prod === 'Total';
    
    const gradId = `grad-${prod.replace(/\s/g, '')}`;
    const grad = defs.append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", isTotal ? 0.2 : 0.1);
    grad.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0);

    const seriesData = data.map(d => ({ date: d.date, value: d[prod] }));

    g.append("path")
      .datum(seriesData)
      .attr("fill", `url(#${gradId})`)
      .attr("d", areaGen as any);

    g.append("path")
      .datum(seriesData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", isTotal ? 3 : 1.5)
      .attr("stroke-opacity", isTotal ? 1 : 0.7)
      .attr("d", lineGen as any);
  });

  // Axes
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b") as any).tickSize(0));
    
  xAxis.select(".domain").remove();
  xAxis.selectAll(".tick text")
    .attr("fill", "#475569")
    .attr("font-size", "10px")
    .attr("font-weight", "800")
    .attr("dy", "1.5em");

  const yAxis = g.append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d => `$${(Number(d) / 1000000).toFixed(0)}M`).tickSize(0));
    
  yAxis.select(".domain").remove();
  yAxis.selectAll(".tick text")
    .attr("fill", "#475569")
    .attr("font-size", "9px")
    .attr("font-weight", "900")
    .attr("dx", "-1em");

  // Interaction Overlay
  const overlay = g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  const bisect = d3.bisector((d: any) => d.date).left;

  overlay.on("mousemove", function(event) {
    const mouseX = d3.pointer(event)[0];
    const dateVal = x.invert(mouseX);
    const i = bisect(data, dateVal, 1);
    const d = data[i - 1];
    if (!d) return;

    tooltip.show = true;
    tooltip.x = x(d.date) + margin.left;
    tooltip.y = y(d.Total) + margin.top;
    tooltip.date = d3.timeFormat("%d %B %Y")(d.date);
    tooltip.total = d.Total;
    tooltip.items = products.map(p => ({
      name: p,
      key: p,
      value: d[p],
      color: CATEGORY_COLORS[p]
    }));
  });

  overlay.on("mouseleave", () => {
    tooltip.show = false;
  });

  containerWidth.value = width;
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
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
</style>
