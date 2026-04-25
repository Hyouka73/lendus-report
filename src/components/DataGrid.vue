<template>
  <div class="w-full h-full flex flex-col bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-white/10 transition-all duration-500 hover:shadow-blue-500/10 hover:border-white/20">
    
    <div class="h-16 shrink-0 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950 z-30">
      <div class="flex items-center gap-4 flex-1 max-w-md">
        <div class="relative w-full group">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            v-model="quickFilterText"
            placeholder="Buscar..."
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div class="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
        <div class="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
          <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">Corte:</span>
        </div>
        
        <div class="flex items-center gap-1.5 px-2">
          <button 
            v-for="p in presets" 
            :key="p.label"
            @click="applyPreset(p.range)"
            class="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-tighter transition-all hover:bg-white/10"
            :class="p.active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 border border-transparent'"
          >
            {{ p.label }}
          </button>
        </div>

        <div class="h-6 w-px bg-white/10"></div>

        <div class="flex items-center gap-2 pl-2">
          <input 
            type="date" 
            v-model.lazy="fechaInicio" 
            class="bg-slate-800/80 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
          />
          <span class="text-slate-500 text-[10px]">al</span>
          <input 
            type="date" 
            v-model.lazy="fechaFin" 
            class="bg-slate-800/80 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <button 
            @click.stop="showColumnPicker = !showColumnPicker"
            class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            :class="{ 'bg-blue-600/20 text-blue-400 border-blue-500/30': showColumnPicker }"
            title="Personalizar Columnas"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          <div v-if="showColumnPicker" v-click-outside="() => showColumnPicker = false" class="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in duration-200">
            <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Visibilidad de Columnas</h4>
            <div class="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
              <label v-for="col in availableColumns" :key="col.field" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                <span class="text-xs font-medium" :class="!col.hide ? 'text-slate-200' : 'text-slate-500'">{{ col.headerName }}</span>
                <input 
                  type="checkbox" 
                  :checked="!col.hide" 
                  @change="toggleColumn(col.field)"
                  class="custom-checkbox"
                />
              </label>
            </div>
          </div>
        </div>

        <div class="h-6 w-px bg-white/10 mx-1"></div>

        <button 
          @click="handleExport('tabla')"
          :disabled="isExporting"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:border-white/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Exportar Tabla de Datos"
        >
          <template v-if="isExporting">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </template>
          <template v-else>
            📄 Tabla Datos
          </template>
        </button>

        <button 
          @click="handleExport('ejecutivo')"
          :disabled="isExporting"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-tighter hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generar Resumen Ejecutivo"
        >
          <template v-if="isExporting">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </template>
          <template v-else>
            🚀 Resumen Ejecutivo
          </template>
        </button>

        <div class="h-6 w-px bg-white/10 mx-1"></div>

        <button 
          @click="resetGridState"
          class="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all active:rotate-12"
          title="Reiniciar Vista"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>
    </div>

    <div class="flex-1 relative w-full overflow-hidden">
      <ag-grid-vue
        class="w-full h-full"
        :theme="myTheme"
        :rowData="props.rowData"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :isExternalFilterPresent="isExternalFilterPresent"
        :doesExternalFilterPass="doesExternalFilterPass"
        :pagination="true"
        :paginationPageSize="50"
        :paginationPageSizeSelector="[25, 50, 100, 500]"
        :rowSelection="{
          mode: 'multiRow',
          enableClickSelection: false,
          headerCheckbox: true,
          checkboxes: true,
        }"
        :quickFilterText="quickFilterText"
        :animateRows="true"
        @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, markRaw, nextTick, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz, colorSchemeDarkBlue } from 'ag-grid-community';
import StatusBadge from './StatusBadge.vue';
import CustomSetFilter from './CustomSetFilter.vue';
import { useExporter } from '../composables/useExporter';
import type { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';
import type { Persona } from '../types';

const props = defineProps<{
  rowData: Persona[];
}>();

const emit = defineEmits<{
  'selection-changed': [rows: Persona[]];
}>();

const { exportTableData, exportExecutiveReport } = useExporter();

const gridApi = shallowRef<GridApi | null>(null);
const quickFilterText = ref('');
const showColumnPicker = ref(false);

// Estados de fecha (Inicializar con periodo amplio por defecto)
const fechaInicio = ref('2023-01-01');
const fechaFin = ref('2023-12-31');

const isExporting = ref(false);

const presets = computed(() => [
  { label: 'Hoy', range: 'today', active: isRange('today') },
  { label: 'Semana', range: 'week', active: isRange('week') },
  { label: 'Mes', range: 'month', active: isRange('month') },
  { label: 'Trimestre', range: 'quarter', active: isRange('quarter') },
  { label: 'Año', range: 'year', active: isRange('year') },
]);

function isRange(range: string) {
  // Por ahora retornamos false para evitar variables sin usar
  // El log nos sirve para depuración si fuera necesario
  if (range === 'custom') return false;
  return false; 
}

function applyPreset(range: string) {
  const now = new Date();
  let start = new Date();
  const end = new Date();

  switch (range) {
    case 'today':
      start = new Date(now.setHours(0,0,0,0));
      break;
    case 'week':
      start.setDate(now.getDate() - now.getDay());
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }

  fechaInicio.value = start.toISOString().split('T')[0];
  fechaFin.value = end.toISOString().split('T')[0];
}

// LÓGICA DE FILTRADO EXTERNO AG GRID
const isExternalFilterPresent = () => {
  return !!fechaInicio.value && !!fechaFin.value;
};

const doesExternalFilterPass = (node: any) => {
  if (!node.data || !node.data.fecha_registro) return true;
  
  const registro = new Date(node.data.fecha_registro).getTime();
  const inicio = new Date(fechaInicio.value).getTime();
  const fin = new Date(fechaFin.value).getTime();
  
  return registro >= inicio && registro <= fin;
};

// Sincronizar cambios de fecha con el motor de AG Grid
watch([fechaInicio, fechaFin], () => {
  if (gridApi.value) {
    gridApi.value.onFilterChanged();
  }
});

const handleExport = async (tipo: 'tabla' | 'ejecutivo') => {
  if (isExporting.value) return; 
  
  // Obtenemos los datos que el usuario está viendo actualmente (filtrados y ordenados)
  let dataActual: Persona[] = [];
  if (gridApi.value) {
    gridApi.value.forEachNodeAfterFilterAndSort(node => {
      if (node.data) dataActual.push(node.data);
    });
  } else {
    dataActual = props.rowData;
  }

  isExporting.value = true;

  // 1. Obligamos a Vue a pintar el spinner AHORA MISMO
  await nextTick();
  // 2. Le damos 50ms al navegador para renderizar los frames
  await new Promise(resolve => setTimeout(resolve, 50)); 

  try {
    if (tipo === 'ejecutivo') {
      await exportExecutiveReport(dataActual, { 
        inicio: fechaInicio.value, 
        fin: fechaFin.value 
      });
    } 
    else if (tipo === 'tabla') {
      const MAX_FILAS_PDF = 5000;
      let dataAExportar = dataActual;

      // Extraemos SOLO las columnas que se ven en pantalla (excluyendo la de selección)
      const columnasVisibles = columnDefs.value
        .filter(col => !col.hide && col.field !== 'selection')
        .map(col => ({
          header: col.headerName || col.field || '',
          field: col.field as keyof Persona
        }));

      if (dataAExportar.length > MAX_FILAS_PDF) {
        const confirmacion = confirm(`Atención: El reporte tabular se truncará a los primeros ${MAX_FILAS_PDF.toLocaleString()} registros para evitar que el navegador se bloquee. ¿Deseas continuar?`);
        if (!confirmacion) {
          isExporting.value = false;
          return;
        }
        dataAExportar = dataAExportar.slice(0, MAX_FILAS_PDF);
      }
      await exportTableData(dataAExportar, `Periodo: ${fechaInicio.value} - ${fechaFin.value}`, columnasVisibles);
    }
  } catch (error) {
    console.error("🚨 Error crítico en la exportación:", error);
    // Quitamos el alert genérico para no molestar "siempre" como pidió el usuario
  } finally {
    isExporting.value = false;
  }
};

const myTheme = themeQuartz
  .withPart(colorSchemeDarkBlue)
  .withParams({
    backgroundColor: '#0f172a',
    foregroundColor: '#94a3b8',
    textColor: '#e2e8f0',
    accentColor: '#3b82f6',
    
    headerBackgroundColor: '#020617',
    headerTextColor: '#64748b',
    headerFontWeight: 900,
    headerFontSize: 10,
    
    rowBorder: { color: 'rgba(255, 255, 255, 0.03)', style: 'solid', width: 1 },
    rowHoverColor: 'rgba(59, 130, 246, 0.15)',
    selectedRowBackgroundColor: 'rgba(59, 130, 246, 0.25)',
    
    fontFamily: { googleFont: 'Inter' },
    fontSize: 13,
    
    checkboxBorderRadius: 6,
    checkboxCheckedBackgroundColor: '#3b82f6',
    checkboxCheckedBorderColor: '#3b82f6',
    checkboxUncheckedBackgroundColor: 'rgba(255, 255, 255, 0.05)',
    checkboxUncheckedBorderColor: 'rgba(255, 255, 255, 0.2)',
    
    borderRadius: 12,
    wrapperBorder: false,
  });

const defaultColDef: ColDef = {
  flex: 1,
  minWidth: 120,
  filter: true,
  sortable: true,
  resizable: true,
  floatingFilter: false,
  suppressHeaderFilterButton: false, // Asegura que el botón de filtro esté habilitado
};

const columnDefs = ref<ColDef[]>([
  { 
    headerName: 'Acreditado', 
    field: 'nombre', 
    minWidth: 250,
    flex: 1.5,
    cellClass: 'font-semibold text-slate-100',
    pinned: 'left',
    lockPosition: 'left',
    suppressMovable: true,
  },
  { headerName: 'RFC', field: 'rfc', minWidth: 150, cellClass: 'font-mono text-[11px] text-slate-400' },
  { 
    headerName: 'Estado', 
    field: 'estado',
    filter: markRaw(CustomSetFilter),
    filterParams: { buttons: ['apply', 'reset'] },
    suppressHeaderMenuButton: false,
    floatingFilter: false
  },
  { 
    headerName: 'Producto', 
    field: 'producto',
    filter: markRaw(CustomSetFilter),
    filterParams: { buttons: ['apply', 'reset'] },
    suppressHeaderMenuButton: false,
    floatingFilter: false
  },
  { 
    headerName: 'CURP', 
    field: 'curp', 
    minWidth: 180, 
    cellClass: 'font-mono text-[11px] text-slate-400' 
  },
  { 
    headerName: 'Línea Crédito', 
    field: 'monto_credito',
    filter: 'agNumberColumnFilter',
    valueFormatter: (p) => p.value ? `$${p.value.toLocaleString('es-MX')}` : '',
    cellClass: 'font-mono font-bold text-blue-400 text-right',
    headerClass: 'ag-right-aligned-header'
  },
  { 
    headerName: 'Saldo Pendiente', 
    field: 'saldo_pendiente',
    filter: 'agNumberColumnFilter',
    valueFormatter: (p) => p.value ? `$${p.value.toLocaleString('es-MX')}` : '',
    cellClass: 'font-mono text-right opacity-80',
    headerClass: 'ag-right-aligned-header'
  },
  { 
    headerName: 'Fecha Registro', 
    field: 'fecha_registro',
    filter: 'agDateColumnFilter',
    valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('es-MX') : '',
    cellClass: 'font-mono text-xs text-slate-400'
  },
  { 
    headerName: 'Estatus', 
    field: 'estatus',
    filter: markRaw(CustomSetFilter),
    filterParams: { buttons: ['apply', 'reset'] },
    suppressHeaderMenuButton: false,
    floatingFilter: false,
    cellRenderer: markRaw(StatusBadge),
    cellClass: 'flex items-center justify-center',
    headerClass: 'ag-center-aligned-header'
  },
  { 
    headerName: 'Género', 
    field: 'genero', 
    width: 100, 
    hide: true,
    cellClass: 'text-center'
  },
  { 
    headerName: 'Edad', 
    field: 'edad', 
    width: 80, 
    hide: true,
    type: 'numericColumn',
    cellClass: 'text-right'
  },
  { 
    headerName: 'Tasa Interés', 
    field: 'tasa_interes', 
    width: 120, 
    hide: true,
    type: 'numericColumn',
    valueFormatter: (p) => p.value ? `${p.value}%` : '',
    cellClass: 'text-right font-bold text-emerald-400'
  }
]);

const availableColumns = computed(() => {
  return columnDefs.value.filter(c => c.field !== 'selection');
});

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
};

const onSelectionChanged = () => {
  if (gridApi.value) {
    const selectedRows = gridApi.value.getSelectedRows();
    emit('selection-changed', selectedRows);
  }
};

const toggleColumn = (field: string | undefined) => {
  if (!field || !gridApi.value) return;
  const col = columnDefs.value.find(c => c.field === field);
  if (col) {
    col.hide = !col.hide;
    gridApi.value.setGridOption('columnDefs', [...columnDefs.value]);
  }
};

const resetGridState = () => {
  if (gridApi.value) {
    columnDefs.value.forEach(c => c.hide = false);
    gridApi.value.setGridOption('columnDefs', [...columnDefs.value]);
    gridApi.value.setFilterModel(null);
    gridApi.value.applyColumnState({ defaultState: { sort: null } });
    quickFilterText.value = '';
  }
};

const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) binding.value();
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};
</script>

<style>
/* Forzamos el borde inferior del header mediante CSS ya que con JS API da error de tipos */
.ag-header {
  border-bottom: 2px solid rgba(59, 130, 246, 0.2) !important;
}

/* 1. Resetear el comportamiento de AG Grid para celdas de encabezado */
.ag-header-cell {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

/* 2. El contenedor principal debe ser siempre un flex de izquierda a derecha */
.ag-header-cell-comp-wrapper {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  width: 100% !important;
}

/* 3. El label (texto + sort) ocupa todo el espacio para empujar los botones */
.ag-header-cell-label {
  display: flex !important;
  flex: 1 !important;
  align-items: center !important;
  overflow: hidden;
}

/* 4. Alineación del contenido del label según la columna */
.ag-right-aligned-header .ag-header-cell-label { justify-content: flex-end !important; }
.ag-center-aligned-header .ag-header-cell-label { justify-content: center !important; }

/* 5. BOTONES DE ACCIÓN (FILTRO/MENÚ) SIEMPRE A LA DERECHA */
.ag-header-cell-menu-button,
.ag-header-cell-filter-button {
  order: 100 !important;
  margin-left: auto !important;
  display: flex !important;
}

/* Estilos para el Menú de Filtro */
.ag-menu {
  background-color: #0f172a !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

.ag-menu-option {
  padding: 8px 12px !important;
  color: #e2e8f0 !important;
  font-size: 12px !important;
}

.ag-menu-option-active {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

.ag-tab-header {
  background-color: #020617 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.ag-row {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.ag-row-selected {
  backdrop-filter: brightness(1.2);
}

.ag-body-viewport::-webkit-scrollbar { width: 6px; height: 6px; }
.ag-body-viewport::-webkit-scrollbar-track { background: transparent; }
.ag-body-viewport::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
.ag-body-viewport:hover::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); }

.ag-paging-panel {
  background-color: #020617 !important; /* Slate 950 sólido */
  padding: 0 2rem !important;
}
.ag-paging-button { transition: all 0.2s ease; }
.ag-paging-button:hover:not(.ag-disabled) { transform: scale(1.1); }

.custom-checkbox {
  appearance: none; width: 16px; height: 16px; border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05);
  cursor: pointer; position: relative; transition: all 0.2s ease;
}
.custom-checkbox:checked { background: #3b82f6; border-color: #3b82f6; }
.custom-checkbox:checked::after {
  content: ''; position: absolute; top: 1px; left: 4px; width: 4px; height: 8px;
  border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg);
}

.animate-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
