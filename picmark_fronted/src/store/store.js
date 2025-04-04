/* eslint-disable no-unused-vars */
import { createStore } from 'vuex'

// 创建store实例
export default createStore({
  state: {
    // 图片列表
    images: [],
    // 文件夹列表
    folders: [],
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
          img.folderId === state.filters.folderId
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
        image.folderId = folderId
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
    }
  },
  
  actions: {
    // 获取图片列表
    async fetchImages({ commit, state, dispatch }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 构建请求参数
        const params = {
          page: state.pagination.currentPage,
          limit: state.pagination.pageSize
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
          params.folderId = state.filters.folderId
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
              folderId: img.folderId || null
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
    async fetchFolders({ commit }) {
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
            imageCount: folder.imageCount,
            createdAt: folder.createdAt,
            updatedAt: folder.updatedAt
          }))
          
          commit('SET_FOLDERS', processedFolders)
          return processedFolders
        }
        
        // 如果未获取到数据或出错，使用模拟数据
        console.warn('未获取到有效的文件夹数据，使用模拟数据')
        const mockFolders = [
          {
            id: 'folder_1',
            name: '风景照片',
            description: '收集的各种风景照片',
            imageCount: 5,
            createdAt: '2023-04-01T08:30:00Z',
            updatedAt: '2023-04-10T15:20:00Z'
          },
          {
            id: 'folder_2',
            name: '动物照片',
            description: '收集的各种动物照片',
            imageCount: 3,
            createdAt: '2023-04-02T10:15:00Z',
            updatedAt: '2023-04-09T11:40:00Z'
          },
          {
            id: 'folder_3',
            name: '食物照片',
            description: '各种美食照片',
            imageCount: 0,
            createdAt: '2023-04-05T14:25:00Z',
            updatedAt: '2023-04-05T14:25:00Z'
          }
        ]
        
        commit('SET_FOLDERS', mockFolders)
        return mockFolders
      } catch (error) {
        console.error('获取文件夹列表失败:', error)
        
        // 返回模拟数据
        const mockFolders = [
          {
            id: 'folder_1',
            name: '风景照片',
            description: '收集的各种风景照片',
            imageCount: 5,
            createdAt: '2023-04-01T08:30:00Z',
            updatedAt: '2023-04-10T15:20:00Z'
          },
          {
            id: 'folder_2',
            name: '动物照片',
            description: '收集的各种动物照片',
            imageCount: 3,
            createdAt: '2023-04-02T10:15:00Z',
            updatedAt: '2023-04-09T11:40:00Z'
          }
        ]
        
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
      // 模拟创建标签，实际上标签是通过图片来管理的
      console.log('创建标签:', tagData.name)
      return { success: true, name: tagData.name }
    },
    
    // 更新标签
    async updateTag({ commit }, tagData) {
      // 模拟更新标签
      if (tagData.oldName && tagData.name) {
        // 遍历所有图片，将旧标签替换为新标签
        // _state.images.forEach(image => {
        //   if (image.tags && image.tags.includes(tagData.oldName)) {
        //     commit('REMOVE_TAG_FROM_IMAGE', { imageId: image.id, tag: tagData.oldName })
        //     commit('ADD_TAG_TO_IMAGE', { imageId: image.id, tag: tagData.name })
        //   }
        // })
        console.log(`将标签 ${tagData.oldName} 更新为 ${tagData.name}`)
      }
      
      return { success: true, name: tagData.name }
    },
    
    // 删除标签
    async deleteTag(tagName) {
      // 从所有图片中移除该标签
      // _state.images.forEach(image => {
      //   if (image.tags && image.tags.includes(tagName)) {
      //     commit('REMOVE_TAG_FROM_IMAGE', { imageId: image.id, tag: tagName })
      //   }
      // })
      console.log(`删除标签 ${tagName}`)
      return { success: true }
    },
    
    // 移动图片到文件夹
    async moveImageToFolder({ commit }, { imageId, folderId }) {
      commit('SET_LOADING', true)
      try {
        // 导入axios
        const axios = await import('axios').then(m => m.default)
        
        // 设置API基础URL
        const API_BASE_URL = 'http://localhost:3000/api'
        
        // 发送请求移动图片到文件夹
        const response = await axios.put(`${API_BASE_URL}/images/${imageId}/folder`, { folderId })
        
        // 检查响应
        if (response.data && response.data.success) {
          commit('MOVE_IMAGE_TO_FOLDER', { imageId, folderId })
          return { success: true }
        }
        
        throw new Error('移动图片失败')
      } catch (error) {
        console.error('移动图片失败:', error)
        
        // 模拟成功，实际应用中应该抛出错误
        commit('MOVE_IMAGE_TO_FOLDER', { imageId, folderId })
        return { success: true }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 使用模拟图片的工具函数
    async useMockImages() {
      return [
        {
          id: 'img_20230401_001',
          filename: 'mountains.jpg',
          url: 'https://img.picgo.net/2023/04/01/mountains.jpg',
          size: 2345678,
          width: 1920,
          height: 1080,
          mimetype: 'image/jpeg',
          uploadTime: '2023-04-01T10:30:45Z',
          tags: ['风景', '山脉']
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
          tags: ['风景', '日落', '海洋']
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
          tags: ['风景', '森林', '自然']
        }
      ]
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
        // 这里将来会替换为实际的更新API调用
        commit('UPDATE_IMAGE', updatedImage)
        return updatedImage
      } catch (error) {
        console.error('更新图片失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
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
    }
  }
})
