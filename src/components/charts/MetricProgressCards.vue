<template>
  <div class="w-full h-full p-1 overflow-hidden select-none" ref="container">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
      
      <!-- Metric Cards with Enhanced Visibility -->
      <div v-for="axis in axes" :key="axis.key" 
           class="group bg-gradient-to-br from-white/[0.04] to-transparent rounded-[2rem] p-6 border border-white/5 hover:border-white/20 transition-all duration-700 flex flex-col gap-6 shadow-inner">
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              {{ axis.icon }}
            </div>
            <div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{{ axis.name }}</h4>
              <p class="text-[9px] text-slate-500 font-bold uppercase mt-1 opacity-60 italic">Average Category Index</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-5">
          <div v-for="stat in stats[axis.key]" :key="stat.name" class="flex flex-col gap-2">
            <div class="flex items-end justify-between px-1">
              <span class="text-[11px] font-black text-slate-300 uppercase tracking-tight">{{ stat.name }}</span>
              <span class="text-sm font-black text-white italic tracking-tighter">{{ axis.format(stat.value) }}</span>
            </div>
            
            <!-- Deluxe Progress Bar -->
            <div class="h-2.5 w-full bg-slate-900/50 rounded-full overflow-hidden relative border border-white/[0.05] shadow-inner">
              <div 
                class="h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-125"
                :style="{ 
                  width: Math.min(100, (stat.value / axis.max * 100)) + '%', 
                  background: `linear-gradient(90deg, ${CATEGORY_COLORS[stat.name]}99, ${CATEGORY_COLORS[stat.name]})`,
                  boxShadow: `0 0 15px ${CATEGORY_COLORS[stat.name]}44`
                }"
              >
                <!-- Shine effect -->
                <div class="absolute inset-0 bg-white/10 opacity-30 mask-gradient" style="mask-image: linear-gradient(90deg, transparent, white, transparent)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';

const props = defineProps<{ 
  stats: Record<string, any[]> 
}>();

const CATEGORY_COLORS: Record<string, string> = {
  'Personal': '#3B82F6',   
  'Nómina': '#F59E0B',     
  'Automotriz': '#EF4444', 
  'Hipotecario': '#10B981', 
  'PyME': '#8B5CF6'         
};

const axes = [
  { name: 'Monto de Crédito', key: 'monto_credito', icon: '💰', max: 500000, format: (v: number) => `$${d3.format(",.0f")(v)}` },
  { name: 'Saldo Pendiente', key: 'saldo_pendiente', icon: '⚖️', max: 400000, format: (v: number) => `$${d3.format(",.0f")(v)}` }
];
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
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
