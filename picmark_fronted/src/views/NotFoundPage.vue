<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-visual">
        <div class="error-code">404</div>
        <div class="error-illustration">
          <svg width="240" height="120" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 40 L210 40" stroke="#e0e0e0" stroke-width="2" />
            <path d="M30 60 L210 60" stroke="#e0e0e0" stroke-width="2" />
            <path d="M30 80 L210 80" stroke="#e0e0e0" stroke-width="2" />
            <path d="M120 40 L120 80" stroke="#e0e0e0" stroke-width="2" />
            <circle cx="120" cy="30" r="10" fill="#f56c6c" />
            <rect x="110" y="90" width="20" height="10" rx="5" fill="#e0e0e0" />
          </svg>
        </div>
      </div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-message">抱歉，您访问的页面不存在或已被移除</p>
      <div class="action-buttons">
        <el-button type="primary" size="large" class="home-button" @click="goToHome">
          <el-icon><Back /></el-icon>
          <span>返回首页</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'NotFoundPage',
  setup() {
    const router = useRouter()
    
    const goToHome = () => {
      router.push({ name: 'home' })
    }
    
    return {
      goToHome
    }
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
  background-color: var(--bg-light, #f9fafb);
}

.not-found-content {
  max-width: 480px;
  text-align: center;
  padding: 3rem;
  background-color: var(--component-background, #fff);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.error-visual {
  position: relative;
  margin-bottom: 2rem;
}

.error-code {
  font-size: 9rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, var(--primary-color, #1890ff) 0%, #6b46c1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  letter-spacing: -4px;
  opacity: 0.8;
}

.error-illustration {
  display: flex;
  justify-content: center;
  margin-top: -3rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary, #1f2937);
}

.error-message {
  font-size: 1.125rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.home-button {
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 12px;
  transition: transform 0.2s ease;
}

.home-button:hover {
  transform: translateY(-2px);
}

/* 响应式适配 */
@media (max-width: 640px) {
  .not-found-content {
    padding: 2rem 1.5rem;
  }
  
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-message {
    font-size: 1rem;
  }
}

/* 暗色模式 */
[data-theme="dark"] .not-found-container {
  background-color: var(--bg-dark, #111827);
}

[data-theme="dark"] .not-found-content {
  background-color: var(--component-background, #1f1f1f);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
</style> 