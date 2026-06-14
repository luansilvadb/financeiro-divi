import { createApp } from 'vue'
import './main.css'
import App from './App.vue'

// Impedir pinch-to-zoom no iOS Safari (que ignora a meta tag viewport)
document.addEventListener('touchstart', (event) => {
  if (event.touches.length > 1) {
    event.preventDefault()
  }
}, { passive: false })

document.addEventListener('gesturestart', (event) => {
  event.preventDefault()
})

createApp(App).mount('#app')
