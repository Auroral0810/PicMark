<template>
  <div class="settings-container">
    <el-card class="settings-card" shadow="hover">
      <div class="settings-header">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">配置PicMark的所有设置选项</p>
      </div>
      
      <el-tabs tab-position="left" class="settings-tabs">
        <!-- 七牛云配置 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><CloudUpload /></el-icon>
              <span>存储配置</span>
            </div>
          </template>
          
          <div class="tab-content">
            <div class="section-header">
              <h2 class="settings-title">七牛云存储</h2>
              <div class="settings-subtitle">配置七牛云对象存储服务</div>
            </div>
            
            <el-form 
              :model="qiniuForm" 
              label-position="top" 
              status-icon
              class="settings-form"
            >
              <el-form-item label="访问域名">
                <el-input v-model="qiniuForm.domain" placeholder="例如：http://cdn.example.com">
                  <template #prepend>
                    <el-icon><Link /></el-icon>
                  </template>
                  <template #append>
                    <el-tooltip content="七牛云绑定的CDN域名，用于访问上传的图片" placement="top">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="存储空间">
                <el-input v-model="qiniuForm.bucket" placeholder="存储空间名称">
                  <template #prepend>
                    <el-icon><Box /></el-icon>
                  </template>
                  <template #append>
                    <el-tooltip content="在七牛云控制台创建的存储空间名称" placement="top">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="AccessKey">
                <el-input v-model="qiniuForm.accessKey" placeholder="AccessKey" show-password>
                  <template #prepend>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="SecretKey">
                <el-input v-model="qiniuForm.secretKey" placeholder="SecretKey" show-password>
                  <template #prepend>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="存储区域">
                <el-select v-model="qiniuForm.region" placeholder="请选择存储区域">
                  <el-option
                    v-for="item in regionOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                    <span>{{ item.label }}</span>
                    <el-tag size="small" type="danger" v-if="item.isNew">NEW</el-tag>
                  </el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button type="primary" size="large" @click="saveQiniuSettings" :loading="qiniuSaving">
                    <el-icon><Check /></el-icon>
                    <span>保存配置</span>
                  </el-button>
                  <el-button size="large" @click="testQiniuConnection" :loading="qiniuTesting">
                    <el-icon><Connection /></el-icon>
                    <span>测试连接</span>
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 基本设置 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><Setting /></el-icon>
              <span>基本设置</span>
            </div>
          </template>
          
          <div class="tab-content">
            <div class="section-header">
              <h2 class="settings-title">基本设置</h2>
              <div class="settings-subtitle">配置PicMark的基本行为</div>
            </div>
            
            <el-form :model="basicForm" label-position="top" class="settings-form">
              <el-form-item label="Markdown格式">
                <el-input v-model="basicForm.markdownFormat" placeholder="例如：![{filename}]({url})">
                  <template #prepend>
                    <el-icon><Document /></el-icon>
                  </template>
                  <template #append>
                    <el-tooltip content="支持的变量：{filename}、{url}、{width}、{height}" placement="top">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
                <div class="form-tip">自定义生成的Markdown格式，支持多种变量</div>
              </el-form-item>
              
              <el-divider content-position="left">显示偏好</el-divider>
              
              <el-form-item label="默认视图">
                <div class="view-mode-container">
                  <el-radio-group v-model="basicForm.defaultView" class="view-radio-group">
                    <el-radio-button label="grid" class="view-radio-button">
                      <div class="view-option">
                        <div class="view-icon">
                          <el-icon><Grid /></el-icon>
                        </div>
                        <div class="view-icon-preview grid-preview">
                          <div></div><div></div><div></div><div></div>
                        </div>
                        <span>网格视图</span>
                      </div>
                    </el-radio-button>
                    <el-radio-button label="list" class="view-radio-button">
                      <div class="view-option">
                        <div class="view-icon">
                          <el-icon><List /></el-icon>
                        </div>
                        <div class="view-icon-preview list-preview">
                          <div></div><div></div><div></div>
                        </div>
                        <span>列表视图</span>
                      </div>
                    </el-radio-button>
                  </el-radio-group>
                </div>
                <div class="form-tip">选择图库的默认显示方式</div>
              </el-form-item>
              
              <el-form-item label="默认排序">
                <div class="sort-option-container">
                  <el-select v-model="basicForm.sortOption" placeholder="选择排序方式" class="full-width-select">
                    <el-option label="最新上传" value="uploadTime:desc">
                      <div class="option-with-icon">
                        <el-icon><Sort /></el-icon>
                        <span>最新上传</span>
                      </div>
                    </el-option>
                    <el-option label="最早上传" value="uploadTime:asc">
                      <div class="option-with-icon">
                        <el-icon><Sort /></el-icon>
                        <span>最早上传</span>
                      </div>
                    </el-option>
                    <el-option label="文件名A-Z" value="filename:asc">
                      <div class="option-with-icon">
                        <el-icon><SortDown /></el-icon>
                        <span>文件名A-Z</span>
                      </div>
                    </el-option>
                    <el-option label="文件名Z-A" value="filename:desc">
                      <div class="option-with-icon">
                        <el-icon><SortUp /></el-icon>
                        <span>文件名Z-A</span>
                      </div>
                    </el-option>
                    <el-option label="文件大小↑" value="size:asc">
                      <div class="option-with-icon">
                        <el-icon><SortDown /></el-icon>
                        <span>文件大小↑</span>
                      </div>
                    </el-option>
                    <el-option label="文件大小↓" value="size:desc">
                      <div class="option-with-icon">
                        <el-icon><SortUp /></el-icon>
                        <span>文件大小↓</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
                <div class="form-tip">设置图片默认的排序方式</div>
              </el-form-item>
              
              <el-form-item label="每页显示">
                <div class="page-size-selector">
                  <el-slider
                    v-model="basicForm.pageSize"
                    :min="10"
                    :max="100"
                    :step="10"
                    :marks="{10: '10', 20: '20', 50: '50', 100: '100'}"
                    class="page-size-slider"
                  ></el-slider>
                  <div class="page-size-display">
                    <div class="size-value">{{ basicForm.pageSize }}</div>
                    <div class="size-label">张图片/页</div>
                  </div>
                </div>
                <div class="form-tip">调整每页显示的图片数量</div>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" size="large" @click="saveBasicSettings" :loading="basicSaving">
                  <el-icon><Check /></el-icon>
                  <span>保存设置</span>
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 上传设置 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><Upload /></el-icon>
              <span>上传设置</span>
            </div>
          </template>
          
          <div class="tab-content">
            <div class="section-header">
              <h2 class="settings-title">上传设置</h2>
              <div class="settings-subtitle">控制图片上传和处理选项</div>
            </div>
            
            <el-form :model="uploadForm" label-position="top" class="settings-form">
              <el-form-item label="文件大小限制">
                <div class="size-limit-container">
                  <el-input-number
                    v-model="uploadForm.maxSize"
                    :min="1"
                    :max="20"
                    controls-position="right"
                    class="size-input"
                  ></el-input-number>
                  <span class="input-unit">MB（最大20MB）</span>
                </div>
                <div class="form-tip">限制单个文件的最大上传大小</div>
              </el-form-item>
              
              <el-divider content-position="left">图片处理</el-divider>
              
              <el-form-item class="switch-option">
                <template #label>
                  <div class="switch-label">
                    <div class="switch-title">默认压缩图片</div>
                    <div class="switch-description">上传前压缩图片以节省空间</div>
                  </div>
                </template>
                <el-switch v-model="uploadForm.compress" active-color="#3b82f6" inactive-color="#e5e7eb"></el-switch>
              </el-form-item>
              
              <el-form-item class="switch-option">
                <template #label>
                  <div class="switch-label">
                    <div class="switch-title">自动重命名</div>
                    <div class="switch-description">使用时间戳和随机字符自动命名文件</div>
                  </div>
                </template>
                <el-switch v-model="uploadForm.autoRename" active-color="#3b82f6" inactive-color="#e5e7eb"></el-switch>
              </el-form-item>
              
              <el-divider content-position="left">允许的文件类型</el-divider>
              
              <el-form-item>
                <div class="file-types-container">
                  <el-checkbox-group v-model="uploadForm.allowedTypeNames" class="file-type-checkboxes">
                    <el-checkbox label="jpeg" border>JPEG</el-checkbox>
                    <el-checkbox label="png" border>PNG</el-checkbox>
                    <el-checkbox label="gif" border>GIF</el-checkbox>
                    <el-checkbox label="webp" border>WebP</el-checkbox>
                  </el-checkbox-group>
                </div>
                <div class="form-tip">选择允许上传的图片文件类型</div>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" size="large" @click="saveUploadSettings" :loading="uploadSaving">
                  <el-icon><Check /></el-icon>
                  <span>保存设置</span>
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 安全与隐私 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </div>
          </template>
          
          <div class="tab-content">
            <div class="section-header">
              <h2 class="settings-title">安全与隐私</h2>
              <div class="settings-subtitle">配置安全选项和隐私保护</div>
            </div>
            
            <div class="coming-soon">
              <div class="coming-soon-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <h3>功能开发中</h3>
              <p>安全与隐私设置即将推出，敬请期待</p>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </div>
          </template>
          
          <div class="tab-content">
            <div class="section-header">
              <h2 class="settings-title">通知设置</h2>
              <div class="settings-subtitle">管理PicMark的通知方式</div>
            </div>
            
            <div class="coming-soon">
              <div class="coming-soon-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <h3>功能开发中</h3>
              <p>通知设置即将推出，敬请期待</p>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- API访问 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><Connection /></el-icon>
              <span>API设置</span>
            </div>
          </template>
          
          <div class="tab-content">
            <div class="section-header">
              <h2 class="settings-title">API设置</h2>
              <div class="settings-subtitle">管理API访问与集成</div>
            </div>
            
            <div class="coming-soon">
              <div class="coming-soon-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <h3>功能开发中</h3>
              <p>API设置即将推出，敬请期待</p>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 关于 -->
        <el-tab-pane>
          <template #label>
            <div class="tab-label">
              <el-icon><InfoFilled /></el-icon>
              <span>关于</span>
            </div>
          </template>
          
          <div class="tab-content">
  
            
            <div class="about-wrapper">
              <div class="about-header-card">
                <div class="about-logo-container">
                  <img src="@/assets/logo.png" alt="PicMark Logo" class="about-logo" />
                  <div class="logo-glow"></div>
                </div>
                <div class="about-info">
                  <h2 class="about-title">PicMark</h2>
                  <div class="about-version-tag">v1.0.0</div>
                  <p class="about-description">个人Markdown图床系统</p>
                </div>
              </div>
              
              <div class="about-content-grid">
                <div class="about-content-card">
                  <div class="about-section">
                    <p class="about-description-text">
                      基于<span class="tech-tag">Vue.js</span> + <span class="tech-tag">Element Plus</span> + <span class="tech-tag">七牛云存储</span>开发的现代化图床工具
                    </p>
                  </div>
                  
                  <div class="about-section">
                    <h3 class="feature-heading">
                      <div class="feature-icon-container">
                        <el-icon><Star /></el-icon>
                      </div>
                      <span>功能特点</span>
                    </h3>
                    <ul class="feature-list">
                      <li>
                        <div class="feature-item-icon">
                          <el-icon><UploadFilled /></el-icon>
                        </div>
                        <span>拖拽上传、剪贴板上传、多图上传</span>
                      </li>
                      <li>
                        <div class="feature-item-icon">
                          <el-icon><Document /></el-icon>
                        </div>
                        <span>Markdown图片链接自动生成</span>
                      </li>
                      <li>
                        <div class="feature-item-icon">
                          <el-icon><Management /></el-icon>
                        </div>
                        <span>快速管理和组织图片</span>
                      </li>
                      <li>
                        <div class="feature-item-icon">
                          <el-icon><Moon /></el-icon>
                        </div>
                        <span>支持明暗主题切换</span>
                      </li>
                      <li>
                        <div class="feature-item-icon">
                          <el-icon><CloudUpload /></el-icon>
                        </div>
                        <span>使用七牛云对象存储作为后端</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div class="about-content-card">
                  <div class="about-section">
                    <h3 class="feature-heading">
                      <div class="feature-icon-container">
                        <el-icon><Service /></el-icon>
                      </div>
                      <span>联系与支持</span>
                    </h3>
                    <p class="contact-text">如有问题或建议，请访问项目主页或提交Issue。</p>
                    
                    <div class="about-actions">
                      <el-button type="primary" @click="openProjectPage" class="project-btn">
                        <el-icon><Link /></el-icon>
                        <span class="btn-text" style="color: white;">项目主页</span>
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="about-section">
                    <h3 class="feature-heading">
                      <div class="feature-icon-container">
                        <el-icon><InfoFilled /></el-icon>
                      </div>
                      <span>系统信息</span>
                    </h3>
                    <div class="system-info">
                      <div class="info-item">
                        <span class="info-label">版本号：</span>
                        <span class="info-value">1.0.0</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">发布日期：</span>
                        <span class="info-value">2025-04-03</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">最后更新：</span>
                        <span class="info-value">2025-04-04</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">许可协议：</span>
                        <span class="info-value">MIT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { 
  Setting, 
  InfoFilled, 
  CloudUpload, 
  Upload, 
  Lock, 
  Bell, 
  Connection,
  Check,
  Link,
  Box,
  Key,
  Document,
  Grid,
  List,
  Sort,
  SortUp,
  SortDown,
  Timer,
  Star,
  UploadFilled,
  Management,
  Moon,
  Service
} from '@element-plus/icons-vue'

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

export default {
  name: 'SettingsPage',
  components: {
    Setting, 
    InfoFilled, 
    CloudUpload, 
    Upload, 
    Lock, 
    Bell, 
    Connection,
    Check,
    Link,
    Box,
    Key,
    Document,
    Grid,
    List,
    Sort,
    SortUp,
    SortDown,
    Timer,
    Star,
    UploadFilled,
    Management,
    Moon,
    Service
  },
  setup() {
    const store = useStore()
    const activeTab = ref('qiniu')
    
    // 七牛云表单
    const qiniuForm = reactive({
      domain: '',
      bucket: '',
      accessKey: '',
      secretKey: '',
      region: 'z0'
    })
    
    const qiniuSaving = ref(false)
    const qiniuTesting = ref(false)
    
    // 基本设置表单
    const basicForm = reactive({
      markdownFormat: '![{filename}]({url})',
      defaultView: 'grid',
      sortOption: 'uploadTime:desc',
      pageSize: 20
    })
    
    const basicSaving = ref(false)
    
    // 上传设置表单
    const uploadForm = reactive({
      renameType: 'uuid',
      customNamePattern: '{year}{month}{day}_{filename}',
      compress: true,
      compressQuality: 85,
      maxSize: 5,
      allowTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    })
    
    const uploadSaving = ref(false)
    
    // 存储区域选项
    const regionOptions = [
      { value: 'z0', label: '华东-浙江' },
      { value: 'z1', label: '华北-河北' },
      { value: 'z2', label: '华南-广东' },
      { value: 'na0', label: '北美-洛杉矶' },
      { value: 'as0', label: '亚太-新加坡', isNew: true }
    ]

    // 初始化 - 从后端加载设置
    onMounted(async () => {
      // 加载七牛云设置
      await loadQiniuSettings()
      
      // 加载基本设置
      await loadSystemSettings()
    })
    
    // 加载七牛云设置
    const loadQiniuSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/settings/qiniu`)
        if (response.data.success && response.data.data) {
          const qiniuSettings = response.data.data
          Object.assign(qiniuForm, qiniuSettings)
          console.log('七牛云设置加载成功:', qiniuSettings)
        }
      } catch (error) {
        console.error('加载七牛云设置失败:', error)
        ElMessage.error('无法加载七牛云设置')
      }
    }
    
    // 加载系统设置
    const loadSystemSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/settings/system`)
        if (response.data.success && response.data.data) {
          const systemSettings = response.data.data
          
          // 填充基本设置
          if (systemSettings.basic) {
            Object.assign(basicForm, systemSettings.basic)
          }
          
          // 填充上传设置
          if (systemSettings.upload) {
            Object.assign(uploadForm, systemSettings.upload)
          }
          
          console.log('系统设置加载成功:', systemSettings)
        }
      } catch (error) {
        console.error('加载系统设置失败:', error)
        ElMessage.error('无法加载系统设置')
      }
    }
    
    // 保存七牛云设置
    const saveQiniuSettings = async () => {
      // 验证必填字段
      if (!qiniuForm.domain || !qiniuForm.bucket || !qiniuForm.accessKey || !qiniuForm.secretKey) {
        ElMessage.warning('请填写所有七牛云必填信息')
        return
      }
      
      qiniuSaving.value = true
      
      try {
        const response = await axios.post(`${API_BASE_URL}/settings/qiniu`, qiniuForm)
        
        if (response.data.success) {
          ElMessage.success('七牛云设置保存成功')
          
          // 同时更新本地Vuex存储中的相关设置
          store.dispatch('saveSettings', {
            qiniuDomain: qiniuForm.domain,
            qiniuBucket: qiniuForm.bucket
          })
        } else {
          ElMessage.error(response.data.message || '保存设置失败')
        }
      } catch (error) {
        console.error('保存七牛云设置失败:', error)
        ElMessage.error('无法保存设置，请检查网络连接')
      } finally {
        qiniuSaving.value = false
      }
    }
    
    // 测试七牛云连接
    const testQiniuConnection = async () => {
      if (!qiniuForm.accessKey || !qiniuForm.secretKey || !qiniuForm.bucket || !qiniuForm.domain) {
        ElMessage.warning('请填写所有七牛云必填信息')
        return
      }
      
      qiniuTesting.value = true
      
      try {
        // 使用专门的测试API进行真实连接测试
        const response = await axios.post(`${API_BASE_URL}/settings/qiniu/test`, qiniuForm)
        
        if (response.data.success) {
          ElMessage.success(response.data.message || '七牛云连接测试成功')
        } else {
          ElMessage.error(response.data.message || '连接测试失败')
        }
      } catch (error) {
        console.error('测试连接失败:', error)
        ElMessage.error(error.response?.data?.message || '连接测试失败，请检查配置信息')
      } finally {
        qiniuTesting.value = false
      }
    }
    
    // 保存基本设置
    const saveBasicSettings = async () => {
      basicSaving.value = true
      
      try {
        // 准备系统设置数据
        const systemSettings = {
          basic: {
            markdownFormat: basicForm.markdownFormat,
            defaultView: basicForm.defaultView,
            sortOption: basicForm.sortOption,
            pageSize: basicForm.pageSize
          }
        }
        
        const response = await axios.post(`${API_BASE_URL}/settings/system`, systemSettings)
        
        if (response.data.success) {
          ElMessage.success('基本设置保存成功')
          
          // 更新本地Vuex存储
          const [sortBy, sortDirection] = basicForm.sortOption.split(':')
          store.dispatch('saveSettings', {
            markdownFormat: basicForm.markdownFormat,
            defaultView: basicForm.defaultView,
            sortBy,
            sortDirection,
            pageSize: basicForm.pageSize
          })
        } else {
          ElMessage.error(response.data.message || '保存设置失败')
        }
      } catch (error) {
        console.error('保存基本设置失败:', error)
        ElMessage.error('无法保存设置，请检查网络连接')
      } finally {
        basicSaving.value = false
      }
    }
    
    // 保存上传设置
    const saveUploadSettings = async () => {
      uploadSaving.value = true
      
      try {
        // 获取当前系统设置
        let systemSettings = {}
        try {
          const response = await axios.get(`${API_BASE_URL}/settings/system`)
          if (response.data.success && response.data.data) {
            systemSettings = response.data.data
          }
        } catch (error) {
          console.error('加载现有系统设置失败:', error)
        }
        
        // 合并上传设置
        systemSettings.upload = {
          renameType: uploadForm.renameType,
          customNamePattern: uploadForm.customNamePattern,
          compress: uploadForm.compress,
          compressQuality: uploadForm.compressQuality,
          maxSize: uploadForm.maxSize,
          allowTypes: uploadForm.allowTypes
        }
        
        const response = await axios.post(`${API_BASE_URL}/settings/system`, systemSettings)
        
        if (response.data.success) {
          ElMessage.success('上传设置保存成功')
          
          // 更新本地Vuex存储中的上传设置
          store.dispatch('saveSettings', {
            uploadConfig: {
              compress: uploadForm.compress,
              autoRename: uploadForm.renameType !== 'original',
              maxSize: uploadForm.maxSize,
              allowedTypes: uploadForm.allowTypes.map(type => `image/${type}`)
            }
          })
        } else {
          ElMessage.error(response.data.message || '保存设置失败')
        }
      } catch (error) {
        console.error('保存上传设置失败:', error)
        ElMessage.error('无法保存设置，请检查网络连接')
      } finally {
        uploadSaving.value = false
      }
    }
    
    // 重置所有设置
    const resetAllSettings = () => {
      ElMessageBox.confirm(
        '确定要重置所有设置吗？这将恢复所有设置到默认值。',
        '重置设置',
        {
          confirmButtonText: '确定重置',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 重置七牛云设置
          Object.assign(qiniuForm, {
            domain: '',
            bucket: '',
            accessKey: '',
            secretKey: '',
            region: 'z0'
          })
          
          // 重置基本设置
          Object.assign(basicForm, {
            markdownFormat: '![{filename}]({url})',
            defaultView: 'grid',
            sortOption: 'uploadTime:desc',
            pageSize: 20
          })
          
          // 重置上传设置
          Object.assign(uploadForm, {
            renameType: 'uuid',
            customNamePattern: '{year}{month}{day}_{filename}',
            compress: true,
            compressQuality: 85,
            maxSize: 5,
            allowTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp']
          })
          
          // 保存重置后的设置到后端
          await Promise.all([
            axios.post(`${API_BASE_URL}/settings/qiniu`, qiniuForm),
            axios.post(`${API_BASE_URL}/settings/system`, {
              basic: basicForm,
              upload: uploadForm
            })
          ])
          
          ElMessage.success('所有设置已重置为默认值')
        } catch (error) {
          console.error('重置设置失败:', error)
          ElMessage.error('重置设置失败，请重试')
        }
      }).catch(() => {
        // 用户取消
      })
    }
    
    // 打开项目主页
    const openProjectPage = () => {
      window.open('https://github.com/Auroral0810/PicMark', '_blank')
    }
    
    return {
      activeTab,
      qiniuForm,
      qiniuSaving,
      qiniuTesting,
      basicForm,
      basicSaving,
      uploadForm,
      uploadSaving,
      regionOptions,
      saveQiniuSettings,
      testQiniuConnection,
      saveBasicSettings,
      saveUploadSettings,
      resetAllSettings,
      openProjectPage
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal) var(--transition-function);
}

.settings-header {
  padding: 24px 36px 0;
  margin-bottom: 12px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.page-description {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0;
}

.settings-tabs {
  margin-top: 24px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.tab-content {
  padding: 0 24px;
}

.section-header {
  margin-bottom: 32px;
}

.settings-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.settings-subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.settings-form {
  max-width: 700px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.form-tip {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.region-select, 
.full-width-select,
.page-size-select {
  width: 100%;
  max-width: 400px;
}

.view-mode-container {
  margin-top: 8px;
  width: 100%;
}

.view-radio-group {
  display: flex;
  gap: 24px;
  width: 100%;
}

.view-radio-button {
  flex: 1;
  max-width: 180px;
  text-align: center;
}

.view-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
}

.view-icon {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.view-icon-preview {
  width: 80px;
  height: 60px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  padding: 8px;
}

.grid-preview {
  flex-wrap: wrap;
  gap: a4px;
}

.grid-preview div {
  width: 30px;
  height: 20px;
  background-color: rgba(59, 130, 246, 0.3);
  border-radius: 4px;
}

.list-preview {
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
}

.list-preview div {
  width: 100%;
  height: 10px;
  background-color: rgba(59, 130, 246, 0.3);
  border-radius: 4px;
}

.sort-option-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 24px;
}

.page-size-slider {
  flex: 1;
  max-width: 400px;
}

.page-size-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.size-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.size-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.about-wrapper {
  width: 100%;
  max-width: 100%;
}

.about-header-card {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 24px;
  padding: 32px;
  background-color: #f8fafc;
  border-radius: var(--border-radius-lg);
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .about-header-card {
  background-color: #1e293b;
}

.about-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}

.about-content-card {
  background-color: #ffffff;
  border-radius: var(--border-radius-lg);
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
}

[data-theme="dark"] .about-content-card {
  background-color: #0f172a;
}

.about-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.about-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

[data-theme="dark"] .about-section {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.about-logo-container {
  position: relative;
  flex-shrink: 0;
}

.about-logo {
  width: 96px;
  height: 96px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  border-radius: 20px;
}

.logo-glow {
  position: absolute;
  width: 96px;
  height: 96px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%);
  border-radius: 20px;
  top: 0;
  left: 0;
  filter: blur(10px);
  z-index: 1;
}

.about-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.about-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.about-version-tag {
  display: inline-block;
  font-size: 14px;
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
  margin-bottom: 12px;
  align-self: flex-start;
}

.about-description {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.about-description-text {
  margin-bottom: 0;
  font-size: 16px;
  line-height: 1.6;
}

.tech-tag {
  display: inline-block;
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
  margin: 0 2px;
}

.feature-heading {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon-container {
  width: 32px;
  height: 32px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 16px;
  flex-shrink: 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.feature-list li:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.feature-item-icon {
  width: 28px;
  height: 28px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.contact-text {
  padding: 0 12px;
  margin-bottom: 24px;
}

.about-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.project-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.project-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.system-info {
  padding: 8px 12px;
}

.info-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .info-item {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  width: 90px;
  color: var(--text-secondary);
}

.info-value {
  flex: 1;
  color: var(--text-primary);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .settings-header {
    padding: 20px 20px 0;
  }
  
  .tab-content {
    padding: 0 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .settings-title {
    font-size: 20px;
  }
  
  .about-content-grid {
    grid-template-columns: 1fr;
  }
  
  .about-header-card {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }
  
  .about-info {
    align-items: center;
  }
  
  .file-type-checkboxes {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style> 