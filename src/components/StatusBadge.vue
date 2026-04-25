<template>
  <div 
    :class="[ 
      'inline-flex items-center justify-center gap-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-300 border min-w-[75px] shadow-sm', 
      badgeStyles.container 
    ]"
  >
    <!-- Punto indicador con resplandor -->
    <span :class="['h-1 w-1 rounded-full', badgeStyles.dot]"></span>
    <span class="leading-none">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  params: any;
}>();

const value = computed(() => props.params?.value || 'N/A');

const badgeStyles = computed(() => {
  switch (value.value) {
    case 'Pagado': 
      return {
        container: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
        dot: 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]'
      };
    case 'Moroso': 
      return {
        container: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5',
        dot: 'bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.5)]'
      };
    case 'Activo': 
      return {
        container: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5',
        dot: 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]'
      };
    case 'En Revisión': 
      return {
        container: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5',
        dot: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]'
      };
    default: 
      return {
        container: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400'
      };
  }
});
</script>
