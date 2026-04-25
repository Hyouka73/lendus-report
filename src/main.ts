import { createApp } from 'vue'
// AG Grid v35 — módulos deben registrarse antes de montar la app
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import './style.css'
import App from './App.vue'

ModuleRegistry.registerModules([AllCommunityModule])
createApp(App).mount('#app')
