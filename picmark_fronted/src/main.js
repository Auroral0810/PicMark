import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router/router.js'
import store from '@/store/store.js'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import '@/assets/styles.css'  // 导入自定义全局样式表
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus, {
  locale: zhCn
})
app.use(store)
app.use(router)
app.mount('#app')