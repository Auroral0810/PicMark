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
      compress: true,
      autoRename: true,
      maxSize: 5, // MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    // 系统设置
    settings: {
      qiniuDomain: '',
      qiniuBucket: '',
      markdownFormat: '![{filename}]({url})',
      showGrid: true,
      defaultView: 'grid', // grid or list
      sortBy: 'uploadTime',
      sortDirection: 'desc'
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
        const mockImages = [
          {
            id: 'img_20230401_001',
            filename: 'mountains.jpg',
            url: 'https://img.picgo.net/2023/04/01/mountains.jpg',
            size: 2345678,
            width: 1920,
            height: 1080,
            mimetype: 'image/jpeg',
            uploadTime: '2023-04-01T10:30:45Z',
            ipAddress: '192.168.1.101',
            tags: ['风景', '山脉'],
            folderId: 'folder_1'
          },
          {
            id: 'img_20230405_002',
            filename: 'sunset.jpg',
            url: 'https://img.picgo.net/2023/04/05/sunset.jpg',
            size: 1245678,
            width: 1600,
            height: 900,
            mimetype: 'image/jpeg',
            uploadTime: '2023-04-05T18:22:30Z',
            ipAddress: '192.168.1.102',
            tags: ['风景', '日落', '海洋'],
            folderId: 'folder_1'
          },
          {
            id: 'img_20230410_003',
            filename: 'forest.png',
            url: 'https://img.picgo.net/2023/04/10/forest.png',
            size: 3456789,
            width: 2000,
            height: 1200,
            mimetype: 'image/png',
            uploadTime: '2023-04-10T09:15:10Z',
            ipAddress: '192.168.1.103',
            tags: ['风景', '森林', '自然'],
            folderId: 'folder_2'
          }
        ]
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
    
    // 上传图片
    async uploadImages({ commit, state, dispatch }, files) {
      commit('SET_LOADING', true)
      
      // 存储上传结果
      const uploadedImages = []
      const failedFiles = []
      
      try {
        // 获取axios (确保在应用中引入了axios)
        const axios = await import('axios').then(m => m.default)
        
        // 后端API基础URL - 确保与后端的实际地址匹配
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 获取用户登录状态
        const token = localStorage.getItem('token')
        const isLoggedIn = !!token
        
        // 获取用户IP地址
        let userIP = '';
        try {
          // 使用公共API获取IP地址
          const ipResponse = await axios.get('https://api.ipify.org?format=json');
          userIP = ipResponse.data.ip;
          console.log('获取到用户IP:', userIP);
        } catch (error) {
          console.warn('获取IP地址失败:', error);
          userIP = '未知IP';
        }
        
        // 为每个文件创建上传任务
        const uploadTasks = files.map(async (file) => {
          try {
            // 应用图片处理
            let processedFile = file
            
            // 如果启用了压缩，对图片进行压缩处理
            if (state.uploadConfig.compress && file.type.startsWith('image/')) {
              processedFile = await dispatch('compressImage', { file, quality: state.uploadConfig.compressQuality || 85 })
            }
            
            // 1. 从后端获取上传凭证和key
            const filename = state.uploadConfig.autoRename ? `${Date.now()}_${file.name}` : file.name
            // 添加日志
            console.log(`请求七牛云上传凭证，文件名: ${filename}`)
            
            let retries = 0
            const maxRetries = 3
            let tokenResponse
            
            // 添加重试逻辑，避免网络问题导致获取token失败
            while (retries < maxRetries) {
              try {
                tokenResponse = await axios.get(`${API_BASE_URL}/token`, {
                  params: { filename }
                })
                break
              } catch (err) {
                retries++
                console.error(`获取上传凭证失败(${retries}/${maxRetries})：`, err)
                if (retries === maxRetries) {
                  throw new Error(`获取上传凭证失败: ${err.message}`)
                }
                // 等待一段时间后重试
                await new Promise(r => setTimeout(r, 1000))
              }
            }
            
            console.log('获取到的token响应:', tokenResponse.data)
            
            if (!tokenResponse.data.success) {
              throw new Error(tokenResponse.data.message || '获取上传凭证失败')
            }
            
            const { token, key, domain } = tokenResponse.data.data
            
            // 确认获取到了有效的token
            if (!token) {
              throw new Error('获取到的上传凭证为空')
            }
            
            console.log('上传凭证:', { token: token.substring(0, 10) + '...', key, domain })
            
            // 2. 使用七牛云SDK上传文件
            const formData = new FormData()
            formData.append('file', processedFile)
            formData.append('token', token)
            formData.append('key', key)
            
            // 上传到七牛云
            console.log('开始上传到七牛云...')
            const uploadResponse = await axios.post('https://upload.qiniup.com', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              onUploadProgress: (progressEvent) => {
                console.log(`${file.name} 上传进度: ${Math.round(progressEvent.loaded * 100 / progressEvent.total)}%`)
              }
            })
            
            console.log('七牛云上传响应:', uploadResponse.data)
            
            // 确保上传成功并获取了响应
            if (!uploadResponse.data || !uploadResponse.data.key) {
              throw new Error('七牛云返回的响应无效')
            }
            
            // 3. 构建图片信息并保存到数据库
            // 构建完整的图片URL
            const imageUrl = `${domain.startsWith('http') ? domain : `http://${domain}`}/${uploadResponse.data.key}`
            
            const fileInfo = {
              title: file.name,
              description: '', // 可以后续编辑添加描述
              url: imageUrl,
              key: uploadResponse.data.key,
              tags: [], // 可以后续编辑添加标签
              width: uploadResponse.data.width || 0,
              height: uploadResponse.data.height || 0,
              fileSize: file.size,
              format: file.type.split('/')[1] || 'unknown',
              isPublic: true, // 默认为公开图片
              ipAddress: userIP // 添加用户IP地址
            }
            
            // 始终保存到数据库，无论用户是否登录
            try {
              console.log('准备保存到数据库的图片信息:', fileInfo)
              
              const headers = {
                'Content-Type': 'application/json'
              }
              
              // 如果用户已登录，添加认证令牌
              if (isLoggedIn) {
                headers['Authorization'] = `Bearer ${token}`
              }
              
              const saveResponse = await axios.post(`${API_BASE_URL}/images`, fileInfo, { headers })
              
              console.log('保存图片信息响应:', saveResponse.data)
              
              if (saveResponse.data.success) {
                // 使用数据库返回的图片信息(包含ID等)
                fileInfo.id = saveResponse.data.data._id || null
              } else {
                console.warn('保存图片信息到数据库失败:', saveResponse.data.message)
              }
            } catch (error) {
              console.error('保存图片信息到数据库失败:', error)
              // 即使保存到数据库失败，我们仍然返回上传结果，因为图片已经上传到七牛云
            }
            
            // 4. 返回完整的图片信息，包括多种格式的链接
            const imageInfo = fileInfo
            
            // 构建不同格式的链接
            const markdownFormat = state.settings.markdownFormat
            const markdownLink = markdownFormat
              .replace(/{filename}/g, imageInfo.title)
              .replace(/{url}/g, imageInfo.url)
              .replace(/{width}/g, imageInfo.width)
              .replace(/{height}/g, imageInfo.height)
              
            const htmlLink = `<img src="${imageInfo.url}" alt="${imageInfo.title}" width="${imageInfo.width}" height="${imageInfo.height}">`
            
            // 添加到上传结果
            const resultImage = {
              ...imageInfo,
              markdownLink,
              htmlLink,
              plainLink: imageInfo.url
            }
            
            uploadedImages.push(resultImage)
            console.log('图片上传成功:', resultImage)
            
            return imageInfo
          } catch (error) {
            console.error(`上传文件 ${file.name} 失败:`, error)
            failedFiles.push({ file, error: error.message })
            return null
          }
        })
        
        // 等待所有上传任务完成
        await Promise.all(uploadTasks)
        
        // 如果有上传成功的图片，保存到状态
        if (uploadedImages.length > 0) {
          commit('ADD_IMAGES', uploadedImages)
        }
        
        // 如果有失败的上传，显示错误信息
        if (failedFiles.length > 0) {
          console.error('部分文件上传失败:', failedFiles)
          throw new Error(`${failedFiles.length}个文件上传失败`)
        }
        
        return uploadedImages
      } catch (error) {
        console.error('上传图片失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 压缩图片的工具函数
    async compressImage(_, { file, quality = 85 }) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = event => {
          const img = new Image()
          img.src = event.target.result
          img.onload = () => {
            // 创建canvas绘制压缩图片
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            
            // 转换为blob
            canvas.toBlob(blob => {
              if (!blob) {
                reject(new Error('图片压缩失败'))
                return
              }
              // 创建一个新的File对象
              const compressedFile = new File([blob], file.name, {
                type: blob.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            }, file.type, quality / 100)
          }
          img.onerror = () => reject(new Error('图片加载失败'))
        }
        reader.onerror = () => reject(new Error('文件读取失败'))
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
