<template>
  <div id="app" :data-theme="theme">
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-content">
          <!-- Logo区域 -->
          <div class="logo" @click="navigateTo('home')">
            <img src="@/assets/logo.png" alt="PicMark" class="logo-image" />
            <span>PicMark</span>
          </div>
          
          <!-- 右侧操作区 -->
          <div class="right-actions">
            <!-- 桌面端导航 -->
            <el-menu
              :default-active="activeIndex"
              class="desktop-menu"
              mode="horizontal"
              :ellipsis="false"
              @select="handleSelect"
            >
              <el-menu-item index="home">图库</el-menu-item>
              <el-menu-item index="upload">上传</el-menu-item>
              <el-menu-item index="folder-tags">文件夹与标签</el-menu-item>
              <el-menu-item index="statistics">数据统计</el-menu-item>
              <el-menu-item index="settings">设置</el-menu-item>
            </el-menu>
            
            <!-- 主题切换按钮 -->
            <div class="theme-toggle" @click="toggleTheme">
              <el-icon v-if="theme === 'light'"><Moon /></el-icon>
              <el-icon v-else><Sunny /></el-icon>
            </div>
            
            <!-- 移动端菜单按钮 -->
            <div class="mobile-menu-toggle">
              <el-button type="primary" circle @click="toggleMobileMenu">
                <el-icon v-if="!mobileMenuOpen"><Menu /></el-icon>
                <el-icon v-else><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </header>
      
      <!-- 页面底部蓝色进度条 -->
      <div class="nav-indicator"></div>
      
      <!-- 移动端导航菜单 -->
      <div class="mobile-nav" v-if="mobileMenuOpen">
        <el-menu
          :default-active="activeIndex"
          class="mobile-menu"
          :class="{ 'mobile-menu-open': mobileMenuOpen }"
        >
          <el-menu-item index="home" @click="closeMobileMenu">
            <el-icon><HomeFilled /></el-icon>
            <span>图库</span>
          </el-menu-item>
          <el-menu-item index="upload" @click="closeMobileMenu">
            <el-icon><Upload /></el-icon>
            <span>上传</span>
          </el-menu-item>
          <el-menu-item index="folder-tags" @click="closeMobileMenu">
            <el-icon><Folder /></el-icon>
            <span>文件夹与标签</span>
          </el-menu-item>
          <el-menu-item index="statistics" @click="closeMobileMenu">
            <el-icon><DataLine /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-menu-item index="settings" @click="closeMobileMenu">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <!-- 主内容区域 -->
      <div class="content-container" @click="closeMobileMenu">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Upload, 
  Setting, 
  Moon, 
  Sunny, 
  Menu, 
  Close,
  HomeFilled,
  Folder,
  DataLine
} from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    Upload,
    Setting,
    Moon,
    Sunny,
    Menu,
    Close,
    HomeFilled,
    Folder,
    DataLine
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // 当前活动的导航项
    const activeIndex = computed(() => {
      return route.name || 'home'
    })
    
    // 导航菜单点击事件处理
    const handleSelect = (key) => {
      router.push({ name: key })
      closeMobileMenu()
    }
    
    // 主题设置
    const theme = ref(localStorage.getItem('theme') || 'light')
    
    const toggleTheme = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', theme.value)
    }
    
    // 移动端菜单控制
    const mobileMenuOpen = ref(false)
    
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }
    
    const closeMobileMenu = () => {
      if (mobileMenuOpen.value) {
        mobileMenuOpen.value = false
      }
    }
    
    // 监听窗口大小变化
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen.value) {
        mobileMenuOpen.value = false
      }
    }
    
    // 当前路由状态
    const currentRoute = computed(() => {
      return route.name
    })
    
    const navigateTo = (routeName) => {
      router.push({ name: routeName })
      closeMobileMenu()
    }
    
    // 初始化
    onMounted(() => {
      // 从localStorage获取主题设置
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        theme.value = savedTheme
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // 检测系统主题偏好
        theme.value = 'dark'
        localStorage.setItem('theme', theme.value)
      }
      
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize)
    })
    
    // 组件卸载时移除事件监听
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
    
    return {
      theme,
      toggleTheme,
      currentRoute,
      navigateTo,
      mobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      activeIndex,
      handleSelect
    }
  }
}
</script>

<style>
/* 全局样式 */
:root {
  --primary-color: #3b82f6;
  --primary-light: #eff6ff;
  --primary-dark: #1d4ed8;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #6366f1;
  
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  --bg-color: #ffffff;
  --bg-light: #f9fafb;
  --bg-dark: #f3f4f6;
  --bg-hover: #f3f4f6;
  
  --border-color: #e5e7eb;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  --header-height: 64px;
  --sidebar-width: 220px;
  
  --transition-fast: 0.15s;
  --transition-normal: 0.25s;
  --transition-slow: 0.35s;
  --transition-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 暗色模式变量 */
[data-theme="dark"] {
  --primary-color: #60a5fa;
  --primary-light: #1e3a8a;
  --primary-dark: #93c5fd;
  
  --text-primary: #f9fafb;
  --text-secondary: #e5e7eb;
  --text-tertiary: #9ca3af;
  
  --bg-color: #111827;
  --bg-light: #1f2937;
  --bg-dark: #0f172a;
  --bg-hover: #1e293b;
  
  --border-color: #334155;
}

/* 基础样式 */
#app {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background-color: var(--bg-light);
  min-height: 100vh;
  position: relative;
  transition: background-color var(--transition-normal) ease;
}

.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 头部导航栏 */
.header {
  height: var(--header-height);
  background-color: #1a202c;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: none;
  transition: all var(--transition-normal) var(--transition-function);
}

/* 导航底部指示条 */
.nav-indicator {
  height: 2px;
  background-color: #3b82f6;
  position: relative;
  top: -2px;
  z-index: 99;
}

/* 添加毛玻璃效果 */
[data-theme="light"] .header {
  background-color: #1a202c;
}

[data-theme="dark"] .header {
  background-color: #1a202c;
}

.header-content {
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  gap: 12px;
  transition: transform var(--transition-normal) var(--transition-function);
  cursor: pointer;
  margin-right: auto;
  padding-left: 16px;
}

.logo span {
  color: #fff;
}

.logo-image {
  height: 36px;
  width: 36px;
  object-fit: contain;
}

/* 右侧操作区 */
.right-actions {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

/* Element Plus Menu 样式定制 */
.desktop-menu {
  background-color: transparent !important;
  border-bottom: none !important;
  margin-right: 16px;
}

.desktop-menu .el-menu-item {
  height: var(--header-height);
  line-height: var(--header-height);
  font-size: 15px;
  color: #ffffff !important;
  padding: 0 20px;
  transition: all var(--transition-normal) var(--transition-function);
  border-bottom: none !important;
}

.desktop-menu .el-menu-item:hover {
  color: #60a5fa !important;
  background-color: transparent;
}

.desktop-menu .el-menu-item.is-active {
  color: #60a5fa !important;
  font-weight: 600;
  border-bottom: none !important;
}

.desktop-menu .el-menu-item i {
  margin-right: 6px;
}

/* 主题切换按钮 */
.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background-color: transparent;
  cursor: pointer;
  transition: all var(--transition-fast) var(--transition-function);
}

.theme-toggle:hover {
  background-color: var(--bg-hover);
  transform: rotate(30deg);
}

.theme-toggle:active {
  transform: scale(0.95);
}

/* 移动端菜单按钮 */
.mobile-menu-toggle {
  display: none;
  margin-left: 12px;
}

/* 移动端导航 */
.mobile-nav {
  background-color: var(--bg-color);
  box-shadow: var(--shadow-md);
  z-index: 99;
  animation: slideDown 0.3s ease-in-out;
}

.mobile-menu {
  border: none !important;
}

.mobile-menu .el-menu-item {
  padding: 0 24px;
  height: 50px;
  display: flex;
  align-items: center;
}

.mobile-menu .el-menu-item i {
  margin-right: 12px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 内容区域 */
.content-container {
  flex: 1;
  padding: 24px;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  transition: all var(--transition-normal) var(--transition-function);
  background-color: var(--bg-light);
  border-radius: var(--border-radius-lg);
  margin-top: 24px;
}

[data-theme="light"] .content-container {
  background-color: #ffffff;
  box-shadow: var(--shadow-sm);
}

[data-theme="dark"] .content-container {
  background-color: #111827;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] #app {
  background-color: #0f172a;
}

[data-theme="light"] #app {
  background-color: #f9fafb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo-image {
    height: 32px;
    width: 32px;
  }
  
  .desktop-menu {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .content-container {
    padding: 16px;
  }
}
</style>
