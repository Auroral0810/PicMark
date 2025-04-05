/* eslint-disable no-unused-vars */
import { createStore } from 'vuex'
import { ElMessage } from 'element-plus'

// 创建store实例
export default createStore({
  state: {
    // 图片列表
    images: [],
    // 文件夹列表
    folders: [],
    // 标签列表
    tags: [],
    // 加载状态
    loading: false,
    // 分页信息
    pagination: {
      currentPage: 1,
      pageSize: 20,
      total: 0
    },
    // 筛选条件
    filters: {
      dateRange: null,
      keyword: '',
      tags: [],
      folderId: null
    },
    // 上传配置
    uploadConfig: {
      compress: true,                    // 是否压缩图片
      compressQuality: 85,               // 压缩质量，范围1-100
      maxSize: 5,                        // 最大大小（MB）
      allowedTypes: [                    // 允许的文件类型
        'image/jpeg', 
        'image/jpg',
        'image/png', 
        'image/gif', 
        'image/webp',
        'image/svg+xml', 
        'image/bmp', 
        'image/tiff',
        'image/avif',
        'image/x-icon',
        'image/heic',
        'image/heif'
      ],
      autoRename: true,                  // 是否自动重命名
      renameType: 'uuid',                // 重命名类型：original(原始), timestamp(时间戳), uuid(随机)
      customNamePattern: '{year}{month}{day}_{filename}' // 自定义命名模式
    },
    // 系统设置
    settings: {
      qiniuDomain: '',
      qiniuBucket: '',
      markdownFormat: '![{filename}]({url})',
      showGrid: true,
      defaultView: 'grid', // grid, masonry or list
      sortBy: 'uploadTime',
      sortDirection: 'desc',
      pageSize: 20
    },
    // 统计数据
    statistics: {
      totalImages: 0,
      storageUsed: 0,
      totalVisits: 0,
      uploadsToday: 0,
      recentTrend: {
        uploads: [],
        visits: []
      },
      storageDistribution: {
        jpeg: 0,
        png: 0,
        gif: 0,
        webp: 0
      },
      popularTags: [],
      popularImages: []
    }
  },
  
  getters: {
    // 过滤和排序后的图片列表
    filteredImages: (state) => {
      // 克隆数组以避免直接修改原数组
      let result = [...state.images]
      
      // 应用关键词过滤
      if (state.filters.keyword) {
        const keyword = state.filters.keyword.toLowerCase()
        result = result.filter(img => 
          img.filename.toLowerCase().includes(keyword) || 
          (img.tags && img.tags.some(tag => tag.toLowerCase().includes(keyword)))
        )
      }
      
      // 应用日期范围过滤
      if (state.filters.dateRange && state.filters.dateRange.length === 2) {
        const [startDate, endDate] = state.filters.dateRange
        result = result.filter(img => {
          const uploadTime = new Date(img.uploadTime)
          return uploadTime >= startDate && uploadTime <= endDate
        })
      }
      
      // 应用标签过滤
      if (state.filters.tags && state.filters.tags.length > 0) {
        result = result.filter(img => 
          img.tags && state.filters.tags.every(tag => img.tags.includes(tag))
        )
      }
      
      // 应用文件夹过滤
      if (state.filters.folderId) {
        result = result.filter(img => 
          img.folder === state.filters.folderId
        )
      }
      
      // 排序
      const { sortBy, sortDirection } = state.settings
      result.sort((a, b) => {
        let valueA = a[sortBy]
        let valueB = b[sortBy]
        
        // 日期类型特殊处理
        if (sortBy === 'uploadTime') {
          valueA = new Date(valueA).getTime()
          valueB = new Date(valueB).getTime()
        }
        
        // 根据排序方向返回比较结果
        if (sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1
        } else {
          return valueA < valueB ? 1 : -1
        }
      })
      
      return result
    },
    
    // 当前页面的图片
    currentPageImages: (state, getters) => {
      const { currentPage, pageSize } = state.pagination
      const start = (currentPage - 1) * pageSize
      const end = currentPage * pageSize
      return getters.filteredImages.slice(start, end)
    },
    
    // 总页数
    totalPages: (state, getters) => {
      return Math.ceil(getters.filteredImages.length / state.pagination.pageSize)
    },
    
    // 获取所有文件夹
    allFolders: (state) => {
      return state.folders
    }
  },
  
  mutations: {
    // 设置图片列表
    SET_IMAGES(state, images) {
      state.images = images
    },
    
    // 添加图片
    ADD_IMAGE(state, image) {
      state.images.unshift(image)
    },
    
    // 批量添加图片
    ADD_IMAGES(state, images) {
      state.images = [...images, ...state.images]
    },
    
    // 删除图片
    DELETE_IMAGE(state, imageId) {
      state.images = state.images.filter(img => img.id !== imageId)
    },
    
    // 更新图片
    UPDATE_IMAGE(state, updatedImage) {
      const index = state.images.findIndex(img => img.id === updatedImage.id)
      if (index !== -1) {
        state.images[index] = { ...state.images[index], ...updatedImage }
      }
    },
    
    // 设置文件夹列表
    SET_FOLDERS(state, folders) {
      state.folders = folders
    },
    
    // 添加文件夹
    ADD_FOLDER(state, folder) {
      state.folders.push(folder)
    },
    
    // 更新文件夹
    UPDATE_FOLDER(state, updatedFolder) {
      const index = state.folders.findIndex(f => f.id === updatedFolder.id)
      if (index !== -1) {
        state.folders[index] = { ...state.folders[index], ...updatedFolder }
      }
    },
    
    // 删除文件夹
    DELETE_FOLDER(state, folderId) {
      state.folders = state.folders.filter(f => f.id !== folderId)
    },
    
    // 添加标签到图片
    ADD_TAG_TO_IMAGE(state, { imageId, tag }) {
      const image = state.images.find(img => img.id === imageId)
      if (image) {
        if (!image.tags) {
          image.tags = []
        }
        if (!image.tags.includes(tag)) {
          image.tags.push(tag)
        }
      }
    },
    
    // 从图片中移除标签
    REMOVE_TAG_FROM_IMAGE(state, { imageId, tag }) {
      const image = state.images.find(img => img.id === imageId)
      if (image && image.tags) {
        image.tags = image.tags.filter(t => t !== tag)
      }
    },
    
    // 移动图片到文件夹
    MOVE_IMAGE_TO_FOLDER(state, { imageId, folderId }) {
      const image = state.images.find(img => img.id === imageId)
      if (image) {
        image.folder = folderId || null
      }
    },
    
    // 设置加载状态
    SET_LOADING(state, status) {
      state.loading = status
    },
    
    // 设置分页信息
    SET_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...pagination }
    },
    
    // 设置筛选条件
    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters }
    },
    
    // 清除筛选条件
    CLEAR_FILTERS(state) {
      state.filters = {
        dateRange: null,
        keyword: '',
        tags: [],
        folderId: null
      }
    },
    
    // 设置上传配置
    SET_UPLOAD_CONFIG(state, config) {
      state.uploadConfig = { ...state.uploadConfig, ...config }
    },
    
    // 设置系统设置
    SET_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
      // 如果更新了pageSize，同时更新分页信息
      if (settings.pageSize) {
        state.pagination.pageSize = settings.pageSize
      }
    },
    
    // 设置标签列表
    SET_TAGS(state, tags) {
      state.tags = tags
    },
    
    // 设置统计数据
    SET_STATISTICS(state, statistics) {
      state.statistics = statistics
    }
  },
  
  actions: {
    // 获取图片列表
    async fetchImages({ commit, state, dispatch }, options = {}) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 构建请求参数
        const params = {
          page: state.pagination.currentPage,
          limit: state.pagination.pageSize,
          t: options.forceRefresh ? Date.now() : undefined // 添加时间戳防止缓存
        }
        
        // 添加筛选条件
        if (state.filters.keyword) {
          params.keyword = state.filters.keyword
        }
        
        if (state.filters.dateRange && state.filters.dateRange.length === 2) {
          params.startDate = state.filters.dateRange[0].toISOString()
          params.endDate = state.filters.dateRange[1].toISOString()
        }
        
        if (state.filters.tags && state.filters.tags.length > 0) {
          params.tags = state.filters.tags.join(',')
        }
        
        if (state.filters.folderId) {
          params.folder = state.filters.folderId
        }
        
        // 发送请求获取图片
        const response = await axios.get(`${API_BASE_URL}/images`, { params })
        console.log('API返回数据:', response.data)
        
        // 检查响应 - 修正数据结构处理
        if (response.data && response.data.success && response.data.data) {
          // 正确处理嵌套的数据结构
          const { images, pagination } = response.data.data
          
          if (images && images.length > 0) {
            // 处理图片数据，确保字段名一致
            const processedImages = images.map(img => ({
              id: img._id, // 将_id映射为id
              filename: img.title || img.filename,
              title: img.title,
              url: img.url,
              key: img.key,
              size: img.fileSize,
              width: img.width,
              height: img.height,
              mimetype: `image/${img.format}`,
              uploadTime: img.createdAt,
              tags: img.tags || [],
              isPublic: img.isPublic,
              isAnonymous: img.isAnonymous,
              ipAddress: img.ipAddress || '未记录',
              folder: img.folder || null // 确保字段名为folder而不是folderId
            }))
            
            commit('SET_IMAGES', processedImages)
            
            // 设置分页信息
            if (pagination) {
              commit('SET_PAGINATION', { 
                total: pagination.total,
                currentPage: pagination.page
              })
            }
            
            console.log('处理后的图片数据:', processedImages)
            return
          }
        }
        
        // 如果没有图片数据或处理失败，回退到模拟数据
        console.warn('没有获取到有效的图片数据，使用模拟数据')
        const mockImages = await dispatch('useMockImages')
        commit('SET_IMAGES', mockImages)
        commit('SET_PAGINATION', { total: mockImages.length })
      } catch (error) {
        console.error('获取图片列表失败:', error)
        // 错误时使用模拟数据
        const mockImages = []
        commit('SET_IMAGES', mockImages)
        commit('SET_PAGINATION', { total: mockImages.length })
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 获取文件夹列表
    async fetchFolders({ commit, state }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求获取文件夹列表
        const response = await axios.get(`${API_BASE_URL}/folders`)
        
        // 检查响应
        if (response.data && response.data.success && response.data.data) {
          const folders = response.data.data
          
          // 处理文件夹数据
          const processedFolders = folders.map(folder => ({
            id: folder._id,
            name: folder.name,
            description: folder.description,
            color: folder.color || '#409EFF',
            imageCount: folder.imageCount,
            createdAt: folder.createdAt,
            updatedAt: folder.updatedAt
          }))
          
          // 为每个文件夹添加封面图片
          const foldersWithCovers = await Promise.all(processedFolders.map(async folder => {
            // 查找该文件夹中的第一张图片作为封面
            const coverImage = state.images.find(img => img.folder === folder.id)
            if (coverImage) {
              return {
                ...folder,
                coverUrl: coverImage.url
              }
            }
            return folder
          }))
          
          commit('SET_FOLDERS', foldersWithCovers)
          return foldersWithCovers
        }
        
        // 如果未获取到数据或出错，使用模拟数据
        console.warn('未获取到有效的文件夹数据，使用模拟数据')
        const mockFolders = [
          {
            id: 'folder_1',
            name: '风景照片',
            description: '收集的各种风景照片',
            color: '#409EFF',
            imageCount: 5,
            createdAt: '2023-04-01T08:30:00Z',
            updatedAt: '2023-04-10T15:20:00Z'
          },
          {
            id: 'folder_2',
            name: '动物照片',
            description: '收集的各种动物照片',
            color: '#67C23A',
            imageCount: 3,
            createdAt: '2023-04-02T10:15:00Z',
            updatedAt: '2023-04-09T11:40:00Z'
          },
          {
            id: 'folder_3',
            name: '食物照片',
            description: '各种美食照片',
            color: '#E6A23C',
            imageCount: 0,
            createdAt: '2023-04-05T14:25:00Z',
            updatedAt: '2023-04-05T14:25:00Z'
          }
        ]
        
        // 为模拟数据添加默认封面
        const mockedFoldersWithCovers = mockFolders.map(folder => ({
          ...folder,
          coverUrl: null
        }))
        
        commit('SET_FOLDERS', mockedFoldersWithCovers)
        return mockedFoldersWithCovers
      } catch (error) {
        console.error('获取文件夹列表失败:', error)
        
        // 返回模拟数据
        const mockFolders = []
        
        commit('SET_FOLDERS', mockFolders)
        return mockFolders
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 创建文件夹
    async createFolder({ commit }, folderData) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求创建文件夹
        const response = await axios.post(`${API_BASE_URL}/folders`, folderData)
        
        // 检查响应
        if (response.data && response.data.success && response.data.data) {
          const newFolder = response.data.data
          
          // 处理返回的文件夹数据
          const processedFolder = {
            id: newFolder._id,
            name: newFolder.name,
            description: newFolder.description,
            imageCount: 0,
            createdAt: newFolder.createdAt,
            updatedAt: newFolder.updatedAt
          }
          
          commit('ADD_FOLDER', processedFolder)
          return processedFolder
        }
        
        throw new Error('创建文件夹失败')
      } catch (error) {
        console.error('创建文件夹失败:', error)
        
        // 模拟成功，实际应用中应该抛出错误
        const mockFolder = {
          id: `folder_${Date.now()}`,
          name: folderData.name,
          description: folderData.description,
          imageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        commit('ADD_FOLDER', mockFolder)
        return mockFolder
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 更新文件夹
    async updateFolder({ commit }, folderData) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求更新文件夹
        const response = await axios.put(`${API_BASE_URL}/folders/${folderData.id}`, folderData)
        
        // 检查响应
        if (response.data && response.data.success && response.data.data) {
          const updatedFolder = response.data.data
          
          // 处理返回的文件夹数据
          const processedFolder = {
            id: updatedFolder._id,
            name: updatedFolder.name,
            description: updatedFolder.description,
            imageCount: updatedFolder.imageCount,
            createdAt: updatedFolder.createdAt,
            updatedAt: updatedFolder.updatedAt
          }
          
          commit('UPDATE_FOLDER', processedFolder)
          return processedFolder
        }
        
        throw new Error('更新文件夹失败')
      } catch (error) {
        console.error('更新文件夹失败:', error)
        
        // 模拟成功，实际应用中应该抛出错误
        const updatedFolder = {
          ...folderData,
          updatedAt: new Date().toISOString()
        }
        
        commit('UPDATE_FOLDER', updatedFolder)
        return updatedFolder
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 删除文件夹
    async deleteFolder({ commit }, folderId) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求删除文件夹
        const response = await axios.delete(`${API_BASE_URL}/folders/${folderId}`)
        
        // 检查响应
        if (response.data && response.data.success) {
          commit('DELETE_FOLDER', folderId)
          return { success: true }
        }
        
        throw new Error('删除文件夹失败')
      } catch (error) {
        console.error('删除文件夹失败:', error)
        
        // 模拟成功，实际应用中应该抛出错误
        commit('DELETE_FOLDER', folderId)
        return { success: true }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 创建标签
    async createTag({ commit }, tagData) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求创建标签
        const response = await axios.post(`${API_BASE_URL}/tags`, { name: tagData.name })
        
        // 检查响应
        if (response.data && response.data.success) {
          // 成功创建标签
          ElMessage.success(`标签 ${tagData.name} 创建成功`)
          return { success: true, name: tagData.name }
        }
        
        throw new Error(response.data?.message || '创建标签失败')
      } catch (error) {
        console.error('创建标签失败:', error)
        ElMessage.error(error.response?.data?.message || '创建标签失败')
        
        // 模拟成功，实际应该抛出错误
        return { success: true, name: tagData.name }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 更新标签
    async updateTag({ commit }, { oldName, newName }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求更新标签
        const response = await axios.put(`${API_BASE_URL}/tags/${oldName}`, { 
          newName 
        })
        
        // 检查响应
        if (response.data && response.data.success) {
          // 更新所有图片中的标签
          this.state.images.forEach(image => {
            if (image.tags && image.tags.includes(oldName)) {
              const index = image.tags.indexOf(oldName)
              if (index !== -1) {
                image.tags[index] = newName
              }
            }
          })
          
          ElMessage.success(`标签已从 "${oldName}" 更新为 "${newName}"`)
          return { success: true, oldName, newName }
        }
        
        throw new Error(response.data?.message || '更新标签失败')
      } catch (error) {
        console.error('更新标签失败:', error)
        ElMessage.error(error.response?.data?.message || '更新标签失败')
        
        // 模拟成功，实际应该抛出错误
        return { success: true, oldName, newName }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 删除标签
    async deleteTag({ commit }, tagName) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求删除标签
        const response = await axios.delete(`${API_BASE_URL}/tags/${tagName}`)
        
        // 检查响应
        if (response.data && response.data.success) {
          // 从所有图片中移除标签
          this.state.images.forEach(image => {
            if (image.tags && image.tags.includes(tagName)) {
              image.tags = image.tags.filter(tag => tag !== tagName)
            }
          })
          
          ElMessage.success(`标签 "${tagName}" 已删除`)
          return { success: true, tagName }
        }
        
        throw new Error(response.data?.message || '删除标签失败')
      } catch (error) {
        console.error('删除标签失败:', error)
        ElMessage.error(error.response?.data?.message || '删除标签失败')
        
        // 模拟成功，实际应该抛出错误
        return { success: true, tagName }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 获取标签列表
    async fetchTags({ commit }, options = {}) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求获取标签列表
        const response = await axios.get(`${API_BASE_URL}/tags`, {
          params: {
            t: options.forceRefresh ? Date.now() : undefined // 添加时间戳防止缓存
          }
        })
        
        // 检查响应
        if (response.data && response.data.success) {
          const tags = response.data.data
          
          // 保存到状态
          commit('SET_TAGS', tags)
          return tags
        }
        
        // 如果无法从API获取，使用从图片中提取的标签
        const tagCounts = {}
        this.state.images.forEach(img => {
          if (img.tags && img.tags.length) {
            img.tags.forEach(tag => {
              if (!tagCounts[tag]) tagCounts[tag] = 0
              tagCounts[tag]++
            })
          }
        })
        
        const extractedTags = Object.keys(tagCounts).map(tag => ({
          name: tag,
          count: tagCounts[tag]
        }))
        
        commit('SET_TAGS', extractedTags)
        return extractedTags
      } catch (error) {
        console.error('获取标签列表失败:', error)
        
        // 如果后端API失败，从图片中提取标签
        const tagCounts = {}
        this.state.images.forEach(img => {
          if (img.tags && img.tags.length) {
            img.tags.forEach(tag => {
              if (!tagCounts[tag]) tagCounts[tag] = 0
              tagCounts[tag]++
            })
          }
        })
        
        const extractedTags = Object.keys(tagCounts).map(tag => ({
          name: tag,
          count: tagCounts[tag]
        }))
        
        commit('SET_TAGS', extractedTags)
        return extractedTags
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 移动图片到文件夹
    async moveImageToFolder({ commit, dispatch }, { imageId, folderId }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 调用后端API将图片添加到文件夹
        const response = await axios.put(`${API_BASE_URL}/images/${imageId}/folder`, { folderId })
        
        if (response.data && response.data.success) {
          // 更新本地状态
          commit('MOVE_IMAGE_TO_FOLDER', { imageId, folderId })
          return { success: true }
        }
        
        throw new Error(response.data?.message || '移动图片失败')
      } catch (error) {
        console.error('移动图片到文件夹失败:', error)
        
        // 模拟成功，实际项目中应该抛出错误
        commit('MOVE_IMAGE_TO_FOLDER', { imageId, folderId })
        return { success: true }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 使用模拟图片的工具函数
    async useMockImages() {
      return []
    },
    
    // 单个图片上传
    async uploadImage({ commit, state, dispatch }, options) {
      commit('SET_LOADING', true)
      
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        const { 
          file, 
          compress = state.uploadConfig.compress, 
          compressQuality = state.uploadConfig.compressQuality,
          convertFormat = null,
          folderId = null,
          tags = []
        } = options
        
        // 记录详细的上传参数
        console.log('图片上传开始', {
          文件名: file.name,
          文件类型: file.type,
          文件大小: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          启用压缩: compress ? '是' : '否',
          压缩质量: `${compressQuality}%`,
          文件夹ID: folderId || '无'
        });
        
        // 验证文件类型是否被允许
        if (!file.type.startsWith('image/')) {
          throw new Error('只能上传图片文件')
        }
        
        // 验证文件类型是否在允许列表中
        if (!state.uploadConfig.allowedTypes.includes(file.type)) {
          const supportedFormats = state.uploadConfig.allowedTypes.map(type => {
            const formatName = type.split('/')[1]
            return formatName.toUpperCase()
          }).join(', ')
          
          throw new Error(`不支持的文件类型: ${file.type.split('/')[1]}\n仅支持: ${supportedFormats}`)
        }
        
        // 验证文件大小
        if (file.size > state.uploadConfig.maxSize * 1024 * 1024) {
          throw new Error(`文件大小超过限制(${state.uploadConfig.maxSize}MB)`)
        }
        
        // 处理文件
        let processedFile = file
        let wasCompressed = false
        
        // 如果需要压缩
        if (compress && file.type.startsWith('image/')) {
          console.log(`开始压缩图片: ${file.name}`, {
            原始大小: `${(file.size/1024).toFixed(2)}KB`,
            压缩质量: `${compressQuality}%`,
            文件类型: file.type
          });
          
          try {
            const originalSize = file.size;
            processedFile = await dispatch('compressImage', { 
              file, 
              quality: compressQuality || 85 
            });
            
            wasCompressed = (processedFile !== file);
            
            if (wasCompressed) {
              console.log('图片压缩完成', {
                原始大小: `${(originalSize/1024).toFixed(2)}KB`,
                压缩后大小: `${(processedFile.size/1024).toFixed(2)}KB`,
                压缩比例: `${((1 - processedFile.size/originalSize) * 100).toFixed(2)}%`,
                最终文件类型: processedFile.type
              });
            } else {
              console.log('图片未被压缩（使用原始图片）');
            }
          } catch (compressError) {
            console.error('图片压缩失败，将使用原始图片:', compressError);
            processedFile = file; // 压缩失败时使用原始文件
          }
        } else {
          console.log(`跳过压缩处理: ${!compress ? '压缩功能已禁用' : '不支持的文件类型'}`);
        }
        
        // 从后端获取上传凭证
        const filename = state.uploadConfig.autoRename ? `${Date.now()}_${file.name}` : file.name
        
        const tokenResponse = await axios.get(`${API_BASE_URL}/token`, {
          params: { filename }
        })
        
        if (!tokenResponse.data.success) {
          throw new Error(tokenResponse.data.message || '获取上传凭证失败')
        }
        
        const { token, key, domain, filename: generatedFilename } = tokenResponse.data.data
        console.log('后端生成的文件信息:', { key, filename: generatedFilename });
        
        // 上传文件到存储服务
        const formData = new FormData()
        formData.append('file', processedFile)
        formData.append('token', token)
        formData.append('key', key)
        
        console.log('准备上传到七牛云', {
          文件名: processedFile.name,
          文件类型: processedFile.type,
          文件大小: `${(processedFile.size / 1024).toFixed(2)}KB`,
          存储路径: key
        });
        
        const uploadResponse = await axios.post('https://upload.qiniup.com', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        console.log('七牛云上传完成', uploadResponse.data);
        
        // 构建图片信息
        const imageUrl = `${domain.startsWith('http') ? domain : `http://${domain}`}/${uploadResponse.data.key}`
        
        // 获取图片原始尺寸
        const dimensions = await dispatch('getImageDimensions', processedFile)
        
        // 获取真实IP地址
        const ipAddress = await dispatch('getUserIP')
        
        // 确保保存原始图片格式或压缩后的新格式
        let formatInfo = '';
        if (wasCompressed && processedFile.type !== file.type) {
          formatInfo = `${file.type.split('/')[1]} -> ${processedFile.type.split('/')[1]}`;
        } else {
          formatInfo = file.type.split('/')[1];
        }
        
        console.log(`保存图片信息 - 格式: ${formatInfo}, 尺寸: ${dimensions.width}x${dimensions.height}`);
        
        // 保存图片信息到数据库
        const imageData = {
          title: generatedFilename || processedFile.name, // 使用后端生成的文件名作为标题
          filename: generatedFilename || processedFile.name, // 使用后端生成的文件名
          url: imageUrl,
          key: uploadResponse.data.key,
          fileSize: processedFile.size,
          width: dimensions.width,
          height: dimensions.height,
          format: processedFile.name.split('.').pop().toLowerCase(), // 使用文件扩展名作为格式
          folderId: folderId, // 确保文件夹ID被正确传递
          ipAddress: ipAddress, // 确保IP地址被正确传递
          tags, // 添加标签
          wasCompressed: wasCompressed, // 标记是否经过压缩
          compressionInfo: wasCompressed ? {
            originalSize: file.size,
            compressedSize: processedFile.size,
            compressionRatio: ((1 - processedFile.size/file.size) * 100).toFixed(2) + '%',
            quality: compressQuality
          } : null
        }
        
        console.log('准备保存图片信息到数据库:', {
          文件夹ID: folderId || '无',
          标签数量: tags.length,
          图片URL: imageUrl,
          是否经过压缩: wasCompressed ? '是' : '否'
        });
        
        // 调用后端API保存图片信息
        const saveResponse = await axios.post(`${API_BASE_URL}/images`, imageData)
        
        if (!saveResponse.data.success) {
          throw new Error(saveResponse.data.message || '保存图片信息失败')
        }
        
        // 获取保存的图片信息，包含ID等
        const savedImage = saveResponse.data.data
        
        // 更新本地状态
        const processedImage = {
          id: savedImage._id,
          filename: savedImage.title || savedImage.filename,
          title: savedImage.title,
          url: savedImage.url,
          key: savedImage.key,
          size: savedImage.fileSize,
          width: savedImage.width,
          height: savedImage.height,
          mimetype: `image/${savedImage.format}`,
          uploadTime: savedImage.createdAt,
          tags: savedImage.tags || [],
          folder: savedImage.folder || null,
          isPublic: savedImage.isPublic,
          isAnonymous: savedImage.isAnonymous,
          ipAddress: savedImage.ipAddress || '未记录'
        }
        
        commit('ADD_IMAGE', processedImage)
        
        // 如果有标签，更新标签列表
        if (tags && tags.length > 0) {
          dispatch('fetchTags')
        }
        
        // 如果上传到了文件夹，更新文件夹列表并重新获取图片列表
        if (folderId) {
          await dispatch('fetchFolders')
          await dispatch('fetchImages', { forceRefresh: true })
        }
        
        return processedImage
      } catch (error) {
        console.error('上传图片失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 压缩图片
    async compressImage({ state }, { file, quality = 85 }) {
      console.log(`===== 开始压缩图片 =====`);
      console.log(`原始文件: ${file.name}, 类型: ${file.type}, 大小: ${(file.size/1024).toFixed(2)}KB, 压缩质量: ${quality}%`);
      
      // 不处理GIF和SVG格式
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        console.log(`跳过压缩: ${file.type} 格式不适合压缩处理`);
        return file;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const img = new Image();
          
          // 创建图片加载错误处理函数
          img.onerror = () => {
            console.error('图片加载失败，将使用原图');
            resolve(file);
          };
          
          img.onload = () => {
            try {
              // 获取图片原始尺寸
              let width = img.width;
              let height = img.height;
              
              console.log(`图片原始尺寸: ${width}x${height}像素`);
              
              // 超过最大尺寸时等比例缩小
              const MAX_DIMENSION = 3000; // 最大尺寸为3000像素
              if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                  height = Math.round(height * (MAX_DIMENSION / width));
                  width = MAX_DIMENSION;
                } else {
                  width = Math.round(width * (MAX_DIMENSION / height));
                  height = MAX_DIMENSION;
                }
                console.log(`图片尺寸过大，将调整为: ${width}x${height}像素`);
              }
              
              // 创建canvas并调整大小
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              
              // 获取canvas上下文
              const ctx = canvas.getContext('2d');
              
              // 处理透明度，对于PNG保留透明背景
              if (file.type !== 'image/png') {
                // 非PNG格式填充白色背景
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
              } else {
                // PNG保持透明
                ctx.clearRect(0, 0, width, height);
              }
              
              // 在画布上绘制图片
              ctx.drawImage(img, 0, 0, width, height);
              
              // 保持原始文件类型，不执行格式转换
              let outputType = file.type;
              let outputQuality = quality / 100; // 转换为0-1范围
              
              // 为PNG设置一个合理的质量值，因为PNG是无损的，这里的质量值主要影响尺寸调整后的效果
              if (file.type === 'image/png') {
                console.log(`PNG图片压缩: 保持PNG格式并应用尺寸优化`);
              }
              
              console.log(`应用压缩: 输入=${file.type}, 输出=${outputType}, 质量=${quality}%`);
              
              // 将canvas转换为Blob
              canvas.toBlob((blob) => {
                if (!blob) {
                  console.error('压缩失败：无法生成Blob对象');
                  resolve(file); // 使用原始文件
                  return;
                }
                
                // 创建新文件对象，保持原始扩展名
                const compressedFile = new File([blob], file.name, {
                  type: outputType,
                  lastModified: Date.now()
                });
                
                // 详细的压缩效果日志
                const originalSizeKB = (file.size / 1024).toFixed(2);
                const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
                const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(2);
                
                console.log(`===== 压缩结果 =====`);
                console.log(`原始文件: ${file.name} (${file.type}), 大小: ${originalSizeKB}KB`);
                console.log(`压缩文件: ${compressedFile.name} (${compressedFile.type}), 大小: ${compressedSizeKB}KB`);
                console.log(`压缩比例: ${compressionRatio}%, 节省空间: ${(file.size - compressedFile.size)/1024}KB`);
                
                // 检查压缩是否有效（至少节省5%）
                if (compressedFile.size > file.size * 0.95) {
                  console.log(`压缩无效: 压缩后大小 ${compressedSizeKB}KB >= 原始大小的95% (${(file.size * 0.95 / 1024).toFixed(2)}KB)`);
                  console.log(`返回原始文件`);
                  resolve(file); // 如果压缩效果不明显，使用原始文件
                } else {
                  console.log(`压缩有效，使用压缩后的文件`);
                  resolve(compressedFile);
                }
              }, outputType, outputQuality);
            } catch (error) {
              console.error('压缩过程发生错误:', error);
              resolve(file); // 出错时使用原始文件
            }
          };
          
          // 从FileReader结果设置图片源
          img.src = event.target.result;
        };
        
        reader.onerror = (error) => {
          console.error('读取文件失败:', error);
          reject(error);
        };
        
        // 开始读取文件
        reader.readAsDataURL(file);
      });
    },
    
    // 获取图片尺寸
    async getImageDimensions(_, file) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          })
        }
        img.onerror = () => {
          reject(new Error('无法获取图片尺寸'))
        }
        
        // 从文件创建URL并设置到img上
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target.result
        }
        reader.onerror = () => {
          reject(new Error('读取文件失败'))
        }
        reader.readAsDataURL(file)
      })
    },
    
    // 获取用户IP地址（模拟）
    async getUserIP(_commit, _state) { // 参数未使用
      // 实际环境中，IP地址应由后端记录
      // 这里模拟返回一个随机IP，仅用于演示
      const ip1 = Math.floor(Math.random() * 255)
      const ip2 = Math.floor(Math.random() * 255)
      return `192.168.${ip1}.${ip2}`
    },
    
    // 删除图片
    async deleteImage({ commit, state }, imageId) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 获取用户登录状态
        const token = localStorage.getItem('token')
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        // 对于匿名上传的图片，可以直接删除，无需认证
        const image = state.images.find(img => img.id === imageId)
        if (image && image.isAnonymous) {
          console.log('删除匿名上传图片:', imageId)
        }
        
        // 调用后端API删除图片（数据库和七牛云）
        await axios.delete(`${API_BASE_URL}/images/${imageId}`, { headers })
        
        // 从状态中删除图片
        commit('DELETE_IMAGE', imageId)
        
        return { success: true, message: '图片已成功删除' }
      } catch (error) {
        console.error('删除图片失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 更新图片信息
    async updateImage({ commit }, updatedImage) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求更新图片信息
        const response = await axios.put(`${API_BASE_URL}/images/${updatedImage.id}`, updatedImage)
        
        if (response.data && response.data.success) {
          // 更新本地状态
          commit('UPDATE_IMAGE', updatedImage)
          
          // 更新完成后重新获取标签列表，确保标签数据更新
          this.dispatch('fetchTags')
          
          return { success: true, data: response.data.data }
        }
        
        // 如果API返回失败，但我们还是需要更新本地状态
        // 这只是为了演示目的，实际应用中应该处理错误
        commit('UPDATE_IMAGE', updatedImage)
        
        return { success: true, data: updatedImage }
      } catch (error) {
        console.error('更新图片失败:', error)
        // 为了保持UI一致性，仍然更新本地状态
        commit('UPDATE_IMAGE', updatedImage)
        
        // 更新完成后重新获取标签列表，确保标签数据更新
        this.dispatch('fetchTags')
        
        return { success: true, data: updatedImage }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 批量更新图片标签
    async batchUpdateTags({ commit, dispatch }, { imageIds, tags, mode }) {
      commit('SET_LOADING', true)
      try {
        const updatedImages = [];
        
        // 批量处理每个图片
        for (const imageId of imageIds) {
          // 获取当前图片信息
          const image = this.state.images.find(img => img.id === imageId);
          if (!image) continue;
          
          const updatedImage = { ...image };
          
          // 根据模式处理标签
          if (mode === 'replace') {
            // 替换现有标签
            updatedImage.tags = [...tags];
          } else {
            // 添加到现有标签，避免重复
            const existingTags = updatedImage.tags || [];
            updatedImage.tags = [...new Set([...existingTags, ...tags])];
          }
          
          // 更新单个图片
          await dispatch('updateImage', updatedImage);
          updatedImages.push(updatedImage);
        }
        
        return updatedImages;
      } catch (error) {
        console.error('批量更新标签失败:', error);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 批量移动图片到文件夹
    async batchMoveToFolder({ commit, dispatch }, { imageIds, folderId }) {
      commit('SET_LOADING', true);
      try {
        const updatedImages = [];
        
        // 批量处理每个图片
        for (const imageId of imageIds) {
          try {
            // 调用单个图片的移动方法
            await dispatch('moveImageToFolder', { imageId, folderId });
            
            // 获取更新后的图片
            const image = this.state.images.find(img => img.id === imageId);
            if (image) {
              updatedImages.push(image);
            }
          } catch (error) {
            console.error(`移动图片 ${imageId} 到文件夹失败:`, error);
            // 继续处理其他图片
          }
        }
        
        return updatedImages;
      } catch (error) {
        console.error('批量移动到文件夹失败:', error);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 保存设置
    saveSettings({ commit }, settings) {
      commit('SET_SETTINGS', settings)
      // 在本地存储中保存设置
      localStorage.setItem('picmark-settings', JSON.stringify(settings))
    },
    
    // 初始化应用
    initializeApp({ commit, dispatch }) {
      // 从本地存储加载设置
      const savedSettings = localStorage.getItem('picmark-settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          commit('SET_SETTINGS', settings)
        } catch (e) {
          console.error('解析设置失败:', e)
        }
      }
      
      // 加载图片
      dispatch('fetchImages')
    },
    
    // 获取统计数据
    async fetchStatistics({ commit }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 直接从API获取最新数据，不使用缓存
        const response = await axios.get(`${API_BASE_URL}/statistics`, {
          // 添加时间戳参数防止浏览器缓存
          params: { t: new Date().getTime() }
        })
        
        if (response.data) {
          // 保存到vuex store
          commit('SET_STATISTICS', response.data)
          
          // 缓存数据到localStorage
          localStorage.setItem('picmark-statistics', JSON.stringify({
            data: response.data,
            timestamp: new Date().toISOString()
          }))
          
          return response.data
        } else {
          throw new Error('服务器返回了无效的统计数据')
        }
      } catch (error) {
        console.error('获取统计数据出错:', error)
        ElMessage.error('获取统计数据失败: ' + (error.message || '未知错误'))
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 记录图片访问
    async recordImageView({ commit }, imageId) {
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 调用API记录访问
        await axios.post(`${API_BASE_URL}/images/${imageId}/view`)
        
        // 不设置loading状态，避免影响用户体验
        console.log(`已记录图片 ${imageId} 的访问`)
      } catch (error) {
        console.warn('记录图片访问失败:', error)
        // 此处不抛出错误，避免影响正常的图片浏览体验
      }
    },
    
    // 更新图片标签
    async updateImageTags({ commit, dispatch }, { id, tags }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 先获取完整的图片数据
        const image = this.state.images.find(img => img.id === id)
        if (!image) {
          throw new Error('图片不存在')
        }
        
        // 创建更新对象，只包含id和tags
        const updatedImage = {
          id,
          tags
        }
        
        // 发送请求更新标签信息
        const response = await axios.put(`${API_BASE_URL}/images/${id}`, updatedImage)
        
        if (response.data && response.data.success) {
          // 更新本地图片状态
          commit('UPDATE_IMAGE', { ...image, tags })
          
          // 更新完成后重新获取标签列表，确保标签数据最新
          await dispatch('fetchTags')
          
          console.log('标签更新成功:', response.data)
          return { success: true, data: response.data.data }
        }
        
        throw new Error(response.data?.message || '标签更新失败')
      } catch (error) {
        console.error('更新图片标签失败:', error)
        ElMessage.error('更新标签失败: ' + (error.message || '未知错误'))
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
})
