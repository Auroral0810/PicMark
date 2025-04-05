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
          
          <el-table-column prop="name" label="文件名" min-width="180">
            <template #default="scope">
              <div class="filename-edit">
                <el-input
                  v-if="scope.row.isRenaming"
                  v-model="scope.row.name"
                  size="small"
                  @blur="finishRenaming(scope.row)"
                  @keyup.enter="finishRenaming(scope.row)"
                  placeholder="输入新文件名"
                  clearable
                ></el-input>
                <div v-else class="filename-display">
                  {{ scope.row.name }}
                  <el-button
                    type="primary"
                    size="small"
                    text
                    @click="startRenaming(scope.row)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="大小" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.size) }}
            </template>
          </el-table-column>
          
          <el-table-column label="文件夹" width="160">
            <template #default="scope">
              <el-select
                v-model="scope.row.folder"
                placeholder="选择文件夹"
                size="small"
                clearable
                style="width: 130px"
              >
                <el-option
                  v-for="folder in folders"
                  :key="folder.id"
                  :label="folder.name"
                  :value="folder.id"
                ></el-option>
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="标签" min-width="200">
            <template #default="scope">
              <el-select
                v-model="scope.row.tags"
                multiple
                placeholder="选择标签"
                size="small"
                style="width: 100%"
                collapse-tags
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.name"
                  :label="tag.name"
                  :value="tag.name"
                ></el-option>
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <div class="action-buttons">
                <el-tooltip content="预览压缩效果" placement="top">
                  <el-button
                    v-if="compress && scope.row.file.type !== 'image/gif' && scope.row.file.type !== 'image/svg+xml'"
                    size="small"
                    @click="previewCompression(scope.row.file)"
                    :disabled="!compress"
                  >
                    <el-icon><ZoomIn /></el-icon>
                  </el-button>
                </el-tooltip>
                
                <el-tooltip content="从队列移除" placement="top">
                  <el-button
                    size="small"
                    type="danger"
                    @click="removeFromQueue(scope.$index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 压缩预览对话框 -->
      <el-dialog
        v-model="previewCompressed"
        title="压缩预览"
        width="80%"
        center
      >
        <div class="compression-preview-container">
          <div class="compression-preview-item">
            <h4>原始图片 ({{ compressionStats.originalType || '未知' }})</h4>
            <div class="preview-image">
              <el-image :src="originalPreview" fit="contain" />
            </div>
            <div class="preview-info">
              <div class="info-label">大小:</div>
              <div class="info-value">{{ formatFileSize(compressionStats.original) }}</div>
            </div>
          </div>
          
          <div class="compression-divider">
            <el-icon><Right /></el-icon>
          </div>
          
          <div class="compression-preview-item">
            <h4>
              压缩后图片 (质量: {{ compressQuality }}%)
              <span v-if="compressionStats.status" class="status-badge">
                {{ compressionStats.status }}
              </span>
            </h4>
            <div class="preview-image">
              <el-image :src="compressedPreview" fit="contain" />
            </div>
            <div class="preview-info">
              <div class="info-label">大小:</div>
              <div class="info-value">
                {{ formatFileSize(compressionStats.compressed) }}
                <span v-if="compressionStats.compressedType">
                  ({{ compressionStats.compressedType }})
                </span>
              </div>
            </div>
            
            <div class="compression-stats">
              <el-progress 
                :percentage="Number(compressionStats.savedPercent)" 
                :color="getCompressionColor(compressionStats.savedPercent)"
                :stroke-width="16"
                :format="formatCompressionProgress"
              ></el-progress>
              
              <div class="compression-details" v-if="compressionStats.compressed">
                <div class="detail-item">
                  <span class="detail-label">节省空间:</span>
                  <span class="detail-value">{{ formatFileSize(compressionStats.original - compressionStats.compressed) }}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">压缩率:</span>
                  <span 
                    class="detail-value" 
                    :class="{'excellent': Number(compressionStats.savedPercent) > 50, 
                            'good': Number(compressionStats.savedPercent) > 20 && Number(compressionStats.savedPercent) <= 50,
                            'fair': Number(compressionStats.savedPercent) > 5 && Number(compressionStats.savedPercent) <= 20,
                            'poor': Number(compressionStats.savedPercent) <= 5}">
                    {{ compressionStats.savedPercent }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-dialog>
      
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
    const compressQuality = ref(store.state.uploadConfig.compressQuality)
    const convertFormat = ref(false)
    const targetFormat = ref('webp')
    const autoRename = ref(store.state.uploadConfig.autoRename)
    
    // 从store中获取文件限制
    const allowedTypes = computed(() => store.state.uploadConfig.allowedTypes)
    const maxSizeMB = computed(() => store.state.uploadConfig.maxSize)
    
    // 监听store中的uploadConfig变化，同步更新本地设置
    watch(() => store.state.uploadConfig, (newConfig) => {
      compress.value = newConfig.compress;
      compressQuality.value = newConfig.compressQuality;
      autoRename.value = newConfig.autoRename;
      
      console.log('从store获取上传配置更新:', {
        压缩: compress.value ? '启用' : '禁用',
        压缩质量: `${compressQuality.value}%`,
        允许类型: allowedTypes.value,
        最大文件大小: `${maxSizeMB.value}MB`
      });
    }, { deep: true });
    
    // 监听压缩设置变化
    watch(compress, (newValue) => {
      if (!newValue) {
        // 如果关闭压缩，显示提示
        console.log('压缩功能已关闭，将上传原始图片');
      } else {
        console.log(`压缩功能已开启，质量设置为: ${compressQuality.value}%`);
      }
    });
    
    // 监听压缩质量变化
    watch(compressQuality, (newValue) => {
      if (compress.value) {
        console.log(`压缩质量已调整为: ${newValue}%`);
      }
    });
    
    // 格式化压缩质量显示
    const formatQualityTooltip = (val) => {
      return `质量: ${val}%`;
    }
    
    // 预览压缩结果
    const previewCompression = async (file) => {
      if (!file || !compress.value) return;
      
      try {
        previewCompressed.value = true;
        originalPreview.value = URL.createObjectURL(file);
        
        // 添加加载状态
        compressionStats.value = {
          original: file.size,
          compressed: 0,
          savedPercent: 0,
          status: '处理中...'
        };
        
        // 添加加载状态提示
        ElMessage.info({
          message: '正在压缩图片，请稍候...',
          duration: 1000
        });
        
        console.log(`===== 开始压缩预览 =====`);
        console.log(`文件: ${file.name}, 类型: ${file.type}, 大小: ${(file.size/1024).toFixed(2)}KB`);
        
        const compressedFile = await store.dispatch('compressImage', {
          file,
          quality: compressQuality.value
        });
        
        // 检查压缩是否生效
        const wasCompressed = compressedFile !== file;
        const savedPercent = wasCompressed 
          ? ((1 - compressedFile.size / file.size) * 100).toFixed(1)
          : 0;
        
        if (wasCompressed) {
          compressedPreview.value = URL.createObjectURL(compressedFile);
          
          compressionStats.value = {
            original: file.size,
            compressed: compressedFile.size,
            savedPercent: savedPercent,
            originalType: file.type.split('/')[1].toUpperCase(),
            compressedType: compressedFile.type.split('/')[1].toUpperCase(),
            status: '完成'
          };
          
          console.log(`===== 压缩预览结果 =====`);
          console.log(`原始文件: 类型=${file.type}, 大小=${(file.size/1024).toFixed(2)}KB`);
          console.log(`压缩文件: 类型=${compressedFile.type}, 大小=${(compressedFile.size/1024).toFixed(2)}KB`);
          console.log(`节省空间: ${savedPercent}%, ${((file.size - compressedFile.size)/1024).toFixed(2)}KB`);
          
          // 判断压缩效果并显示相应消息
          if (Number(savedPercent) > 20) {
            ElMessage.success(`压缩效果显著: 节省了 ${savedPercent}% 的空间 (${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)})`);
          } else if (Number(savedPercent) > 5) {
            ElMessage.info(`压缩效果一般: 节省了 ${savedPercent}% 的空间 (${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)})`);
          } else {
            ElMessage.warning(`压缩效果有限: 仅节省了 ${savedPercent}% 的空间，建议直接使用原图`);
          }
        } else {
          // 压缩无效的情况
          compressedPreview.value = originalPreview.value;
          
          compressionStats.value = {
            original: file.size,
            compressed: file.size,
            savedPercent: 0,
            originalType: file.type.split('/')[1].toUpperCase(),
            compressedType: file.type.split('/')[1].toUpperCase(),
            status: '未压缩(使用原图)'
          };
          
          console.log(`压缩无效: 文件类型 ${file.type} 不适合压缩或压缩后无明显改善`);
          ElMessage.info(`该图片 (${file.type.split('/')[1].toUpperCase()}) 压缩效果不明显，将使用原图上传`);
        }
      } catch (error) {
        console.error('压缩预览失败:', error);
        compressedPreview.value = originalPreview.value;
        
        compressionStats.value = {
          original: file.size,
          compressed: file.size,
          savedPercent: 0,
          status: '失败: ' + (error.message || '未知错误')
        };
        
        ElMessage.warning(`压缩预览失败: ${error.message || '未知错误'}，将使用原始文件`);
      }
    }
    
    // 上传队列和结果
    const uploadQueue = ref([])
    const uploadResults = ref([])
    const isUploading = ref(false)
    const uploadProgress = ref(0)
    
    // 添加文件夹和标签状态
    const folders = ref([])
    const tags = ref([])
    
    // 预览压缩结果
    const previewCompressed = ref(false)
    const originalPreview = ref(null)
    const compressedPreview = ref(null)
    const compressionStats = ref({
      original: 0,
      compressed: 0,
      savedPercent: 0
    })
    
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
        
        // 检查是否在允许的文件类型列表中
        const isAllowedType = allowedTypes.value.includes(file.type)
        
        // 检查文件大小是否符合限制
        const isSizeValid = file.size <= maxSizeMB.value * 1024 * 1024

        // 显示适当的错误消息
        if (!isImage) {
          ElMessage.warning(`${file.name} 不是图片文件`)
        } else if (!isAllowedType) {
          const supportedFormats = allowedTypes.value.map(type => {
            // 提取格式名称
            const formatName = type.split('/')[1]
            return formatName.toUpperCase()
          }).join(', ')
          
          // 显示更详细的错误信息
          ElMessage.warning({
            duration: 5000,
            showClose: true,
            dangerouslyUseHTMLString: true,
            message: `<div>
              <p><strong>${file.name}</strong> 格式不支持</p>
              <p>文件类型: ${file.type}</p>
              <p>请在系统设置中选择允许此类型的文件</p>
              <p>当前支持的格式: ${supportedFormats}</p>
            </div>`
          })
          
          console.log(`文件 ${file.name} 类型 ${file.type} 不在允许列表中`, allowedTypes.value)
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
            preview: e.target.result,
            folder: '', // 默认为空，用户可选择
            tags: [], // 默认为空数组，用户可添加
            isRenaming: false // 重命名状态控制
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
    
    // 开始/结束重命名
    const startRenaming = (item) => {
      item.isRenaming = true
    }
    
    const finishRenaming = (item) => {
      item.isRenaming = false
      
      // 如果名称为空，恢复原名
      if (!item.name || item.name.trim() === '') {
        item.name = item.file.name
      }
    }
    
    // 上传处理
    const startUpload = async () => {
      if (uploadQueue.value.length === 0) {
        ElMessage.warning('上传队列为空')
        return
      }
      
      isUploading.value = true
      uploadProgress.value = 0
      uploadResults.value = []
      
      const totalFiles = uploadQueue.value.length
      let uploadedCount = 0
      let successCount = 0
      let failedCount = 0
      
      // 记住用户的上传设置，更新Vuex存储
      store.commit('SET_UPLOAD_CONFIG', { 
        compress: compress.value,
        compressQuality: compressQuality.value,
        autoRename: autoRename.value
      });
      
      try {
        for (const item of uploadQueue.value) {
          try {
            console.log(`开始上传图片: ${item.name}, 压缩: ${compress.value ? '启用' : '禁用'}, 质量: ${compressQuality.value}%`);
            
            // 准备上传参数
            let uploadOptions = {
              file: item.file,
              compress: compress.value,
              compressQuality: compressQuality.value,
              convertFormat: convertFormat.value ? targetFormat.value : null
            }
            
            // 添加文件夹和标签信息
            if (item.folder) {
              uploadOptions.folderId = item.folder
            }
            
            if (item.tags && item.tags.length > 0) {
              uploadOptions.tags = item.tags
            }
            
            // 如果文件名被修改，更新file对象
            if (item.name !== item.file.name) {
              // 创建新的File对象，但保留原文件的内容和类型
              const newFile = new File([item.file], item.name, { type: item.file.type })
              uploadOptions.file = newFile
            }
            
            // 调用上传函数
            const result = await store.dispatch('uploadImage', uploadOptions)
            
            uploadResults.value.push({
              success: true,
              name: item.name,
              url: result.url,
              id: result.id,
              markdownLink: `![${item.name}](${result.url})`,
              htmlLink: `<img src="${result.url}" alt="${item.name}" />`,
              title: item.name,
              message: '上传成功'
            })
            successCount++
            
            console.log(`图片上传成功: ${item.name}, URL: ${result.url}`);
          } catch (error) {
            console.error(`上传失败: ${item.name}`, error)
            
            uploadResults.value.push({
              success: false,
              name: item.name,
              message: error.message || '上传失败'
            })
            failedCount++
            
            // 显示错误消息
            ElMessage.error({
              duration: 5000,
              showClose: true,
              message: `${item.name} 上传失败: ${error.message || '未知错误'}`
            })
          }
          
          // 更新进度
          uploadedCount++
          uploadProgress.value = Math.round((uploadedCount / totalFiles) * 100)
        }
        
        // 上传完成后清空队列
        uploadQueue.value = []
        
        // 根据上传结果显示不同的消息
        if (failedCount === 0 && successCount > 0) {
          ElMessage.success(`上传完成，所有 ${successCount} 个文件已成功上传`)
        } else if (successCount === 0) {
          ElMessage.error(`上传失败，所有 ${failedCount} 个文件都未能上传`)
        } else {
          ElMessage.warning(`上传完成，但有部分失败: ${successCount} 个成功，${failedCount} 个失败`)
        }
      } catch (error) {
        console.error('批量上传失败', error)
        ElMessage.error('上传过程发生错误: ' + (error.message || '未知错误'))
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
    
    // 获取文件夹和标签列表
    const fetchFolders = async () => {
      try {
        const result = await store.dispatch('fetchFolders')
        folders.value = result || []
      } catch (error) {
        console.error('获取文件夹列表失败:', error)
      }
    }
    
    const fetchTags = async () => {
      try {
        const result = await store.dispatch('fetchTags')
        tags.value = result || []
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      setupPasteListener()
      
      // 在组件挂载时加载文件夹和标签列表
      fetchFolders()
      fetchTags()
    })
    
    onUnmounted(() => {
      document.removeEventListener('paste', handlePaste)
      
      // 清理URL对象，防止内存泄漏
      if (originalPreview.value) {
        URL.revokeObjectURL(originalPreview.value)
      }
      
      if (compressedPreview.value && compressedPreview.value !== originalPreview.value) {
        URL.revokeObjectURL(compressedPreview.value)
      }
      
      // 清理队列中的预览
      uploadQueue.value.forEach(item => {
        if (item.preview && item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview)
        }
      })
    })
    
    return {
      isDragging,
      fileInput,
      compress,
      compressQuality,
      convertFormat,
      targetFormat,
      autoRename,
      maxSizeMB,
      uploadQueue,
      uploadResults,
      isUploading,
      uploadProgress,
      folders,
      tags,
      previewCompressed,
      originalPreview,
      compressedPreview,
      compressionStats,
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
      formatQualityTooltip,
      previewCompression,
      viewImage,
      editImage,
      deleteImage,
      startRenaming,
      finishRenaming,
      getCompressionColor: (percent) => {
        const value = Number(percent);
        if (value > 50) return '#67C23A'; // 优秀 - 绿色
        if (value > 20) return '#E6A23C'; // 良好 - 橙色
        if (value > 5) return '#909399';  // 一般 - 灰色
        return '#F56C6C';                 // 较差 - 红色
      },
      formatCompressionProgress: (percent) => {
        const value = Number(percent);
        if (value <= 0) return '无压缩效果';
        if (value > 50) return `极佳：节省 ${percent}%`;
        if (value > 20) return `良好：节省 ${percent}%`;
        if (value > 5) return `一般：节省 ${percent}%`;
        return `轻微：节省 ${percent}%`;
      }
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

.filename-edit {
  display: flex;
  align-items: center;
}

.filename-display {
  display: flex;
  align-items: center;
}

.compression-preview-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
}

.compression-preview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.preview-image .el-image {
  max-width: 100%;
  max-height: 100%;
}

.preview-info {
  display: flex;
  width: 100%;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
}

.info-label {
  font-weight: bold;
  margin-right: 10px;
  color: #606266;
}

.info-value {
  color: #303133;
}

.compression-divider {
  display: flex;
  align-items: center;
  font-size: 24px;
  color: #909399;
}

.compression-stats {
  width: 100%;
  margin-top: 16px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #f5f7fa;
  color: #303133;
  font-size: 12px;
  font-weight: 500;
}

[data-theme="dark"] .status-badge {
  background-color: #111827;
  color: #f9fafb;
}

.compression-details {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-weight: 500;
  color: #606266;
}

.detail-value {
  color: #303133;
}

[data-theme="dark"] .detail-label,
[data-theme="dark"] .detail-value {
  color: #9ca3af;
}

.excellent {
  color: #67C23A;
}

.good {
  color: #E6A23C;
}

.fair {
  color: #909399;
}

.poor {
  color: #F56C6C;
}
</style> 