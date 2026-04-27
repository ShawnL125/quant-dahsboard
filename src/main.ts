import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { message } from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import './assets/styles/theme.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', err, info);
  message.error('An unexpected error occurred.');
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise]', event.reason);
});

app.mount('#app');
