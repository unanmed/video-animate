import { createApp } from 'vue';
import App from './App.vue';
import { registerAll } from './animates';
import './styles.css';

registerAll();
createApp(App).mount('#app');
