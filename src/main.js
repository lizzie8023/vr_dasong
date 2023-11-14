import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// import zhayan from './zhayan.vue'
// import huazhou from './huazhou.vue'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

createApp(App).mount('#app')
// createApp(zhayan).mount('#app')
// createApp(huazhou).mount('#app')
