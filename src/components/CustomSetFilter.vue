<template>
  <div class="p-4 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl text-slate-200 text-xs w-56 font-sans">
    
    <div class="mb-3 pb-3 border-b border-white/10 relative">
      <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input 
        type="text" 
        v-model="searchTerm" 
        placeholder="Buscar..." 
        class="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-8 pr-2 outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-500"
      >
    </div>

    <div class="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
      
      <label class="flex items-center gap-2 cursor-pointer group p-1 hover:bg-white/5 rounded-lg transition-colors">
        <input 
          type="checkbox" 
          :checked="isAllSelected" 
          @change="toggleAll" 
          class="custom-checkbox"
        >
        <span class="font-bold text-slate-300 group-hover:text-white">(Seleccionar Todo)</span>
      </label>

      <label 
        v-for="option in filteredOptions" 
        :key="option" 
        class="flex items-center gap-2 cursor-pointer group p-1 hover:bg-white/5 rounded-lg transition-colors"
      >
        <input 
          type="checkbox" 
          :value="option" 
          v-model="selectedOptions" 
          @change="onChange" 
          class="custom-checkbox"
        >
        <span class="text-slate-300 group-hover:text-white">{{ option }}</span>
      </label>

      <div v-if="filteredOptions.length === 0" class="text-center py-2 text-slate-500">
        Sin coincidencias
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// AG Grid inyecta automáticamente 'params' a los filtros custom
const props = defineProps<{ params: any }>();

const allOptions = ref<string[]>([]);
const selectedOptions = ref<string[]>([]);
const searchTerm = ref('');

// Al montar, extraemos los valores únicos de la columna (Ej: 'Personal', 'PyME', etc.)
onMounted(() => {
  const uniqueValues = new Set<string>();
  // Iteramos sobre los datos cargados en el grid
  props.params.api.forEachLeafNode((node: any) => {
    if (node.data && node.data[props.params.colDef.field]) {
      uniqueValues.add(node.data[props.params.colDef.field]);
    }
  });
  
  allOptions.value = Array.from(uniqueValues).sort();
  selectedOptions.value = [...allOptions.value]; // Por defecto, todo seleccionado
});

// Filtro de búsqueda interna
const filteredOptions = computed(() => {
  if (!searchTerm.value) return allOptions.value;
  const lowerSearch = searchTerm.value.toLowerCase();
  return allOptions.value.filter(opt => opt.toLowerCase().includes(lowerSearch));
});

const isAllSelected = computed(() => selectedOptions.value.length === allOptions.value.length);

const toggleAll = (event: Event) => {
  const isChecked = (event.target as HTMLInputElement).checked;
  selectedOptions.value = isChecked ? [...allOptions.value] : [];
  onChange();
};

const onChange = () => {
  // Notificamos a AG Grid que el filtro cambió
  props.params.filterChangedCallback();
};

// ─── MÉTODOS OBLIGATORIOS DE AG GRID PARA FILTROS CUSTOM ───
const isFilterActive = () => selectedOptions.value.length !== allOptions.value.length;

// Le dice a la tabla qué filas dejar pasar
const doesFilterPass = (params: any) => {
  const cellValue = params.data[props.params.colDef.field];
  return selectedOptions.value.includes(cellValue);
};

// Guarda el estado del filtro (útil si reinicias el grid)
const getModel = () => isFilterActive() ? { values: selectedOptions.value } : null;
const setModel = (model: any) => {
  selectedOptions.value = model ? model.values : [...allOptions.value];
};

// Mandatory for AG Grid to check if filter needs refreshing
const refresh = () => {
  return true;
};

// Exponemos los métodos para que AG Grid los pueda ejecutar
defineExpose({ isFilterActive, doesFilterPass, getModel, setModel, refresh });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); }

/* Reutilizamos el checkbox del grid si es global o lo definimos aquí */
.custom-checkbox {
  appearance: none; width: 14px; height: 14px; border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05);
  cursor: pointer; position: relative; transition: all 0.2s ease;
}
.custom-checkbox:checked { background: #3b82f6; border-color: #3b82f6; }
.custom-checkbox:checked::after {
  content: ''; position: absolute; top: 1px; left: 3px; width: 3.5px; height: 7px;
  border: solid white; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg);
}
</style>
