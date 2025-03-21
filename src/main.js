import { createApp } from "vue";
import "./assets/css/style.less";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";

import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import { createPinia } from "pinia";

// 创建 Pinia 实例
const pinia = createPinia();

// 使用持久化插件
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

// 引用路由
app.use(router);
app.use(ElementPlus);
app.use(pinia);
app.mount("#app");
