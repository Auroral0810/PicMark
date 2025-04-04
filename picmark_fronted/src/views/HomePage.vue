<template>
  <div class="gallery-container">
    <!-- 顶部操作区 -->
    <div class="gallery-header">
      <div class="header-left">
        <div class="header-title">
          <h1 class="page-title">图片库</h1>
          <p class="text-secondary">管理并组织您的所有图片</p>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 搜索框 -->
        <div class="search-box">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索图片..." 
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <!-- 筛选按钮 -->
        <div class="action-btn-group">
          <el-popover
            placement="bottom-end"
            trigger="click"
            popper-class="filter-popover"
            :width="360"
            transition="el-zoom-in-top"
          >
            <template #reference>
              <el-button class="action-btn filter-btn" :class="{ 'is-active': hasActiveFilters }">
                <el-icon><Filter /></el-icon>
                <span>筛选</span>
                <el-badge v-if="filterCount > 0" :value="filterCount" class="filter-badge" />
              </el-button>
            </template>
            
            <div class="filter-content">
              <div class="filter-section">
                <div class="section-title">日期范围</div>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 100%"
                  class="date-picker-full"
                />
              </div>
              
              <div class="filter-section">
                <div class="section-title">标签</div>
                <el-select
                  v-model="selectedTags"
                  multiple
                  collapse-tags
                  placeholder="选择标签"
                  class="tag-select-full"
                >
                  <el-option
                    v-for="tag in availableTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </div>
              
              <div class="filter-actions">
                <el-button @click="clearFilters" plain>重置</el-button>
                <el-button type="primary" @click="handleFilterChange">应用筛选</el-button>
              </div>
            </div>
          </el-popover>
          
          <!-- 排序按钮 -->
          <el-dropdown trigger="click" @command="setSortOption" class="sort-dropdown">
            <el-button class="action-btn sort-btn">
              <el-icon><Sort /></el-icon>
              <span>{{ getSortLabel() }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="uploadTime:desc">最新上传</el-dropdown-item>
                <el-dropdown-item command="uploadTime:asc">最早上传</el-dropdown-item>
                <el-dropdown-item command="filename:asc">文件名A-Z</el-dropdown-item>
                <el-dropdown-item command="filename:desc">文件名Z-A</el-dropdown-item>
                <el-dropdown-item command="size:asc">文件大小↑</el-dropdown-item>
                <el-dropdown-item command="size:desc">文件大小↓</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 视图切换 -->
          <div class="view-switcher">
            <el-tooltip content="网格视图" placement="top" :hide-after="800">
              <el-button 
                class="view-btn" 
                :class="{ 'is-active': viewMode === 'grid' }" 
                @click="viewMode = 'grid'"
              >
                <el-icon><Grid /></el-icon>
              </el-button>
            </el-tooltip>
            
            <el-tooltip content="瀑布流视图" placement="top" :hide-after="800">
              <el-button 
                class="view-btn" 
                :class="{ 'is-active': viewMode === 'masonry' }" 
                @click="viewMode = 'masonry'"
              >
                <el-icon><Menu /></el-icon>
              </el-button>
            </el-tooltip>
            
            <el-tooltip content="列表视图" placement="top" :hide-after="800">
              <el-button 
                class="view-btn" 
                :class="{ 'is-active': viewMode === 'list' }" 
                @click="viewMode = 'list'"
              >
                <el-icon><List /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片展示区 -->
    <div class="gallery-content" :class="viewMode">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="10" animated />
      </div>
      
      <!-- 暂无数据状态 -->
      <div v-else-if="isEmpty" class="empty-state">
        <div class="empty-illustration">
          <img src="@/assets/images/empty.png" alt="空图库" />
        </div>
        <h2 class="empty-title">图库空空如也</h2>
        <p class="empty-desc">上传您的第一张图片，开始使用PicMark</p>
        <el-button type="primary" size="large" @click="goToUpload" class="action-button">
          <el-icon><Upload /></el-icon>
          开始上传
        </el-button>
      </div>
      
      <!-- 网格视图 -->
      <template v-else-if="viewMode === 'grid'">
        <div class="image-grid">
          <div v-for="image in currentImages" :key="image.id" class="image-card">
            <div class="image-wrapper">
              <img :src="image.url" :alt="image.filename" />
              <div class="image-overlay">
                <div class="image-actions">
                  <el-tooltip content="复制Markdown链接" placement="top">
                    <el-button circle size="small" @click="copyMarkdownLink(image)">
                      <el-icon><Document /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="复制图片链接" placement="top">
                    <el-button circle size="small" @click="copyImageUrl(image)">
                      <el-icon><Link /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="预览图片" placement="top">
                    <el-button circle size="small" @click="showPreviewImage(image)">
                      <el-icon><ZoomIn /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="编辑信息" placement="top">
                    <el-button circle size="small" @click="editImage(image)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="删除图片" placement="top">
                    <el-button circle size="small" type="danger" @click="confirmDelete(image)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="image-info">
              <div class="image-filename">{{ image.filename }}</div>
              <div class="image-meta">
                <span>{{ formatFileSize(image.size) }}</span>
                <span>{{ formatDate(image.uploadTime) }}</span>
              </div>
              <div class="image-tags" v-if="image.tags && image.tags.length">
                <el-tag v-for="tag in image.tags" :key="tag" size="small">{{ tag }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 瀑布流视图 -->
      <template v-else-if="viewMode === 'masonry'">
        <div class="masonry-layout">
          <div 
            v-for="image in currentImages" 
            :key="image.id" 
            class="masonry-item"
          >
            <div class="image-wrapper">
              <img :src="image.url" :alt="image.filename" />
              <div class="image-overlay">
                <div class="image-actions">
                  <el-tooltip content="复制Markdown链接" placement="top">
                    <el-button circle size="small" @click="copyMarkdownLink(image)">
                      <el-icon><Document /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="复制图片链接" placement="top">
                    <el-button circle size="small" @click="copyImageUrl(image)">
                      <el-icon><Link /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="预览图片" placement="top">
                    <el-button circle size="small" @click="showPreviewImage(image)">
                      <el-icon><ZoomIn /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="编辑信息" placement="top">
                    <el-button circle size="small" @click="editImage(image)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="删除图片" placement="top">
                    <el-button circle size="small" type="danger" @click="confirmDelete(image)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="image-info">
              <div class="image-filename">{{ image.filename }}</div>
              <div class="image-meta">
                <span>{{ formatFileSize(image.size) }}</span>
                <span>{{ formatDate(image.uploadTime) }}</span>
              </div>
              <div class="image-tags" v-if="image.tags && image.tags.length">
                <el-tag v-for="tag in image.tags" :key="tag" size="small">{{ tag }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 列表视图 -->
      <template v-else>
        <el-table
          :data="currentImages"
          style="width: 100%"
          :row-class-name="tableRowClassName"
        >
          <el-table-column label="预览" width="120">
            <template #default="scope">
              <div class="table-image-preview" @click="showPreviewImage(scope.row)">
                <img :src="scope.row.url" :alt="scope.row.filename" />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="filename" label="文件名" sortable />
          <el-table-column label="大小" width="120" sortable>
            <template #default="scope">
              {{ formatFileSize(scope.row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="尺寸" width="120">
            <template #default="scope">
              {{ scope.row.width }}×{{ scope.row.height }}
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="180" sortable>
            <template #default="scope">
              {{ formatDate(scope.row.uploadTime) }}
            </template>
          </el-table-column>
          <el-table-column label="IP地址" width="140">
            <template #default="scope">
              {{ scope.row.ipAddress || '未记录' }}
            </template>
          </el-table-column>
          <el-table-column label="标签" width="200">
            <template #default="scope">
              <el-tag 
                v-for="tag in scope.row.tags" 
                :key="tag" 
                size="small" 
                class="mr-1"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="scope">
              <el-button-group>
                <el-tooltip content="复制Markdown链接" placement="top">
                  <el-button size="small" @click="copyMarkdownLink(scope.row)">
                    <el-icon><Document /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="复制图片链接" placement="top">
                  <el-button size="small" @click="copyImageUrl(scope.row)">
                    <el-icon><Link /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="编辑信息" placement="top">
                  <el-button size="small" @click="editImage(scope.row)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除图片" placement="top">
                  <el-button size="small" type="danger" @click="confirmDelete(scope.row)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>
    
    <!-- 分页控件 -->
    <div class="gallery-footer">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="totalImages"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      destroy-on-close
      fullscreen
      custom-class="image-preview-modal"
      :show-close="false"
    >
      <div class="preview-header">
        <div class="preview-filename">{{ previewImage.filename }}</div>
        <div class="preview-controls">
          <el-button circle @click="closePreview">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="preview-content" @wheel.prevent="handleWheel">
        <div class="preview-toolbar">
          <el-button-group>
            <el-button @click="rotateLeft" tooltip="向左旋转">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
            <el-button @click="rotateRight" tooltip="向右旋转">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
            <el-button @click="zoomIn" tooltip="放大">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button @click="zoomOut" tooltip="缩小">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button @click="resetPreview" tooltip="适应屏幕">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        
        <div class="preview-image-container">
          <img 
            :src="previewImage.url" 
            :alt="previewImage.filename"
            :style="{
              transform: `rotate(${rotation}deg) scale(${zoom}) translate(${translateX}px, ${translateY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
          />
        </div>
        
        <div class="preview-sidebar">
          <div class="preview-section">
            <div class="section-title">图片信息</div>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ previewImage.width }}×{{ previewImage.height }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">大小</span>
                <span class="info-value">{{ formatFileSize(previewImage.size) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">上传时间</span>
                <span class="info-value">{{ formatDate(previewImage.uploadTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">IP地址</span>
                <span class="info-value">{{ previewImage.ipAddress || '未记录' }}</span>
              </div>
            </div>
          </div>
          
          <div class="preview-section">
            <div class="section-title">标签</div>
            <div class="tags-container">
              <el-tag 
                v-for="tag in previewImage.tags" 
                :key="tag" 
                class="mr-1 mb-1" 
                size="small"
                effect="light"
              >
                {{ tag }}
              </el-tag>
              <el-button v-if="previewImage.tags?.length === 0" size="small" plain>
                <el-icon><Plus /></el-icon> 添加标签
              </el-button>
            </div>
          </div>
          
          <div class="preview-section">
            <div class="section-title">链接</div>
            <div class="preview-links">
              <el-button 
                type="primary" 
                size="large" 
                class="preview-link-btn"
                @click="copyMarkdownLink(previewImage)"
              >
                <el-icon><Document /></el-icon>
                复制Markdown链接
              </el-button>
              
              <el-button 
                size="large" 
                class="preview-link-btn"
                @click="copyImageUrl(previewImage)"
              >
                <el-icon><Link /></el-icon>
                复制图片链接
              </el-button>
              
              <el-button 
                size="large" 
                class="preview-link-btn"
                @click="copyHTMLLink(previewImage)"
              >
                <el-icon><Document /></el-icon>
                复制HTML链接
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 编辑图片信息对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑图片信息"
      width="500px"
    >
      <el-form :model="currentEditImage" label-position="top">
        <el-form-item label="文件名">
          <el-input v-model="currentEditImage.filename" placeholder="输入文件名"></el-input>
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select
            v-model="currentEditImage.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加或选择标签"
            class="w-100"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="IP地址" v-if="currentEditImage.ipAddress">
          <el-input v-model="currentEditImage.ipAddress" readonly></el-input>
          <div class="form-tip">IP地址不可编辑</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveImageEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除确认"
      width="400px"
    >
      <div class="delete-confirmation">
        <p>确定要删除图片 "{{ currentDeleteImage?.filename }}" 吗？</p>
        <p class="delete-warning">此操作不可撤销，图片将从存储中永久删除。</p>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteImage">确认删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'HomePage',
  setup() {
    const store = useStore()
    const router = useRouter()

    // 视图状态
    const viewMode = ref(store.state.settings.defaultView || 'grid')
    const loading = computed(() => store.state.loading)
    
    // 搜索和筛选
    const searchKeyword = ref('')
    const dateRange = ref(null)
    const selectedTags = ref([])
    const availableTags = computed(() => {
      const tagSet = new Set()
      store.state.images.forEach(img => {
        if (img.tags) {
          img.tags.forEach(tag => tagSet.add(tag))
        }
      })
      return Array.from(tagSet)
    })
    
    // 分页
    const currentPage = ref(store.state.pagination.currentPage)
    const pageSize = ref(store.state.pagination.pageSize)
    
    // 排序
    const sortOption = ref(`${store.state.settings.sortBy}:${store.state.settings.sortDirection}`)
    
    // 预览相关状态
    const previewVisible = ref(false);
    const previewImage = ref({});
    const rotation = ref(0);
    const zoom = ref(1);
    
    // 在预览控制部分添加拖动相关函数
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let translateX = ref(0);
    let translateY = ref(0);

    const startDrag = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      
      translateX.value += deltaX;
      translateY.value += deltaY;
      
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const stopDrag = () => {
      isDragging = false;
    };

    // 获取排序标签文本
    const getSortLabel = () => {
      switch (sortOption.value) {
        case 'uploadTime:desc':
          return '最新上传';
        case 'uploadTime:asc':
          return '最早上传';
        case 'filename:asc':
          return '文件名A-Z';
        case 'filename:desc':
          return '文件名Z-A';
        case 'size:asc':
          return '文件大小↑';
        case 'size:desc':
          return '文件大小↓';
        default:
          return '排序方式';
      }
    }
    
    // 设置排序选项
    const setSortOption = (option) => {
      sortOption.value = option;
      handleSortChange();
    }
    
    // 处理排序变化
    const handleSortChange = () => {
      const [sortBy, sortDirection] = sortOption.value.split(':');
      store.commit('SET_SETTINGS', { sortBy, sortDirection });
    }
    
    // 编辑对话框
    const editDialogVisible = ref(false)
    const currentEditImage = ref(null)
    
    // 删除对话框
    const deleteDialogVisible = ref(false)
    const currentDeleteImage = ref(null)
    
    // 计算属性
    const totalImages = computed(() => store.getters.filteredImages.length)
    const currentImages = computed(() => store.getters.currentPageImages)
    const totalPages = computed(() => store.getters.totalPages)
    
    const hasActiveFilters = computed(() => {
      return (dateRange.value !== null && dateRange.value.length > 0) || 
             (selectedTags.value !== null && selectedTags.value.length > 0);
    });

    const filterCount = computed(() => {
      let count = 0;
      if (dateRange.value !== null && dateRange.value.length > 0) count++;
      if (selectedTags.value !== null && selectedTags.value.length > 0) count += selectedTags.value.length;
      return count > 0 ? count : null;
    });
    
    // 方法
    const handleSearch = () => {
      store.commit('SET_FILTERS', { keyword: searchKeyword.value })
      currentPage.value = 1
    }
    
    const handleFilterChange = () => {
      store.commit('SET_FILTERS', { 
        dateRange: dateRange.value,
        tags: selectedTags.value
      })
      currentPage.value = 1
    }
    
    const clearFilters = () => {
      searchKeyword.value = ''
      dateRange.value = null
      selectedTags.value = []
      store.commit('CLEAR_FILTERS')
    }
    
    const handlePageChange = (page) => {
      currentPage.value = page
      store.commit('SET_PAGINATION', { currentPage: page })
    }
    
    const formatFileSize = (size) => {
      if (!size) return '0 Bytes'
      const units = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(size) / Math.log(1024))
      return Math.round(size / Math.pow(1024, i), 2) + ' ' + units[i]
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString()
    }
    
    const copyMarkdownLink = (image) => {
      const format = store.state.settings.markdownFormat
      const link = format
        .replace('{filename}', image.filename)
        .replace('{url}', image.url)
      
      navigator.clipboard.writeText(link).then(() => {
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
    
    const editImage = (image) => {
      currentEditImage.value = JSON.parse(JSON.stringify(image))
      editDialogVisible.value = true
    }
    
    const saveImageEdit = async () => {
      try {
        await store.dispatch('updateImage', currentEditImage.value)
        ElMessage.success('保存成功')
        editDialogVisible.value = false
      } catch (error) {
        ElMessage.error('保存失败')
      }
    }
    
    const confirmDelete = (image) => {
      currentDeleteImage.value = image
      deleteDialogVisible.value = true
    }
    
    const deleteImage = async () => {
      try {
        await store.dispatch('deleteImage', currentDeleteImage.value.id)
        ElMessage.success('删除成功')
        deleteDialogVisible.value = false
      } catch (error) {
        ElMessage.error('删除失败')
      }
    }
    
    const goToUpload = () => {
      router.push({ name: 'upload' })
    }
    
    // 预览控制
    const rotateLeft = () => {
      rotation.value -= 90;
    }

    const rotateRight = () => {
      rotation.value += 90;
    }

    const zoomIn = () => {
      zoom.value = Math.min(zoom.value + 0.1, 3);
    }

    const zoomOut = () => {
      zoom.value = Math.max(zoom.value - 0.1, 0.5);
    }

    const resetPreview = () => {
      rotation.value = 0;
      zoom.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }

    const showPreviewImage = (image) => {
      previewImage.value = image;
      previewVisible.value = true;
      rotation.value = 0;
      zoom.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }

    const closePreview = () => {
      previewVisible.value = false;
    }

    const copyHTMLLink = (image) => {
      navigator.clipboard.writeText(`<img src="${image.url}" alt="${image.filename}" />`).then(() => {
        ElMessage.success('HTML链接已复制到剪贴板');
      }).catch(err => {
        console.error('复制失败:', err);
        ElMessage.error('复制失败');
      });
    }

    const handleWheel = (e) => {
      if (e.deltaY < 0) {
        zoom.value = Math.min(zoom.value + 0.1, 3);
      } else {
        zoom.value = Math.max(zoom.value - 0.1, 0.5);
      }
    }

    const handleSizeChange = (size) => {
      pageSize.value = size;
      store.commit('SET_PAGINATION', { pageSize: size });
    }

    const handleCurrentChange = (page) => {
      currentPage.value = page;
      store.commit('SET_PAGINATION', { currentPage: page });
    }

    const tableRowClassName = () => {
      return 'table-row';
    }

    // 计算属性
    const isEmpty = computed(() => store.getters.filteredImages.length === 0);
    
    // 组件挂载时从存储加载数据
    onMounted(() => {
      // 加载模拟数据
      store.dispatch('fetchImages')
      
      // 从本地存储恢复视图设置
      if (localStorage.getItem('viewMode')) {
        viewMode.value = localStorage.getItem('viewMode')
      }
    })
    
    // 监听视图模式变化，保存到本地存储
    watch(viewMode, (newValue) => {
      localStorage.setItem('viewMode', newValue)
    })
    
    // 监听分页变化，更新store
    watch(currentPage, (newValue) => {
      store.commit('SET_PAGINATION', { currentPage: newValue })
    })
    
    return {
      viewMode,
      loading,
      searchKeyword,
      dateRange,
      selectedTags,
      availableTags,
      currentPage,
      pageSize,
      sortOption,
      editDialogVisible,
      currentEditImage,
      deleteDialogVisible,
      currentDeleteImage,
      totalImages,
      currentImages,
      totalPages,
      handleSearch,
      handleFilterChange,
      clearFilters,
      handleSortChange,
      handlePageChange,
      formatFileSize,
      formatDate,
      copyMarkdownLink,
      copyImageUrl,
      editImage,
      saveImageEdit,
      confirmDelete,
      deleteImage,
      goToUpload,
      getSortLabel,
      setSortOption,
      // 预览相关
      previewVisible,
      previewImage,
      rotation,
      zoom,
      rotateLeft,
      rotateRight,
      zoomIn,
      zoomOut,
      resetPreview,
      showPreviewImage,
      closePreview,
      copyHTMLLink,
      handleWheel,
      handleSizeChange,
      handleCurrentChange,
      tableRowClassName,
      isEmpty,
      hasActiveFilters,
      filterCount,
      translateX,
      translateY,
      startDrag,
      onDrag,
      stopDrag,
    }
  }
}
</script>

<style scoped>
.gallery-container {
  padding: 24px;
  background-color: var(--bg-color, #fff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 20px;
  align-items: center;
}

.header-title {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 8px 0;
}

.text-secondary {
  color: var(--text-secondary, #6b7280);
  font-size: 14px;
  margin: 0;
}

/* 搜索框样式 */
.search-box {
  width: 280px;
  transition: width 0.3s ease;
}

.search-box:focus-within {
  width: 320px;
}

.search-input {
  border-radius: 10px;
  transition: all 0.3s ease;
}

.search-input:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input:focus-within {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.search-icon {
  color: var(--text-secondary, #6b7280);
}

/* 操作按钮组 */
.action-btn-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 按钮基础样式 */
.action-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-light, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  color: var(--text-primary, #1f2937);
}

.action-btn:hover {
  background-color: var(--bg-hover, #f3f4f6);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.action-btn:active {
  transform: translateY(0px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-btn.is-active {
  background-color: var(--primary-light, #eff6ff);
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

/* 筛选按钮特定样式 */
.filter-btn {
  position: relative;
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
}

/* 排序按钮特定样式 */
.sort-btn {
  min-width: 140px;
  justify-content: space-between;
}

.dropdown-arrow {
  font-size: 12px;
  margin-left: auto;
}

/* 视图切换按钮 */
.view-switcher {
  display: flex;
  gap: 4px;
  background-color: var(--bg-light, #f9fafb);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.view-btn {
  border: none;
  background: transparent;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--text-secondary, #6b7280);
  transition: all 0.2s ease;
}

.view-btn:hover {
  color: var(--text-primary, #1f2937);
  background-color: rgba(0, 0, 0, 0.03);
}

.view-btn.is-active {
  background-color: #fff;
  color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

/* 筛选内容样式 */
.filter-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.filter-popover {
  max-width: 100%;
  margin: 0 !important;
}

.filter-section {
  margin-bottom: 24px;
}

.section-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--text-primary, #1f2937);
  font-size: 15px;
}

.date-picker-full,
.tag-select-full {
  width: 100% !important;
  max-width: 100%;
  display: block;
}

.el-date-editor.el-input__wrapper,
.el-select__wrapper {
  width: 100% !important;
  box-sizing: border-box;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.filter-actions .el-button {
  padding: 10px 20px;
  font-size: 14px;
}

/* 动画过渡 */
.el-dropdown-menu,
.el-popover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
  border-radius: 12px !important;
}

/* 图片网格布局优化 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.image-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(0);
}

.image-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.image-wrapper {
  position: relative;
  overflow: hidden;
  padding-top: 75%;
  background-color: #f5f7fa;
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.image-card:hover .image-wrapper img {
  transform: scale(1.08);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.image-filename {
  font-weight: 500;
  color: var(--heading-color);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  color: var(--text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.image-tags {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 瀑布流样式 */
.masonry-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-gap: 16px;
  grid-auto-flow: dense;
}

.masonry-item {
  margin-bottom: 16px;
  break-inside: avoid;
  background-color: var(--bg-color, #fff);
  border-radius: var(--border-radius-md, 8px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.masonry-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* 列表视图样式 */
.table-image-preview {
  width: 80px;
  height: 60px;
  border-radius: var(--border-radius-base);
  overflow: hidden;
  cursor: pointer;
}

.table-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 分页区域 */
.gallery-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 图片预览对话框样式 */
.image-preview-modal {
  background-color: rgba(0, 0, 0, 0.9);
}

.preview-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 10;
}

.preview-filename {
  color: white;
  font-weight: 500;
  font-size: 16px;
}

.preview-content {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 8px;
}

.preview-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: calc(100% - 320px);
}

.preview-image-container img {
  max-height: 80vh;
  max-width: 100%;
  object-fit: contain;
}

.preview-sidebar {
  position: fixed;
  top: 60px;
  right: 0;
  width: 320px;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 24px;
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section .section-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: white;
}

.info-list {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-label {
  font-weight: 500;
}

.info-value {
  color: var(--text-color-secondary);
}

.tags-container {
  margin-bottom: 16px;
}

.link-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
}

.link-button {
  width: 100%;
  height: 46px;
  padding: 0 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.button-icon {
  font-size: 18px;
  margin-right: 8px;
  flex-shrink: 0;
}

.button-text {
  font-size: 14px;
  font-weight: 500;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
}

.empty-illustration {
  max-width: 240px;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-desc {
  color: var(--text-secondary);
  max-width: 320px;
  margin-bottom: 24px;
}

.action-button {
  padding: 12px 24px;
  font-size: 16px;
}

/* 内容区域 */
.gallery-content {
  flex: 1;
  min-height: 400px;
}

.delete-confirmation {
  padding: 16px;
  text-align: center;
}

.delete-warning {
  color: var(--danger-color, #ef4444);
  font-size: 14px;
  margin-top: 8px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.preview-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.preview-link-btn {
  width: 100%;
  justify-content: center;
}

.preview-link-btn .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .header-right {
    flex-wrap: wrap;
  }
  
  .action-btn-group {
    flex-wrap: wrap;
  }
  
  .search-box {
    width: 100%;
    margin-bottom: 12px;
  }
}
</style> 