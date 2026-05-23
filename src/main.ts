import { createApp } from 'vue'
import './main.css'
import App from './App.vue'
import { bootstrapEventGenerator } from './shared/container'

async function init() {
  await bootstrapEventGenerator.migrate()
  createApp(App).mount('#app')
}

init()
