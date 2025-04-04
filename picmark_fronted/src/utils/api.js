import axios from 'axios';
import store from '../store/store';
import { ElMessage } from 'element-plus';

// API基础URL
export const API_BASE_URL = 'http://localhost:3000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000 // 30秒超时
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从store获取token
    const token = store.state.token;
    
    // 如果有token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 处理成功响应
    return response;
  },
  error => {
    // 处理错误响应
    const { response } = error;
    
    if (response) {
      // 401未授权，可能是token过期
      if (response.status === 401) {
        ElMessage.error('登录已过期，请重新登录');
        store.dispatch('logout');
      } 
      // 403禁止访问
      else if (response.status === 403) {
        ElMessage.error('您没有权限执行此操作');
      }
      // 其他错误
      else {
        ElMessage.error(response.data?.message || '请求失败');
      }
    } else {
      // 网络错误
      ElMessage.error('网络错误，请检查您的连接');
    }
    
    return Promise.reject(error);
  }
);

// 导出API请求方法
export default {
  // 获取图片列表
  getImages(params) {
    return api.get('/images', { params });
  },
  
  // 获取单张图片
  getImage(id) {
    return api.get(`/images/${id}`);
  },
  
  // 保存图片信息
  saveImage(data) {
    return api.post('/images', data);
  },
  
  // 更新图片信息
  updateImage(id, data) {
    return api.put(`/images/${id}`, data);
  },
  
  // 删除图片
  deleteImage(id) {
    return api.delete(`/images/${id}`);
  },
  
  // 图片搜索
  searchImages(keyword) {
    return api.get('/images/search', { params: { keyword } });
  },
  
  // 获取上传凭证
  getUploadToken(filename) {
    return api.get('/token', { params: { filename } });
  },
  
  // 用户登录
  login(credentials) {
    return api.post('/auth/login', credentials);
  },
  
  // 用户注册
  register(data) {
    return api.post('/auth/register', data);
  }
}; 