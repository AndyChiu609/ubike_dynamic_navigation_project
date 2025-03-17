import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// eslint-disable-next-line
import store from './store'
import './assets/styles/main.scss'

createApp(App).use(router).mount('#app')
