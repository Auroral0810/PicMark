<template>
  <div class="folder-tags-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">文件夹与标签</h1>
        <p class="text-secondary">组织和管理您的图片集合</p>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="showCreateFolderDialog">
          <el-icon><FolderAdd /></el-icon>
          创建文件夹
        </el-button>
        <el-button type="success" @click="showCreateTagDialog">
          <el-icon><Plus /></el-icon>
          创建标签
        </el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 文件夹管理 -->
      <el-tab-pane label="文件夹" name="folders">
        <div class="folders-container">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><Folders /></el-icon>
              我的文件夹
            </h2>
            <p class="section-subtitle">为您的图片创建分类文件夹</p>
          </div>
          
          <el-row :gutter="24" class="folders-grid">
            <!-- 文件夹卡片 -->
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="folder in folders" :key="folder.id">
              <el-card shadow="hover" class="folder-card">
                <div class="folder-cover" :style="getFolderCoverStyle(folder)">
                  <div v-if="!folder.coverUrl" class="folder-icon" :style="{backgroundColor: folder.color}">
                    <el-icon><Folder /></el-icon>
                  </div>
                </div>
                <div class="folder-info">
                  <h3 class="folder-name">{{ folder.name }}</h3>
                  <p class="folder-count">{{ folder.imageCount }}张图片</p>
                </div>
                <div class="folder-actions">
                  <el-tooltip content="查看图片" placement="top">
                    <el-button circle @click="viewFolderImages(folder)">
                      <el-icon><View /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="编辑文件夹" placement="top">
                    <el-button circle @click="editFolder(folder)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="删除文件夹" placement="top">
                    <el-button circle type="danger" @click="confirmDeleteFolder(folder)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </el-card>
            </el-col>
            
            <!-- 空状态 -->
            <el-col :span="24" v-if="folders.length === 0">
              <div class="empty-state">
                <el-icon class="empty-icon"><Folder /></el-icon>
                <h3>还没有创建文件夹</h3>
                <p>点击"创建文件夹"按钮来组织您的图片</p>
                <el-button type="primary" @click="showCreateFolderDialog">
                  创建第一个文件夹
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      
      <!-- 标签管理 -->
      <el-tab-pane label="标签" name="tags">
        <div class="tags-container">
          <div class="section-header">
            <h2 class="section-title">
              <el-icon><PriceTag /></el-icon>
              我的标签
            </h2>
            <p class="section-subtitle">使用标签对图片进行关键词标注</p>
          </div>
          
          <!-- 标签搜索 -->
          <div class="tags-search">
            <el-input
              v-model="tagSearchKeyword"
              placeholder="搜索标签..."
              clearable
              prefix-icon="Search"
            />
          </div>
          
          <!-- 标签列表 -->
          <div class="tags-list" v-if="filteredTags.length > 0">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="tag in filteredTags" :key="tag.id">
                <div class="tag-item">
                  <el-tag
                    class="tag-content"
                    :type="tag.type || ''"
                    :effect="tag.effect || 'light'"
                    size="large"
                  >
                    {{ tag.name }} ({{ tag.count || 0 }})
                  </el-tag>
                  <div class="tag-actions">
                    <el-tooltip content="查找图片" placement="top">
                      <el-button size="small" circle @click="viewTaggedImages(tag)">
                        <el-icon><Search /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑标签" placement="top">
                      <el-button size="small" circle @click="editTag(tag)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除标签" placement="top">
                      <el-button size="small" circle type="danger" @click="confirmDeleteTag(tag)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <!-- 空状态 -->
          <div class="empty-state" v-else>
            <el-icon class="empty-icon"><PriceTag /></el-icon>
            <h3>还没有创建标签</h3>
            <p>点击"创建标签"按钮为您的图片添加标签</p>
            <el-button type="primary" @click="showCreateTagDialog">
              创建第一个标签
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 创建/编辑文件夹对话框 -->
    <el-dialog
      v-model="folderDialogVisible"
      :title="isEditingFolder ? '编辑文件夹' : '创建文件夹'"
      width="500px"
    >
      <el-form :model="folderForm" label-position="top" :rules="folderRules" ref="folderFormRef">
        <el-form-item label="文件夹名称" prop="name">
          <el-input v-model="folderForm.name" placeholder="输入文件夹名称" />
        </el-form-item>
        <el-form-item label="文件夹颜色">
          <el-color-picker v-model="folderForm.color" show-alpha />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="folderForm.description"
            type="textarea"
            rows="3"
            placeholder="文件夹描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="folderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFolder" :loading="isSavingFolder">
            {{ isEditingFolder ? '保存' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      :title="isEditingTag ? '编辑标签' : '创建标签'"
      width="500px"
    >
      <el-form :model="tagForm" label-position="top" :rules="tagRules" ref="tagFormRef">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="输入标签名称" />
        </el-form-item>
        <el-form-item label="标签类型">
          <el-select v-model="tagForm.type" placeholder="选择标签类型" class="w-100">
            <el-option label="默认" value="" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签样式">
          <el-radio-group v-model="tagForm.effect">
            <el-radio label="light">浅色</el-radio>
            <el-radio label="dark">深色</el-radio>
            <el-radio label="plain">朴素</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tagDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTag" :loading="isSavingTag">
            {{ isEditingTag ? '保存' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      :title="isFolder ? '删除文件夹' : '删除标签'"
      width="400px"
    >
      <div class="delete-warning">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p v-if="isFolder">
          确定要删除文件夹 <strong>{{ currentItem?.name }}</strong> 吗？<br>
          <span class="warning-note">文件夹中的图片不会被删除，但会失去分类。</span>
        </p>
        <p v-else>
          确定要删除标签 <strong>{{ currentItem?.name }}</strong> 吗？<br>
          <span class="warning-note">此标签将从所有使用它的图片中移除。</span>
        </p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="isDeleting">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

export default {
  name: 'FolderTagsPage',
  setup() {
    const router = useRouter()
    const store = useStore()
    const activeTab = ref('folders')
    
    // 文件夹相关状态
    const folders = ref([])
    
    // 标签相关状态
    const tags = ref([])
    
    // 标签搜索
    const tagSearchKeyword = ref('')
    const filteredTags = computed(() => {
      if (!tagSearchKeyword.value) return tags.value
      
      const keyword = tagSearchKeyword.value.toLowerCase()
      return tags.value.filter(tag => 
        tag.name.toLowerCase().includes(keyword)
      )
    })
    
    // 文件夹对话框
    const folderDialogVisible = ref(false)
    const folderFormRef = ref(null)
    const isEditingFolder = ref(false)
    const isSavingFolder = ref(false)
    const folderForm = reactive({
      id: null,
      name: '',
      color: '#409EFF',
      description: ''
    })
    
    const folderRules = {
      name: [
        { required: true, message: '请输入文件夹名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    }
    
    // 标签对话框
    const tagDialogVisible = ref(false)
    const tagFormRef = ref(null)
    const isEditingTag = ref(false)
    const isSavingTag = ref(false)
    const tagForm = reactive({
      id: null,
      name: '',
      type: '',
      effect: 'light'
    })
    
    const tagRules = {
      name: [
        { required: true, message: '请输入标签名称', trigger: 'blur' },
        { min: 1, max: 15, message: '长度在 1 到 15 个字符之间', trigger: 'blur' }
      ]
    }
    
    // 删除对话框
    const deleteDialogVisible = ref(false)
    const isFolder = ref(true)
    const currentItem = ref(null)
    const isDeleting = ref(false)
    
    // 显示创建文件夹对话框
    const showCreateFolderDialog = () => {
      isEditingFolder.value = false
      folderForm.id = null
      folderForm.name = ''
      folderForm.color = '#409EFF'
      folderForm.description = ''
      folderDialogVisible.value = true
    }
    
    // 编辑文件夹
    const editFolder = (folder) => {
      isEditingFolder.value = true
      folderForm.id = folder.id
      folderForm.name = folder.name
      folderForm.color = folder.color
      folderForm.description = folder.description || ''
      folderDialogVisible.value = true
    }
    
    // 保存文件夹
    const saveFolder = async () => {
      if (!folderFormRef.value) return
      
      try {
        await folderFormRef.value.validate()
        
        isSavingFolder.value = true
        
        if (isEditingFolder.value) {
          // 更新现有文件夹
          await store.dispatch('updateFolder', {
            id: folderForm.id,
            name: folderForm.name,
            color: folderForm.color,
            description: folderForm.description
          })
          
          ElMessage.success('文件夹已更新')
        } else {
          // 创建新文件夹
          await store.dispatch('createFolder', {
            name: folderForm.name,
            color: folderForm.color,
            description: folderForm.description
          })
          
          ElMessage.success('文件夹已创建')
        }
        
        // 重新获取文件夹列表
        await fetchFolders()
        folderDialogVisible.value = false
      } catch (error) {
        console.error('Folder validation error:', error)
        ElMessage.error('文件夹保存失败')
      } finally {
        isSavingFolder.value = false
      }
    }
    
    // 显示创建标签对话框
    const showCreateTagDialog = () => {
      isEditingTag.value = false
      tagForm.id = null
      tagForm.name = ''
      tagForm.type = ''
      tagForm.effect = 'light'
      tagDialogVisible.value = true
    }
    
    // 编辑标签
    const editTag = (tag) => {
      isEditingTag.value = true
      tagForm.id = tag.id
      tagForm.name = tag.name
      tagForm.type = tag.type || ''
      tagForm.effect = tag.effect || 'light'
      tagDialogVisible.value = true
    }
    
    // 保存标签
    const saveTag = async () => {
      if (!tagFormRef.value) return
      
      try {
        await tagFormRef.value.validate()
        
        isSavingTag.value = true
        
        if (isEditingTag.value) {
          // 更新现有标签
          await store.dispatch('updateTag', {
            oldName: currentItem.value.name,
            newName: tagForm.name
          })
          
          ElMessage.success('标签已更新')
        } else {
          // 创建新标签
          await store.dispatch('createTag', { name: tagForm.name })
          
          ElMessage.success('标签已创建')
        }
        
        // 强制刷新标签列表
        setTimeout(async () => {
          await store.dispatch('fetchTags', { forceRefresh: true })
          await fetchTags()
        }, 500) // 延迟半秒，确保后端处理完成
        
        tagDialogVisible.value = false
      } catch (error) {
        console.error('Tag validation error:', error)
        ElMessage.error('标签保存失败')
      } finally {
        isSavingTag.value = false
      }
    }
    
    // 确认删除文件夹
    const confirmDeleteFolder = (folder) => {
      isFolder.value = true
      currentItem.value = folder
      deleteDialogVisible.value = true
    }
    
    // 确认删除标签
    const confirmDeleteTag = (tag) => {
      isFolder.value = false
      currentItem.value = tag
      deleteDialogVisible.value = true
    }
    
    // 确认删除操作
    const confirmDelete = async () => {
      if (!currentItem.value) return
      
      isDeleting.value = true
      
      try {
        if (isFolder.value) {
          // 删除文件夹
          await store.dispatch('deleteFolder', currentItem.value.id)
          ElMessage.success(`文件夹 "${currentItem.value.name}" 已删除`)
          await fetchFolders() // 刷新文件夹列表
        } else {
          // 删除标签
          await store.dispatch('deleteTag', currentItem.value.name)
          ElMessage.success(`标签 "${currentItem.value.name}" 已删除`)
          await fetchTags() // 刷新标签列表
        }
        
        deleteDialogVisible.value = false
        currentItem.value = null
      } catch (error) {
        console.error('Delete error:', error)
        ElMessage.error('删除失败，请重试')
      } finally {
        isDeleting.value = false
      }
    }
    
    // 查看文件夹中的图片
    const viewFolderImages = (folder) => {
      // 先设置筛选条件
      store.commit('CLEAR_FILTERS');
      store.commit('SET_FILTERS', { folderId: folder.id });
      
      // 重置分页
      store.commit('SET_PAGINATION', { currentPage: 1 });
      
      // 主动触发数据加载
      store.dispatch('fetchImages', { forceRefresh: true }).then(() => {
        // 成功加载数据后再跳转
        router.push({
          name: 'home',
          query: { folder: folder.id }
        });
        
        ElMessage.success(`正在查看文件夹: ${folder.name}`);
      }).catch(error => {
        console.error('加载图片失败:', error);
        ElMessage.error('加载图片失败，请重试');
      });
    }
    
    // 查看使用标签的图片
    const viewTaggedImages = (tag) => {
      // 先设置筛选条件
      store.commit('CLEAR_FILTERS');
      store.commit('SET_FILTERS', { tags: [tag.name] });
      
      // 重置分页
      store.commit('SET_PAGINATION', { currentPage: 1 });
      
      // 主动触发数据加载
      store.dispatch('fetchImages', { forceRefresh: true }).then(() => {
        // 成功加载数据后再跳转
        router.push({
          name: 'home',
          query: { tag: tag.name }
        });
        
        ElMessage.success(`正在查看标签: ${tag.name}`);
      }).catch(error => {
        console.error('加载图片失败:', error);
        ElMessage.error('加载图片失败，请重试');
      });
    }
    
    // 获取文件夹列表
    const fetchFolders = async () => {
      try {
        const foldersList = await store.dispatch('fetchFolders')
        folders.value = foldersList || []
        console.log('获取到文件夹列表:', folders.value)
      } catch (error) {
        console.error('获取文件夹列表失败:', error)
        ElMessage.error('获取文件夹列表失败')
      }
    }
    
    // 获取标签列表
    const fetchTags = async () => {
      try {
        const tagsList = await store.dispatch('fetchTags')
        tags.value = tagsList || []
        console.log('获取到标签列表:', tags.value)
      } catch (error) {
        console.error('获取标签列表失败:', error)
        ElMessage.error('获取标签列表失败')
      }
    }
    
    // 获取文件夹封面样式
    const getFolderCoverStyle = (folder) => {
      if (folder.coverUrl) {
        return {
          backgroundImage: `url(${folder.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '120px',
          borderRadius: '8px 8px 0 0'
        }
      }
      return {}
    }
    
    // 组件挂载时加载数据
    onMounted(async () => {
      try {
        // 先获取图片列表，这样才能为文件夹设置封面
        await store.dispatch('fetchImages');
        
        // 然后获取文件夹和标签数据
        await Promise.all([
          fetchFolders(),
          fetchTags()
        ]);
      } catch (error) {
        console.error('加载数据失败:', error);
        ElMessage.error('加载数据失败，请刷新页面重试');
      }
    })
    
    return {
      activeTab,
      folders,
      tags,
      tagSearchKeyword,
      filteredTags,
      folderDialogVisible,
      folderFormRef,
      isEditingFolder,
      isSavingFolder,
      folderForm,
      folderRules,
      tagDialogVisible,
      tagFormRef,
      isEditingTag,
      isSavingTag,
      tagForm,
      tagRules,
      deleteDialogVisible,
      isFolder,
      currentItem,
      isDeleting,
      showCreateFolderDialog,
      editFolder,
      saveFolder,
      showCreateTagDialog,
      editTag,
      saveTag,
      confirmDeleteFolder,
      confirmDeleteTag,
      confirmDelete,
      viewFolderImages,
      viewTaggedImages,
      getFolderCoverStyle
    }
  }
}
</script>

<style scoped>
.folder-tags-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.text-secondary {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.main-tabs {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.section-title .el-icon {
  margin-right: 8px;
  font-size: 22px;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.folders-grid {
  margin-bottom: 24px;
}

.folder-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.folder-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.folder-cover {
  height: 120px;
  position: relative;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  background-color: #f5f7fa;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-cover[style*="background-image"] {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.folder-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30px auto;
  font-size: 24px;
  color: white;
}

.folder-info {
  margin-bottom: 16px;
}

.folder-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.folder-count {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.folder-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.tags-search {
  margin-bottom: 24px;
}

.tags-list {
  margin-bottom: 24px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-light);
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.tag-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.tag-content {
  font-size: 14px;
  padding: 6px 12px;
}

.tag-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.delete-warning {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.warning-icon {
  font-size: 24px;
  color: var(--error-color);
}

.warning-note {
  font-size: 14px;
  color: var(--text-secondary);
}

.w-100 {
  width: 100%;
}

/* 深色模式适配 */
[data-theme="dark"] .folder-card {
  background-color: var(--bg-dark);
}

[data-theme="dark"] .tag-item {
  background-color: var(--bg-dark);
}
</style> 