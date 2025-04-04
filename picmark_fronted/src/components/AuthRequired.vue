<template>
  <div class="auth-required">
    <el-alert
      v-if="!isAuthenticated"
      type="warning"
      :closable="false"
    >
      <div class="auth-alert-content">
        <span>{{ message }}</span>
        <el-button type="primary" size="small" @click="showLoginDialog">
          立即登录
        </el-button>
      </div>
    </el-alert>
    
    <slot v-else></slot>
    
    <!-- 登录对话框 -->
    <el-dialog v-model="dialogVisible" title="登录" width="400px">
      <el-form :model="loginForm" :rules="rules" ref="loginForm" @submit.native.prevent>
        <el-form-item prop="username" label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input v-model="loginForm.password" placeholder="请输入密码" type="password"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleLogin" :loading="loading">
          登录
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: 'AuthRequired',
  
  props: {
    message: {
      type: String,
      default: '请登录后访问此功能'
    }
  },
  
  setup() {
    const store = useStore();
    const loginForm = ref({
      username: '',
      password: ''
    });
    const dialogVisible = ref(false);
    const loading = ref(false);
    const loginFormRef = ref(null);
    
    // 验证规则
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ]
    };
    
    // 计算属性
    const isAuthenticated = computed(() => store.state.isAuthenticated);
    
    // 显示登录对话框
    const showLoginDialog = () => {
      dialogVisible.value = true;
    };
    
    // 处理登录
    const handleLogin = async () => {
      if (!loginFormRef.value) return;
      
      try {
        // 表单验证
        await loginFormRef.value.validate();
        
        loading.value = true;
        
        // 调用登录接口
        await store.dispatch('login', loginForm.value);
        
        // 登录成功
        dialogVisible.value = false;
        ElMessage.success('登录成功');
        
        // 清空表单
        loginForm.value = {
          username: '',
          password: ''
        };
      } catch (error) {
        console.error('登录失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 监听ESC键关闭对话框
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dialogVisible.value) {
        dialogVisible.value = false;
      }
      
      // Enter键提交表单
      if (e.key === 'Enter' && dialogVisible.value) {
        handleLogin();
      }
    };
    
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });
    
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
    
    return {
      loginForm,
      dialogVisible,
      loading,
      loginFormRef,
      rules,
      isAuthenticated,
      showLoginDialog,
      handleLogin
    };
  }
});
</script>

<style scoped>
.auth-required {
  margin-bottom: 16px;
}

.auth-alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 