import { createRouter, createWebHistory } from 'vue-router'

// 懒加载路由组件
const Home = () => import('@/views/HomePage.vue')
const Upload = () => import('@/views/UploadPage.vue')
const Settings = () => import('@/views/SettingsPage.vue')
const Statistics = () => import('@/views/StatisticsPage.vue')
const FolderTags = () => import('@/views/FolderTagsPage.vue')
const NotFound = () => import('@/views/NotFoundPage.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: '图库 - PicMark'
    }
  },
  {
    path: '/upload',
    name: 'upload',
    component: Upload,
    meta: {
      title: '上传 - PicMark'
    }
  },
  {
    path: '/folder-tags',
    name: 'folder-tags',
    component: FolderTags,
    meta: {
      title: '文件夹与标签 - PicMark'
    }
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: Statistics,
    meta: {
      title: '数据统计 - PicMark'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: '设置 - PicMark'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: '页面未找到 - PicMark'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'PicMark - 个人Markdown图床'
  next()
})

export default router
