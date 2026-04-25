<template>
  <div class="flex flex-col gap-6 h-full px-2">
    <div v-if="dashboardData" class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-16">
      
      <!-- 1. Mix de Productos (Donut Chart) -->
      <div class="rounded-[2rem] bg-slate-800/40 border border-white/10 p-6 flex flex-col gap-5 shadow-2xl backdrop-blur-xl group hover:bg-slate-800/60 transition-all duration-500 min-h-[400px] hover:z-50">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.25em]">Donut Chart</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Mix de Productos</h3>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">🍩</div>
        </div>
        <div class="flex-1 relative min-h-0">
          <DonutChart :data="dashboardData.donutData" />
        </div>
      </div>

      <!-- 2. Métricas de Rendimiento (Metric Progress Cards) -->
      <div class="rounded-[2.5rem] bg-slate-800/30 border border-white/5 p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-3xl group hover:bg-slate-800/50 transition-all duration-700 min-h-[400px] hover:z-50">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.25em]">Progress Analytics</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Métricas de Rendimiento</h3>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">📊</div>
        </div>
        <div class="flex-1 relative min-h-0 overflow-hidden">
          <MetricProgressCards :stats="dashboardData.metricStats" />
        </div>
      </div>

      <!-- 3. Distribución de Montos (Area Chart) -->
      <div class="rounded-[2.5rem] bg-slate-800/30 border border-white/5 p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-3xl group hover:bg-slate-800/50 transition-all duration-700 min-h-[400px] hover:z-50">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.25em]">Multi-Series Spline Chart</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Historial de Colocación</h3>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">📉</div>
        </div>
        <div class="flex-1 relative min-h-0">
          <AreaSplineChart :data="dashboardData.splineData" />
        </div>
      </div>

      <!-- 4. Explorador Jerárquico (Sunburst Chart) -->
      <div class="rounded-[2.5rem] bg-slate-800/30 border border-white/5 p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-3xl group hover:bg-slate-800/50 transition-all duration-700 min-h-[400px] hover:z-50">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.25em]">Sunburst Chart</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Explorador Jerárquico</h3>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">⏹</div>
        </div>
        <div class="flex-1 relative min-h-0">
          <SunburstChart :data="dashboardData.sunburstData" />
        </div>
      </div>

      <!-- 5. Composición Estatal (Wide Vertical Bar Chart) -->
      <div class="lg:col-span-2 rounded-[3.5rem] bg-slate-800/30 border border-white/5 p-10 flex flex-col gap-6 shadow-2xl backdrop-blur-3xl group hover:bg-slate-800/50 transition-all duration-700 min-h-[500px] hover:z-50">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[9px] font-black text-purple-500/60 uppercase tracking-[0.25em]">Vertical Stacked Bar Chart</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Composición Estatal (32 Estados)</h3>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">🗺️</div>
        </div>
        <div class="flex-1 relative min-h-0">
          <StackedBarChart :data="dashboardData.stackedBarData" />
        </div>
      </div>

    </div>
    
    <!-- Loading state if data is still processing -->
    <div v-else class="flex-1 flex items-center justify-center min-h-[600px]">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p class="text-slate-400 font-medium">Procesando Inteligencia de Negocios...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Persona } from '../types';
import DonutChart from './charts/DonutChart.vue';
import MetricProgressCards from './charts/MetricProgressCards.vue';
import SunburstChart from './charts/SunburstChart.vue';
import AreaSplineChart from './charts/AreaSplineChart.vue';
import StackedBarChart from './charts/StackedBarChart.vue';

const props = defineProps<{
  personas: Persona[];
}>();

type ProductType = 'Personal' | 'Nómina' | 'Automotriz' | 'Hipotecario' | 'PyME';
const PRODUCTS: ProductType[] = ['Personal', 'Nómina', 'Automotriz', 'Hipotecario', 'PyME'];
const METRIC_KEYS = ['monto_credito', 'tasa_interes', 'edad', 'saldo_pendiente'] as const;

// --- Optimized Single-Pass Aggregation ---
const dashboardData = computed(() => {
  if (!props.personas.length) return null;

  // 1. Initial Structures
  const donutMap = new Map<ProductType, { monto: number, count: number }>();
  const metricMap = new Map<ProductType, Record<string, { sum: number, count: number }>>();
  const timeMap = new Map<number, { total: number } & Record<ProductType, number>>();
  const stateMap = new Map<string, { total: number } & Record<ProductType, number>>();

  // Initialize
  PRODUCTS.forEach(p => {
    donutMap.set(p, { monto: 0, count: 0 });
    metricMap.set(p, {
      monto_credito: { sum: 0, count: 0 },
      tasa_interes: { sum: 0, count: 0 },
      edad: { sum: 0, count: 0 },
      saldo_pendiente: { sum: 0, count: 0 }
    });
  });

  // 2. The Single Pass
  for (let i = 0; i < props.personas.length; i++) {
    const p = props.personas[i];
    const prod = p.producto as ProductType;
    const monto = p.monto_credito;
    const date = new Date(p.fecha_registro);
    // Group by Day for maximum detail
    const dayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const state = p.estado;

    // Donut
    const d = donutMap.get(prod)!;
    d.monto += monto;
    d.count++;

    // Metrics
    const m = metricMap.get(prod)!;
    METRIC_KEYS.forEach(k => {
      m[k].sum += p[k];
      m[k].count++;
    });

    // Time (Spline)
    let tm = timeMap.get(dayTime);
    if (!tm) {
      tm = { total: 0 } as any;
      PRODUCTS.forEach(pr => tm![pr] = 0);
      timeMap.set(dayTime, tm!);
    }
    tm!.total += monto;
    tm![prod] += monto;

    // State (Stacked)
    let st = stateMap.get(state);
    if (!st) {
      st = { total: 0 } as any;
      PRODUCTS.forEach(pr => st![pr] = 0);
      stateMap.set(state, st!);
    }
    st!.total += monto;
    st![prod] += monto;
  }

  // 3. Formatting Results
  
  // Donut
  const donutData = Array.from(donutMap, ([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.monto - a.monto);

  // Metrics
  const metricStats: Record<string, any[]> = {};
  METRIC_KEYS.forEach(k => {
    metricStats[k] = PRODUCTS.map(p => ({
      name: p,
      value: (metricMap.get(p)![k].sum / metricMap.get(p)![k].count) || 0
    })).sort((a, b) => b.value - a.value);
  });

  // Spline (Daily - Non-cumulative)
  const sortedDays = Array.from(timeMap.keys()).sort((a, b) => a - b);
  const splineData = sortedDays.map(time => {
    const tm = timeMap.get(time)!;
    return {
      date: new Date(time),
      Total: tm.total,
      ...Object.fromEntries(PRODUCTS.map(p => [p, tm[p]]))
    };
  });

  // Sunburst (Simplified hierarchical structure from single pass)
  const sunburstData = {
    name: "Total",
    children: PRODUCTS.map(p => ({
      name: p,
      children: Array.from(stateMap.entries())
        .map(([state, val]) => ({ name: state, value: val[p] }))
        .filter(s => s.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    }))
  };

  // Stacked Bar
  const stackedBarData = Array.from(stateMap, ([estado, val]) => ({
    estado,
    total: val.total,
    ...Object.fromEntries(PRODUCTS.map(p => [p, val[p]]))
  })).sort((a, b) => b.total - a.total);

  return { donutData, metricStats, splineData, sunburstData, stackedBarData };
});
</script>

<style scoped>
.rounded-3xl {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, border-color 0.3s ease;
}
.rounded-3xl:hover {
  border-color: rgba(255, 255, 255, 0.2);
}
</style>