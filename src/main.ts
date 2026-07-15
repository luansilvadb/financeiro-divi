import { createApp } from 'vue'
import './main.css'
import App from './App.vue'
import router from './router'
import { setupRouterGuards } from './router/guards'

const app = createApp(App)

setupRouterGuards(router)
app.use(router)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[DIVI Error Boundary]', err)
  window.dispatchEvent(new CustomEvent('divi:app-error', {
    detail: { message: err instanceof Error ? err.message : String(err), info }
  }))
}

app.mount('#app')
