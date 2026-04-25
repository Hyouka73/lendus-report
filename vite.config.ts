import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('ag-grid')) return 'ag-grid';
            if (id.includes('d3')) return 'd3';
            if (id.includes('pdfmake') || id.includes('pdf-lib')) return 'pdf-engines';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Aumentamos el límite para que no moleste tanto con librerías pesadas
  }
})
