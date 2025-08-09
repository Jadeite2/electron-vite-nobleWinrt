import { createApp } from 'vue';
import App from './App.vue';
// 导入 Element Plus 样式
import 'element-plus/dist/index.css';
// import components from './components';
import Router from './router/index';

const app = createApp(App)

// components
// for (const i in components) {
//   app.component(i, components[i])
// }
app.use(Router).mount('#app')
