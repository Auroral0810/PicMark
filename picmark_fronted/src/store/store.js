import { createStore } from 'vuex'

// 创建store实例
export default createStore({
  state: {
    // 图片列表
    images: [],
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
      tags: []
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
        tags: []
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
    async fetchImages({ commit }) {
      commit('SET_LOADING', true)
      try {
        // 这里将来会替换为实际的API调用
        // 模拟数据
        const images = [
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
            ipAddress: '192.168.1.102',
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
            ipAddress: '192.168.1.103',
            tags: ['风景', '森林', '自然']
          },
          {
            id: 'img_20230412_004',
            filename: 'architecture.jpg',
            url: 'https://img.picgo.net/2023/04/12/architecture.jpg',
            size: 1876543,
            width: 1800,
            height: 1200,
            mimetype: 'image/jpeg',
            uploadTime: '2023-04-12T14:45:30Z',
            ipAddress: '192.168.1.104',
            tags: ['建筑', '城市']
          },
          {
            id: 'img_20230415_005',
            filename: 'flower.jpg',
            url: 'https://img.picgo.net/2023/04/15/flower.jpg',
            size: 987654,
            width: 1200,
            height: 800,
            mimetype: 'image/jpeg',
            uploadTime: '2023-04-15T11:20:15Z',
            ipAddress: '192.168.1.105',
            tags: ['花卉', '自然', '特写']
          },
          {
            id: 'img_20230418_006',
            filename: 'beach.jpg',
            url: 'https://img.picgo.net/2023/04/18/beach.jpg',
            size: 2198765,
            width: 2100,
            height: 1400,
            mimetype: 'image/jpeg',
            uploadTime: '2023-04-18T16:50:22Z',
            ipAddress: '192.168.1.106',
            tags: ['海滩', '度假', '自然']
          }
        ];
        commit('SET_IMAGES', images)
        commit('SET_PAGINATION', { total: images.length })
      } catch (error) {
        console.error('获取图片列表失败:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 上传图片
    async uploadImages({ commit }, files) {
      commit('SET_LOADING', true)
      try {
        // 获取用户IP地址（实际环境中应由后端提供）
        const ipAddress = await this.dispatch('getUserIP')
        
        // 生成上传结果（模拟）
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '')
        const uploadedImages = files.map((file, index) => {
          const id = `img_${timestamp}_${index}`
          return {
            id,
            filename: file.name,
            url: URL.createObjectURL(file), // 实际应该是服务器返回的URL
            size: file.size,
            width: 1200, // 模拟数据
            height: 800, // 模拟数据
            mimetype: file.type,
            uploadTime: new Date().toISOString(),
            ipAddress, // 添加IP地址
            tags: []
          }
        })
        
        commit('ADD_IMAGES', uploadedImages)
        return uploadedImages
      } catch (error) {
        console.error('上传图片失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 获取用户IP地址（模拟）
    async getUserIP() {
      // 实际环境中，IP地址应由后端记录
      // 这里模拟返回一个随机IP，仅用于演示
      const ip1 = Math.floor(Math.random() * 255)
      const ip2 = Math.floor(Math.random() * 255)
      return `192.168.${ip1}.${ip2}`
    },
    
    // 删除图片
    async deleteImage({ commit }, imageId) {
      commit('SET_LOADING', true)
      try {
        // 这里将来会替换为实际的删除API调用
        commit('DELETE_IMAGE', imageId)
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
