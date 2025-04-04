<template>
  <div class="statistics-container">
    <div class="stats-header">
      <h1 class="page-title">数据统计</h1>
      <p class="text-secondary">查看图片上传和使用情况分析</p>
      
      <div class="header-actions">
        <el-radio-group v-model="timePeriod" size="small">
          <el-radio-button label="week">最近一周</el-radio-button>
          <el-radio-button label="month">最近一月</el-radio-button>
          <el-radio-button label="year">最近一年</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    
    <el-row :gutter="24" class="stats-overview">
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-card-content">
            <div class="stats-icon">
              <el-icon><Picture /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.totalImages }}</div>
              <div class="stats-label">图片总数</div>
            </div>
          </div>
          <div class="stats-trend">
            <span :class="{'trend-up': statistics.imagesTrend > 0, 'trend-down': statistics.imagesTrend < 0}">
              <el-icon v-if="statistics.imagesTrend > 0"><CaretTop /></el-icon>
              <el-icon v-else-if="statistics.imagesTrend < 0"><CaretBottom /></el-icon>
              {{ Math.abs(statistics.imagesTrend) }}%
            </span>
            <span class="trend-period">相比上{{ timePeriodText }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-card-content">
            <div class="stats-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ formatStorageSize(statistics.storageUsed) }}</div>
              <div class="stats-label">存储用量</div>
            </div>
          </div>
          <div class="stats-trend">
            <span :class="{'trend-up': statistics.storageTrend > 0, 'trend-down': statistics.storageTrend < 0}">
              <el-icon v-if="statistics.storageTrend > 0"><CaretTop /></el-icon>
              <el-icon v-else-if="statistics.storageTrend < 0"><CaretBottom /></el-icon>
              {{ Math.abs(statistics.storageTrend) }}%
            </span>
            <span class="trend-period">相比上{{ timePeriodText }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-card-content">
            <div class="stats-icon">
              <el-icon><Link /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.totalVisits }}</div>
              <div class="stats-label">总访问次数</div>
            </div>
          </div>
          <div class="stats-trend">
            <span :class="{'trend-up': statistics.visitsTrend > 0, 'trend-down': statistics.visitsTrend < 0}">
              <el-icon v-if="statistics.visitsTrend > 0"><CaretTop /></el-icon>
              <el-icon v-else-if="statistics.visitsTrend < 0"><CaretBottom /></el-icon>
              {{ Math.abs(statistics.visitsTrend) }}%
            </span>
            <span class="trend-period">相比上{{ timePeriodText }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-card-content">
            <div class="stats-icon">
              <el-icon><UploadFilled /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.uploadsToday }}</div>
              <div class="stats-label">今日上传</div>
            </div>
          </div>
          <div class="stats-trend">
            <span :class="{'trend-up': statistics.uploadsTodayTrend > 0, 'trend-down': statistics.uploadsTodayTrend < 0}">
              <el-icon v-if="statistics.uploadsTodayTrend > 0"><CaretTop /></el-icon>
              <el-icon v-else-if="statistics.uploadsTodayTrend < 0"><CaretBottom /></el-icon>
              {{ Math.abs(statistics.uploadsTodayTrend) }}%
            </span>
            <span class="trend-period">相比昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="charts-row">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>上传趋势</h3>
              <el-radio-group v-model="uploadChartType" size="small">
                <el-radio-button label="count">数量</el-radio-button>
                <el-radio-button label="size">大小</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="uploadTrendChart"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>存储分布</h3>
            </div>
          </template>
          <div class="chart-container" ref="storageDistChart"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="charts-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>热门标签</h3>
            </div>
          </template>
          <div class="tags-cloud">
            <div 
              v-for="tag in statistics.popularTags" 
              :key="tag.name" 
              class="tag-item"
              :style="{ fontSize: calculateTagSize(tag.count) + 'px' }"
            >
              {{ tag.name }} ({{ tag.count }})
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>热门图片</h3>
            </div>
          </template>
          <el-table :data="statistics.popularImages" style="width: 100%">
            <el-table-column label="预览" width="80">
              <template #default="scope">
                <div class="image-preview">
                  <img :src="scope.row.url" :alt="scope.row.filename" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="filename" label="文件名" min-width="120" />
            <el-table-column prop="visits" label="访问次数" width="100" sortable />
            <el-table-column prop="lastVisited" label="最后访问" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.lastVisited) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'StatisticsPage',
  setup() {
    // 图表引用
    const uploadTrendChart = ref(null)
    const storageDistChart = ref(null)
    
    // 图表实例
    let uploadChart = null
    let storageChart = null
    
    // 时间区间选择
    const timePeriod = ref('month')
    const timePeriodText = computed(() => {
      switch (timePeriod.value) {
        case 'week': return '周';
        case 'month': return '月';
        case 'year': return '年';
        default: return '期间';
      }
    })
    
    // 上传图表类型
    const uploadChartType = ref('count')
    
    // 模拟统计数据
    const statistics = reactive({
      totalImages: 1258,
      imagesTrend: 12.5,
      storageUsed: 1.75 * 1024 * 1024 * 1024, // 1.75GB
      storageTrend: 8.3,
      totalVisits: 15768,
      visitsTrend: -2.1,
      uploadsToday: 23,
      uploadsTodayTrend: 15.0,
      uploadTrend: [
        { date: '2023-01-01', count: 12, size: 45 },
        { date: '2023-01-02', count: 18, size: 62 },
        { date: '2023-01-03', count: 10, size: 38 },
        { date: '2023-01-04', count: 15, size: 55 },
        { date: '2023-01-05', count: 20, size: 70 },
        { date: '2023-01-06', count: 25, size: 85 },
        { date: '2023-01-07', count: 22, size: 76 },
        { date: '2023-01-08', count: 28, size: 90 },
        { date: '2023-01-09', count: 32, size: 105 },
        { date: '2023-01-10', count: 35, size: 118 },
        { date: '2023-01-11', count: 30, size: 95 },
        { date: '2023-01-12', count: 28, size: 92 },
        { date: '2023-01-13', count: 25, size: 83 },
        { date: '2023-01-14', count: 29, size: 96 },
      ],
      storageDist: [
        { name: 'JPEG', value: 850 },
        { name: 'PNG', value: 310 },
        { name: 'GIF', value: 45 },
        { name: 'WebP', value: 53 }
      ],
      popularTags: [
        { name: '风景', count: 125 },
        { name: '科技', count: 98 },
        { name: '教程', count: 87 },
        { name: '截图', count: 64 },
        { name: '产品', count: 56 },
        { name: '设计', count: 48 },
        { name: '图表', count: 45 },
        { name: '人物', count: 38 },
        { name: '建筑', count: 32 },
        { name: '动物', count: 28 },
        { name: '美食', count: 26 },
        { name: '旅行', count: 22 },
        { name: '工作', count: 18 },
      ],
      popularImages: [
        { id: 1, filename: '科技展示.jpg', visits: 238, lastVisited: '2023-01-14T10:23:45', url: 'https://picsum.photos/id/1/60/45' },
        { id: 2, filename: '产品展示.png', visits: 187, lastVisited: '2023-01-14T09:15:22', url: 'https://picsum.photos/id/2/60/45' },
        { id: 3, filename: '风景图片.jpg', visits: 145, lastVisited: '2023-01-13T18:42:10', url: 'https://picsum.photos/id/3/60/45' },
        { id: 4, filename: '工作笔记.png', visits: 132, lastVisited: '2023-01-13T14:56:31', url: 'https://picsum.photos/id/4/60/45' },
        { id: 5, filename: '会议截图.jpg', visits: 124, lastVisited: '2023-01-13T11:30:05', url: 'https://picsum.photos/id/5/60/45' },
      ]
    })
    
    // 格式化存储大小
    const formatStorageSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // 计算标签云字体大小
    const calculateTagSize = (count) => {
      const minSize = 12;
      const maxSize = 24;
      const maxCount = Math.max(...statistics.popularTags.map(tag => tag.count));
      return minSize + (count / maxCount) * (maxSize - minSize);
    }
    
    // 初始化上传趋势图表
    const initUploadChart = () => {
      if (uploadChart) {
        uploadChart.dispose();
      }
      
      uploadChart = echarts.init(uploadTrendChart.value);
      
      const dates = statistics.uploadTrend.map(item => item.date);
      const series = uploadChartType.value === 'count' 
        ? statistics.uploadTrend.map(item => item.count)
        : statistics.uploadTrend.map(item => item.size);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const data = params[0];
            return `${data.name}<br/>${uploadChartType.value === 'count' ? '数量' : '大小'}: ${data.value}${uploadChartType.value === 'count' ? '张' : 'MB'}`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            formatter: function(value) {
              return value.substring(5); // 只显示月-日
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: function(value) {
              return value + (uploadChartType.value === 'count' ? '张' : 'MB');
            }
          }
        },
        series: [
          {
            name: uploadChartType.value === 'count' ? '上传数量' : '上传大小',
            type: 'line',
            smooth: true,
            lineStyle: {
              width: 3,
              shadowColor: 'rgba(0,0,0,0.3)',
              shadowBlur: 10,
              shadowOffsetY: 8
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(59, 130, 246, 0.8)'
                },
                {
                  offset: 1,
                  color: 'rgba(59, 130, 246, 0.1)'
                }
              ])
            },
            data: series
          }
        ],
        color: ['#3b82f6']
      };
      
      uploadChart.setOption(option);
    }
    
    // 初始化存储分布图表
    const initStorageChart = () => {
      if (storageChart) {
        storageChart.dispose();
      }
      
      storageChart = echarts.init(storageDistChart.value);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} MB ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: statistics.storageDist.map(item => item.name)
        },
        series: [
          {
            name: '存储分布',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: statistics.storageDist
          }
        ],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      };
      
      storageChart.setOption(option);
    }
    
    // 初始化图表
    const initCharts = () => {
      initUploadChart();
      initStorageChart();
    }
    
    // 监听窗口大小变化，调整图表大小
    const handleResize = () => {
      if (uploadChart) {
        uploadChart.resize();
      }
      if (storageChart) {
        storageChart.resize();
      }
    }
    
    // 监听上传图表类型变化
    watch(uploadChartType, () => {
      initUploadChart();
    });
    
    // 监听时间区间变化
    watch(timePeriod, () => {
      // 在实际应用中，这里应该通过API重新获取不同时间区间的数据
      // 对于demo，我们使用相同的数据
      initCharts();
    });
    
    // 组件挂载时初始化
    onMounted(() => {
      // 加载统计数据
      // 在实际应用中，这里应该通过API获取数据
      
      // 初始化图表
      setTimeout(() => {
        initCharts();
      }, 100);
      
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize);
    })
    
    return {
      timePeriod,
      timePeriodText,
      uploadChartType,
      statistics,
      uploadTrendChart,
      storageDistChart,
      formatStorageSize,
      formatDate,
      calculateTagSize
    }
  }
}
</script>

<style scoped>
.statistics-container {
  padding: 24px;
}

.stats-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  align-items: center;
}

.stats-overview {
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stats-card-content {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.stats-trend {
  font-size: 14px;
  color: var(--text-secondary);
}

.trend-up {
  color: #10b981;
  display: inline-flex;
  align-items: center;
}

.trend-down {
  color: #ef4444;
  display: inline-flex;
  align-items: center;
}

.trend-period {
  margin-left: 8px;
  color: var(--text-secondary);
}

.charts-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container {
  height: 350px;
}

.tags-cloud {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  min-height: 350px;
  align-items: center;
}

.tag-item {
  color: var(--primary-color);
  display: inline-block;
  padding: 5px 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tag-item:hover {
  transform: scale(1.1);
  color: var(--primary-dark);
}

.image-preview {
  width: 60px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 深色模式适配 */
[data-theme="dark"] .stats-icon {
  background-color: var(--primary-dark);
  color: var(--primary-light);
}

[data-theme="dark"] .tag-item {
  color: var(--primary-light);
}

[data-theme="dark"] .tag-item:hover {
  color: var(--primary-color);
}
</style> 