<template>
  <!-- ─── App.vue — Dashboard Principal de Lendus Reporting ─────────────── -->
  <div class="flex h-screen overflow-hidden text-slate-100" style="background: transparent;">

    <!-- ── Sidebar ────────────────────────────────────────────────────────── -->
    <aside
      class="flex flex-col shrink-0 transition-all duration-300 relative z-20 backdrop-blur-xl bg-slate-900/60 border-r border-white/10 shadow-2xl"
      :class="sidebarOpen ? 'w-64' : 'w-20'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-4 px-5 h-20 shrink-0 border-b border-white/5">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-lg text-white shadow-lg shadow-blue-500/20"
             style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">L</div>
          Lendus Reporting
        <button class="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" @click="sidebarOpen = !sidebarOpen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  :d="sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'" />
          </svg>
        </button>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 flex flex-col gap-2 p-3 mt-4">
        <button
          v-for="item in navItems" :key="item.id"
          class="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm transition-all duration-300 relative group overflow-hidden"
          :class="activeView === item.id ? 'text-white' : 'text-slate-400 hover:text-white'"
          @click="activeView = item.id as ViewId"
        >
          <!-- Active Background Indicator -->
          <div v-if="activeView === item.id" class="absolute inset-0 bg-blue-500/20 border border-blue-400/30 rounded-xl transition-opacity"></div>
          <div v-else class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          
          <span class="relative z-10 text-xl leading-none" :class="{ 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]': activeView === item.id }">{{ item.icon }}</span>
          <span v-if="sidebarOpen" class="relative z-10 font-medium tracking-wide whitespace-nowrap">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Stats pill -->
      <div v-if="sidebarOpen" class="px-5 py-6 shrink-0 border-t border-white/5 bg-slate-900/40">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Registros cargados</p>
        <p class="font-black text-3xl tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          {{ personas.length.toLocaleString('es-MX') }}
        </p>
      </div>
    </aside>

    <!-- ── Main Content ────────────────────────────────────────────────────── -->
    <main class="flex-1 flex flex-col min-w-0 h-full relative z-10">

      <!-- Header -->
      <header class="flex items-center justify-between px-8 h-20 shrink-0 backdrop-blur-md bg-slate-900/40 border-b border-white/5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            {{ currentView?.label }}
          </h1>
          <p class="text-sm mt-1 text-slate-400 font-medium">
            {{ selectedRows.length > 0 ? `${selectedRows.length} filas seleccionadas` : 'Motor de Análisis Dinámico' }}
          </p>
        </div>

        <!-- Acciones -->
        <div class="flex items-center gap-4">
          <!-- Indicador de carga -->
          <div v-if="loading" class="flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400">
            <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            Cargando Base de Datos…
          </div>

        </div>
      </header>

      <!-- KPI Strip -->
      <div v-if="!loading && activeView !== 'analytics' && activeView !== 'database'" class="flex gap-5 px-8 pt-6 pb-2 shrink-0">
        <div v-for="kpi in kpis" :key="kpi.label"
             class="flex-1 rounded-2xl p-5 flex flex-col gap-1 relative overflow-hidden backdrop-blur-xl bg-slate-800/40 border border-white/10 shadow-xl group hover:-translate-y-1 hover:bg-slate-800/60 transition-all duration-300">
          <!-- Subtle glow indicator -->
          <div class="absolute -inset-1 bg-gradient-to-b opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" :style="{ backgroundImage: `linear-gradient(to bottom, ${kpi.color}, transparent)` }"></div>
          
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider relative z-10">{{ kpi.label }}</p>
          <p class="text-2xl font-black tracking-tight relative z-10" :style="{ color: kpi.color }">{{ kpi.value }}</p>
        </div>
      </div>

      <!-- Main Layout Body (Unified Grid Dashboard) -->
      <div class="flex-1 overflow-y-auto p-8 pt-4 pb-8 flex flex-col gap-6">
        
        <div v-if="loading" class="flex-1 flex items-center justify-center flex-col gap-5 text-slate-400 backdrop-blur-sm rounded-3xl border border-white/5 bg-slate-900/20">
          <span class="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
          <p class="text-lg font-medium tracking-wide">Descargando JSON (100k registros)…</p>
        </div>

        <template v-else>
          <div class="flex-1 flex flex-col gap-6">
            <!-- 1. DASHBOARD SUMMARY -->
            <div v-if="activeView === 'dashboard'" class="flex-1 flex flex-col gap-6">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div class="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/40">
                  <MexicoMap :personas="personas" />
                </div>
                <div class="flex flex-col gap-6">
                  <StatsChart :personas="personas" />
                </div>
              </div>
            </div>

            <!-- 2. TERRITORIAL VIEW -->
            <div v-else-if="activeView === 'territorial'" class="flex-1 flex flex-col gap-6 overflow-hidden">
              <!-- Sidebar de Filtros e Info -->
              <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                <!-- Mapa Principal -->
                <div class="flex-1 min-h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/20 relative">
                  <MexicoMap 
                    :personas="filteredTerritorial" 
                    :view-mode="mapViewMode"
                    :data-type="mapDataType"
                  />
                  
                  <!-- Overlays para el mapa -->
                  <div class="absolute top-6 left-6 flex flex-col gap-3">
                    <div class="bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-2xl">
                      <button 
                        @click="mapViewMode = 'choropleth'"
                        class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        :class="mapViewMode === 'choropleth' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                      >
                        Coroplético
                      </button>
                      <button 
                        @click="mapViewMode = 'bubble'"
                        class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        :class="mapViewMode === 'bubble' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                      >
                        Burbujas
                      </button>
                    </div>

                    <div class="bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-2xl">
                      <button 
                        @click="mapDataType = 'count'"
                        class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        :class="mapDataType === 'count' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                      >
                        Nº Clientes
                      </button>
                      <button 
                        @click="mapDataType = 'monto'"
                        class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        :class="mapDataType === 'monto' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                      >
                        Monto Total
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Filtros -->
                <div class="w-full lg:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pr-2">
                  <div class="p-6 rounded-3xl bg-slate-800/40 border border-white/10 backdrop-blur-xl shadow-xl">
                    <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                       🔍 Filtros Geográficos
                    </h3>
                    
                    <div class="flex flex-col gap-5">
                      <!-- Estatus -->
                      <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estatus Cartera</label>
                        <select v-model="filters.estatus" class="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                          <option value="all">Todos los estatus</option>
                          <option value="Activo">Activo</option>
                          <option value="Moroso">Moroso</option>
                          <option value="Pagado">Pagado</option>
                          <option value="En Revisión">En Revisión</option>
                        </select>
                      </div>

                      <!-- Producto -->
                      <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Producto</label>
                        <select v-model="filters.producto" class="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                          <option value="all">Todos los productos</option>
                          <option value="Personal">Personal</option>
                          <option value="Nómina">Nómina</option>
                          <option value="Automotriz">Automotriz</option>
                          <option value="Hipotecario">Hipotecario</option>
                          <option value="PyME">PyME</option>
                        </select>
                      </div>

                      <!-- Monto Mínimo -->
                      <div class="flex flex-col gap-2">
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto Mínimo (MXN)</label>
                        <input type="range" v-model.number="filters.minMonto" min="0" max="500000" step="10000" class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        <div class="flex justify-between text-[11px] text-slate-400 font-medium">
                          <span>$0</span>
                          <span class="text-blue-400 font-bold">$ {{ filters.minMonto.toLocaleString() }}</span>
                        </div>
                      </div>

                      <button 
                        @click="resetFilters"
                        class="mt-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                      >
                        Reiniciar Filtros
                      </button>
                    </div>
                  </div>

                  <!-- Ranking Quick View -->
                  <div class="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 backdrop-blur-xl shadow-xl flex-1">
                    <h3 class="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 text-center justify-center">
                       🏆 Top 5 Estados
                    </h3>
                    <div class="flex flex-col gap-3">
                      <div v-for="(item, idx) in topStates" :key="item.name" class="flex items-center justify-between group">
                        <div class="flex items-center gap-3">
                          <span class="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">{{ idx + 1 }}</span>
                          <span class="text-sm font-medium text-slate-300">{{ item.name }}</span>
                        </div>
                        <span class="text-sm font-bold text-white">{{ mapDataType === 'monto' ? `$${(item.value / 1_000_000).toFixed(1)}M` : item.value.toLocaleString() }}</span>
                      </div>
                      <div v-if="topStates.length === 0" class="text-center py-4 text-slate-500 text-xs">Sin datos con filtros actuales</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. ADVANCED ANALYTICS (D3) -->
            <div v-else-if="activeView === 'analytics'" class="flex-1 overflow-y-auto">
              <AdvancedCharts :personas="personas" />
            </div>

            <!-- 4. DATABASE EXPLORER -->
            <div v-else-if="activeView === 'database'" class="flex-1 flex flex-col bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden">
              <DataGrid :rowData="filteredTerritorial" @selection-changed="selectedRows = $event" />
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted } from 'vue';
import DataGrid   from './components/DataGrid.vue';
import MexicoMap  from './components/MexicoMap.vue';
import StatsChart from './components/StatsChart.vue';
import AdvancedCharts from './components/AdvancedCharts.vue';

import type { Persona } from './types';

// ─── State ────────────────────────────────────────────────────────────────────
type ViewId = 'dashboard' | 'territorial' | 'analytics' | 'database';

// Usamos shallowRef para inmensa mejora en rendimiento (AG Grid recomienda shallowRef en Vue 3 para >5k filas)
const personas      = shallowRef<Persona[]>([]); 
const selectedRows  = ref<Persona[]>([]);
const loading       = ref(true);
const sidebarOpen   = ref(true);
const activeView    = ref<ViewId>('dashboard');



// ─── Territorial Filters & Modes ────────
const mapViewMode = ref<'choropleth' | 'bubble'>('choropleth');
const mapDataType = ref<'count' | 'monto'>('count');
const filters = ref({
  estatus: 'all',
  producto: 'all',
  minMonto: 0,
});

function resetFilters() {
  filters.value = { estatus: 'all', producto: 'all', minMonto: 0 };
}

const filteredTerritorial = computed(() => {
  return personas.value.filter(p => {
    if (filters.value.estatus !== 'all' && p.estatus !== filters.value.estatus) return false;
    if (filters.value.producto !== 'all' && p.producto !== filters.value.producto) return false;
    if (p.monto_credito < filters.value.minMonto) return false;
    return true;
  });
});

const topStates = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of filteredTerritorial.value) {
    counts[p.estado] = (counts[p.estado] ?? 0) + (mapDataType.value === 'count' ? 1 : p.monto_credito);
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
});

const navItems = [
  { id: 'dashboard',   icon: '📊', label: 'Monitor de Cartera' },
  { id: 'territorial', icon: '🗺️', label: 'Análisis Territorial' },
  { id: 'analytics',   icon: '🔬', label: 'Analítica Avanzada' },
  { id: 'database',    icon: '💾', label: 'Base de Datos' },
];

const currentView = computed(() => navItems.find((n) => n.id === activeView.value));

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  if (!personas.value.length) return [];
  const total  = personas.value.length;
  // Optimizando recuento con 1 bucle for en vez de múltiples arrays y filtros
  let monto = 0, moroso = 0, activo = 0;
  for (let i = 0; i < total; i++) {
    const p = personas.value[i];
    monto += p.monto_credito;
    if (p.estatus === 'Moroso') moroso++;
    else if (p.estatus === 'Activo') activo++;
  }
  
  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
  return [
    { label: 'Volumen Operativo',   value: total.toLocaleString('es-MX'),             color: '#f8fafc' },
    { label: 'Cartera de Crédito',  value: fmt(monto),                                color: '#34d399' },
    { label: 'Contratos Activos',   value: activo.toLocaleString('es-MX'),            color: '#60a5fa' },
    { label: 'Cuentas en Mora',     value: moroso.toLocaleString('es-MX'),            color: '#f87171' },
    { label: 'Índice Morosidad',    value: `${((moroso / total) * 100).toFixed(1)}%`, color: '#fbbf24' },
  ];
});


// ─── Cargar datos vía Fetch ───────────────────────────────────────────────────
onMounted(async () => {
  try {
    const response = await fetch('/data.json');
    if (response.ok) {
      personas.value = (await response.json()) as Persona[];
    } else {
      console.error('No se pudo encontrar data.json, ¿corriste el script de generación?');
    }
  } catch (error) {
    console.error('Error cargando el JSON de datos:', error);
  } finally {
    loading.value = false;
  }
});


</script>
