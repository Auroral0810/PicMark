<template>
  <div class="upload-container">
    <!-- 上传区和预处理选项 -->
    <div class="main-upload-area">
      <el-row :gutter="24">
        <el-col :span="16">
          <!-- 拖拽上传区域 -->
          <el-card class="upload-card">
            <div 
              class="upload-drop-zone"
              :class="{ 'is-active': isDragging }"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
              @click="triggerFileSelector"
            >
              <div class="upload-content">
                <div class="upload-icon">
                  <el-icon v-if="isDragging"><UploadFilled /></el-icon>
                  <el-icon v-else><Upload /></el-icon>
                </div>
                <div class="upload-text">
                  <div class="upload-title">拖放图片到此处，或点击上传</div>
                  <div class="upload-desc">支持单张或多张图片同时上传</div>
                </div>
                <input
                  type="file"
                  ref="fileInput"
                  multiple
                  accept="image/*"
                  class="file-input"
                  @change="onFileChange"
                />
              </div>
            </div>
          
            <!-- 剪贴板和URL上传 -->
            <div class="alt-upload-methods">
              <div class="paste-upload">
                <el-button type="primary" class="paste-btn" @click="focusForPaste">
                  <el-icon><DocumentCopy /></el-icon>
                  <span>从剪贴板粘贴 (Ctrl+V)</span>
                </el-button>
              </div>
              
              <div class="url-upload">
                <el-input
                  v-model="imageUrl"
                  placeholder="输入图片URL"
                  class="input-with-button"
                >
                  <template #append>
                    <el-button @click="fetchImageFromURL">获取</el-button>
                  </template>
                </el-input>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <!-- 上传设置 -->
          <el-card class="settings-card" shadow="hover">
            <template #header>
              <div class="settings-header">
                <h3>上传设置</h3>
              </div>
            </template>
            
            <div class="settings-content">
              <div class="settings-item">
                <el-switch
                  v-model="compress"
                  active-text="压缩图片"
                  inactive-text="原图上传"
                />
                <div class="setting-description">
                  减小文件大小，提高加载速度
                </div>
              </div>
              
              <div class="settings-item" v-if="compress">
                <div class="setting-label">压缩质量</div>
                <el-slider
                  v-model="compressQuality"
                  :min="60"
                  :max="95"
                  :format-tooltip="formatQualityTooltip"
                />
              </div>
              
              <div class="settings-item">
                <el-switch
                  v-model="convertFormat"
                  active-text="转换格式"
                />
                <div class="setting-description">
                  转换为更高效的图片格式
                </div>
              </div>
              
              <div class="settings-item" v-if="convertFormat">
                <div class="setting-label">目标格式</div>
                <el-radio-group v-model="targetFormat">
                  <el-radio label="webp">WebP (最佳压缩)</el-radio>
                  <el-radio label="jpeg">JPEG (广泛兼容)</el-radio>
                  <el-radio label="png">PNG (无损透明)</el-radio>
                </el-radio-group>
              </div>
              
              <div class="settings-item">
                <el-switch
                  v-model="autoRename"
                  active-text="自动重命名"
                />
                <div class="setting-description">
                  防止文件名冲突
                </div>
              </div>
              
              <div class="settings-item">
                <el-switch
                  v-model="addWatermark"
                  active-text="添加水印"
                />
                <div class="setting-description">
                  防止未授权使用
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 上传队列和结果 -->
    <div class="upload-queue-section" v-if="uploadQueue.length > 0 || uploadResults.length > 0">
      <!-- 上传队列 -->
      <el-card class="queue-card" v-if="uploadQueue.length > 0">
        <template #header>
          <div class="section-header">
            <h3>上传队列 ({{ uploadQueue.length }})</h3>
            <div class="section-actions">
              <el-button size="small" @click="clearQueue">清空队列</el-button>
              <el-button size="small" type="primary" @click="startUpload" :loading="isUploading">
                {{ isUploading ? '上传中...' : '开始上传' }}
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table :data="uploadQueue" style="width: 100%">
          <!-- 队列表格内容 -->
          <el-table-column width="80">
            <template #default="scope">
              <div class="image-thumbnail">
                <el-image :src="scope.row.preview" fit="cover"></el-image>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="name" label="文件名" min-width="180"></el-table-column>
          
          <el-table-column label="大小" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.size) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeFromQueue(scope.$index)" circle>
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 上传进度 -->
        <div class="upload-progress" v-if="isUploading">
          <el-progress
            :percentage="uploadProgress"
            :format="progressFormat"
            :stroke-width="10"
            status="success"
          />
        </div>
      </el-card>
      
      <!-- 上传结果 -->
      <el-card class="results-card" v-if="uploadResults.length > 0">
        <template #header>
          <div class="section-header">
            <h3>上传结果 ({{ uploadResults.length }})</h3>
            <div class="section-actions">
              <el-button-group>
                <el-button size="small" @click="copyAllLinks('markdown')">复制所有Markdown</el-button>
                <el-button size="small" @click="copyAllLinks('html')">复制所有HTML</el-button>
                <el-button size="small" @click="copyAllLinks('plain')">复制所有URL</el-button>
              </el-button-group>
            </div>
          </div>
        </template>
        
        <el-table :data="uploadResults" style="width: 100%">
          <el-table-column width="100">
            <template #default="scope">
              <div class="image-thumbnail">
                <el-image :src="scope.row.url" :preview-src-list="[scope.row.url]" fit="cover"></el-image>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="title" label="文件名" min-width="150"></el-table-column>
          
          <el-table-column label="链接" min-width="180">
            <template #default="scope">
              <el-tabs type="border-card" class="mini-tabs">
                <el-tab-pane label="Markdown">
                  <div class="code-block">
                    <code>{{ scope.row.markdownLink }}</code>
                    <el-button size="small" circle @click="copyLink(scope.row, 'markdown')">
                      <el-icon><Copy /></el-icon>
                    </el-button>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="HTML">
                  <div class="code-block">
                    <code>{{ scope.row.htmlLink }}</code>
                    <el-button size="small" circle @click="copyLink(scope.row, 'html')">
                      <el-icon><Copy /></el-icon>
                    </el-button>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="URL">
                  <div class="code-block">
                    <code>{{ scope.row.url }}</code>
                    <el-button size="small" circle @click="copyLink(scope.row, 'plain')">
                      <el-icon><Copy /></el-icon>
                    </el-button>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button-group>
                <el-button size="small" type="primary" @click="viewImage(scope.row)" plain>
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button size="small" type="success" @click="editImage(scope.row)" plain>
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click="deleteImage(scope.row)" plain>
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <!-- Markdown文件处理 -->
    <div class="markdown-process-section">
      <el-card class="markdown-card">
        <template #header>
          <div class="card-header">
            <h3>Markdown 文件处理</h3>
          </div>
        </template>
        <div class="card-content">
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="markdown-feature">
                <div class="feature-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="feature-content">
                  <h4>提取并上传本地图片</h4>
                  <p>从Markdown文件中提取本地图片引用，上传并替换为云端链接</p>
                  <el-button type="primary" plain @click="processMarkdownFile">
                    选择Markdown文件
                  </el-button>
                </div>
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="markdown-feature">
                <div class="feature-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="feature-content">
                  <h4>批量处理多个文件</h4>
                  <p>一次性处理多个Markdown文件，自动上传所有本地图片</p>
                  <el-button type="primary" plain @click="processBatchMarkdown">
                    选择文件夹
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'UploadPage',
  setup() {
    const store = useStore()
    
    // 上传区域状态
    const isDragging = ref(false)
    const fileInput = ref(null)
    
    // 上传设置
    const compress = ref(store.state.uploadConfig.compress)
    const autoRename = ref(store.state.uploadConfig.autoRename)
    const maxSizeMB = computed(() => store.state.uploadConfig.maxSize)
    const allowedTypes = computed(() => store.state.uploadConfig.allowedTypes)
    
    // 上传队列和结果
    const uploadQueue = ref([])
    const uploadResults = ref([])
    const isUploading = ref(false)
    
    // 拖拽处理
    const onDragOver = () => {
      isDragging.value = true
    }
    
    const onDragLeave = () => {
      isDragging.value = false
    }
    
    const onDrop = (e) => {
      isDragging.value = false
      const files = Array.from(e.dataTransfer.files)
      addFilesToQueue(files)
    }
    
    // 文件选择
    const triggerFileSelector = () => {
      fileInput.value.click()
    }
    
    const onFileChange = (e) => {
      const files = Array.from(e.target.files)
      addFilesToQueue(files)
      // 重置input，允许重复选择相同文件
      e.target.value = null
    }
    
    // 队列处理
    const addFilesToQueue = (files) => {
      const imageFiles = files.filter(file => {
        // 检查文件类型是否为图片
        const isImage = file.type.startsWith('image/')
        const isAllowedType = allowedTypes.value.includes(file.type)
        const isSizeValid = file.size <= maxSizeMB.value * 1024 * 1024

        if (!isImage) {
          ElMessage.warning(`${file.name} 不是图片文件`)
        } else if (!isAllowedType) {
          ElMessage.warning(`${file.name} 格式不支持，仅支持 ${allowedTypes.value.map(type => type.split('/')[1].toUpperCase()).join(', ')}`)
        } else if (!isSizeValid) {
          ElMessage.warning(`${file.name} 超过大小限制 ${maxSizeMB.value}MB`)
        }
        
        return isImage && isAllowedType && isSizeValid
      })
      
      if (imageFiles.length === 0) return
      
      // 生成预览并添加到队列
      imageFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          uploadQueue.value.push({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
      
      ElMessage.success(`已添加 ${imageFiles.length} 个文件到上传队列`)
    }
    
    const removeFromQueue = (index) => {
      uploadQueue.value.splice(index, 1)
    }
    
    const clearQueue = () => {
      uploadQueue.value = []
    }
    
    // 上传处理
    const startUpload = async () => {
      if (uploadQueue.value.length === 0) {
        ElMessage.warning('上传队列为空')
        return
      }
      
      isUploading.value = true
      
      try {
        // 获取上传文件
        const files = uploadQueue.value.map(item => item.file)
        
        // 调用store上传方法，将真实处理上传到七牛云
        const results = await store.dispatch('uploadImages', files)
        
        // 更新上传结果
        uploadResults.value = [...results, ...uploadResults.value]
        
        ElMessage.success(`成功上传 ${files.length} 个文件`)
        
        // 清空队列
        clearQueue()
      } catch (error) {
        console.error('上传失败:', error)
        ElMessage.error('上传失败，请重试')
      } finally {
        isUploading.value = false
      }
    }
    
    // Markdown处理
    const generateMarkdownLink = (image) => {
      const format = store.state.settings.markdownFormat
      return format
        .replace('{filename}', image.title || image.filename)
        .replace('{url}', image.url)
    }
    
    const copyMarkdownLink = (image) => {
      const markdown = generateMarkdownLink(image)
      navigator.clipboard.writeText(markdown).then(() => {
        ElMessage.success('Markdown链接已复制到剪贴板')
      }).catch(err => {
        console.error('复制失败:', err)
        ElMessage.error('复制失败')
      })
    }
    
    const copyImageUrl = (image) => {
      navigator.clipboard.writeText(image.url).then(() => {
        ElMessage.success('图片链接已复制到剪贴板')
      }).catch(err => {
        console.error('复制失败:', err)
        ElMessage.error('复制失败')
      })
    }
    
    const copyLink = (image, type) => {
      let content = '';
      
      switch(type) {
        case 'markdown':
          content = image.markdownLink;
          break;
        case 'html':
          content = image.htmlLink;
          break;
        case 'plain':
        default:
          content = image.url;
          break;
      }
      
      navigator.clipboard.writeText(content).then(() => {
        ElMessage.success('链接已复制到剪贴板');
      }).catch(err => {
        console.error('复制失败:', err);
        ElMessage.error('复制失败');
      });
    };
    
    const copyAllLinks = (type) => {
      if (uploadResults.value.length === 0) return;
      
      let content = '';
      
      switch(type) {
        case 'markdown':
          content = uploadResults.value
            .map(image => image.markdownLink)
            .join('\n');
          break;
        case 'html':
          content = uploadResults.value
            .map(image => image.htmlLink)
            .join('\n');
          break;
        case 'plain':
        default:
          content = uploadResults.value
            .map(image => image.url)
            .join('\n');
          break;
      }
      
      navigator.clipboard.writeText(content).then(() => {
        ElMessage.success(`所有${type === 'markdown' ? 'Markdown' : type === 'html' ? 'HTML' : 'URL'}链接已复制到剪贴板`);
      }).catch(err => {
        console.error('复制失败:', err);
        ElMessage.error('复制失败');
      });
    };
    
    const viewImage = (image) => {
      window.open(image.url, '_blank');
    };
    
    const editImage = () => {
      // 可以打开编辑对话框
      ElMessage.info('图片编辑功能尚未实现');
    };
    
    const deleteImage = (image) => {
      ElMessageBox.confirm(
        '确定要删除这张图片吗？这将从七牛云删除该图片。',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await store.dispatch('deleteImage', image.id);
          ElMessage.success('图片已成功删除');
          // 从上传结果中移除该图片
          uploadResults.value = uploadResults.value.filter(img => img.id !== image.id);
        } catch (error) {
          ElMessage.error('删除失败：' + error.message);
        }
      }).catch(() => {
        // 用户取消删除
      });
    };
    
    // 从Markdown上传图片
    const processMarkdownFile = () => {
      // 在实际应用中，这将打开一个文件选择器
      ElMessage.info('此功能尚未实现，敬请期待')
    }
    
    // 剪贴板处理
    const handlePaste = (e) => {
      const items = (e.clipboardData || window.clipboardData).items
      if (!items) return
      
      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
      
      if (imageItems.length === 0) {
        return
      }
      
      const files = imageItems.map(item => item.getAsFile())
      addFilesToQueue(files)
    }
    
    const focusForPaste = () => {
      ElMessage.info('请按Ctrl+V粘贴图片')
      // 实际上，我们已经在document上监听了粘贴事件
    }
    
    // 辅助函数
    const formatFileSize = (size) => {
      if (!size) return '0 Bytes'
      const units = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(size) / Math.log(1024))
      return Math.round(size / Math.pow(1024, i), 2) + ' ' + units[i]
    }
    
    // 监听粘贴事件
    const setupPasteListener = () => {
      document.addEventListener('paste', handlePaste)
    }
    
    // 生命周期钩子
    onMounted(() => {
      setupPasteListener()
      
      // 保存上传设置
      watch(compress, (newValue) => {
        store.commit('SET_UPLOAD_CONFIG', { compress: newValue })
      })
      
      watch(autoRename, (newValue) => {
        store.commit('SET_UPLOAD_CONFIG', { autoRename: newValue })
      })
    })
    
    onUnmounted(() => {
      document.removeEventListener('paste', handlePaste)
    })
    
    return {
      isDragging,
      fileInput,
      compress,
      autoRename,
      maxSizeMB,
      uploadQueue,
      uploadResults,
      isUploading,
      onDragOver,
      onDragLeave,
      onDrop,
      triggerFileSelector,
      onFileChange,
      removeFromQueue,
      clearQueue,
      startUpload,
      generateMarkdownLink,
      copyMarkdownLink,
      copyImageUrl,
      copyLink,
      copyAllLinks,
      processMarkdownFile,
      focusForPaste,
      formatFileSize,
      viewImage,
      editImage,
      deleteImage
    }
  }
}
</script>

<style scoped>
.upload-container {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.main-upload-area {
  margin-bottom: 32px;
}

.upload-card,
.settings-card,
.queue-card,
.results-card,
.markdown-card {
  transition: all var(--transition-normal) var(--transition-function);
  border-radius: 12px;
}

.upload-card:hover,
.settings-card:hover,
.markdown-card:hover {
  transform: translateY(-2px);
}

/* 拖拽上传区域 */
.upload-drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 10px;
  padding: 48px 24px;
  text-align: center;
  transition: all var(--transition-normal) var(--transition-function);
  cursor: pointer;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-content {
  max-width: 400px;
}

.upload-drop-zone:hover {
  border-color: var(--primary-color);
  background-color: rgba(59, 130, 246, 0.02);
}

.upload-drop-zone.is-active {
  border-color: var(--primary-color);
  background-color: rgba(59, 130, 246, 0.05);
}

.upload-icon {
  font-size: 64px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.upload-text {
  margin-bottom: 16px;
}

.upload-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-size: 20px;
}

.upload-desc {
  color: var(--text-secondary);
  font-size: 14px;
}

.file-input {
  display: none;
}

.alt-upload-methods {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px;
}

.paste-btn {
  width: 100%;
  height: 42px;
}

.input-with-button {
  width: 100%;
}

/* 设置卡片 */
.settings-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.settings-content {
  padding: 8px 0;
}

.settings-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.settings-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.setting-label {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.setting-description {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 8px;
}

/* 队列和结果区域 */
.upload-queue-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.upload-progress {
  margin-top: 24px;
}

/* Markdown处理部分 */
.markdown-process-section {
  margin-top: 32px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-content {
  padding: 16px 0;
}

.markdown-feature {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 24px;
  border-radius: 12px;
  background-color: var(--bg-light);
  transition: all var(--transition-normal) var(--transition-function);
  height: 100%;
}

.markdown-feature:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}

[data-theme="dark"] .markdown-feature {
  background-color: #111827;
}

[data-theme="dark"] .markdown-feature:hover {
  background-color: #0f172a;
}

.feature-icon {
  font-size: 24px;
  margin-right: 20px;
  color: var(--primary-color);
  background-color: var(--primary-light);
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

[data-theme="dark"] .feature-icon {
  background-color: #1e40af;
  color: #60a5fa;
}

.feature-content {
  flex: 1;
}

.markdown-feature h4 {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 16px;
}

.markdown-feature p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.markdown-feature button {
  margin-top: 8px;
}

/* 深色模式适配 */
[data-theme="dark"] .upload-drop-zone {
  background-color: rgba(31, 41, 55, 0.7);
  border-color: #4b5563;
}

[data-theme="dark"] .upload-drop-zone:hover {
  border-color: #60a5fa;
  background-color: rgba(17, 24, 39, 0.8);
}

[data-theme="dark"] .upload-drop-zone.is-active {
  border-color: #60a5fa;
  background-color: rgba(59, 130, 246, 0.15);
}

[data-theme="dark"] .upload-icon {
  color: #e5e7eb;
}

[data-theme="dark"] .upload-title {
  color: #f9fafb;
}

[data-theme="dark"] .upload-desc {
  color: #9ca3af;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .upload-container {
    padding: 16px;
  }
  
  .upload-drop-zone {
    padding: 32px 16px;
    min-height: 200px;
  }
  
  .upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .upload-title {
    font-size: 18px;
  }
  
  .markdown-feature {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .feature-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }
}

.image-thumbnail {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.image-thumbnail .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.code-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 8px 0;
}

.code-block code {
  font-family: monospace;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.mini-tabs :deep(.el-tabs__content) {
  padding: 10px 5px;
}

.mini-tabs :deep(.el-tabs__header) {
  margin-bottom: 5px;
}

.mini-tabs :deep(.el-tabs__item) {
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
}

.results-card {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style> 