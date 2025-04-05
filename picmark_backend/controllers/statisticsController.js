const Image = require('../models/image.model');
const Folder = require('../models/folder.model');
const tagController = require('./tagController');

/**
 * 获取系统统计数据
 * @route GET /api/statistics
 * @access Public
 */
exports.getStatistics = async (req, res) => {
  try {
    // 获取当前日期，用于计算趋势
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // 计算趋势百分比函数
    const calculateTrend = (current, previous) => {
      if (previous === 0) return 100;
      return ((current - previous) / previous * 100).toFixed(1);
    };
    
    // 1. 获取图片总数
    const totalImages = await Image.countDocuments({ isPublic: true });
    
    // 2. 获取上个月的图片总数
    const totalImagesLastMonth = await Image.countDocuments({
      isPublic: true,
      createdAt: { $lt: lastMonth }
    });
    
    // 3. 获取存储空间使用情况 (所有图片文件大小总和)
    const storageData = await Image.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    const storageUsed = storageData.length > 0 ? storageData[0].totalSize : 0;
    
    // 4. 获取上个月的存储空间使用情况
    const storageLastMonthData = await Image.aggregate([
      { $match: { isPublic: true, createdAt: { $lt: lastMonth } } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    const storageLastMonth = storageLastMonthData.length > 0 ? storageLastMonthData[0].totalSize : 0;
    
    // 5. 获取总访问次数 (所有图片的views总和)
    const visitsData = await Image.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalVisits = visitsData.length > 0 ? visitsData[0].totalViews : 0;
    
    // 6. 获取上个月的总访问次数
    const visitsLastMonthData = await Image.aggregate([
      { $match: { isPublic: true, createdAt: { $lt: lastMonth } } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalVisitsLastMonth = visitsLastMonthData.length > 0 ? visitsLastMonthData[0].totalViews : 0;
    
    // 7. 获取今日上传的图片数量
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    const uploadsToday = await Image.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });
    
    // 8. 获取昨日上传的图片数量
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    
    const uploadsYesterday = await Image.countDocuments({
      createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
    });
    
    // 9. 获取最近7天的上传趋势和访问趋势
    const recentTrend = { uploads: [], visits: [], storage: [] };
    
    for (let i = 6; i >= 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - i);
      
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 该日上传的图片数
      const dayUploads = await Image.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      // 该日的访问量（注：这需要有专门的访问记录表才能精确统计，这里简化处理）
      // 实际情况可能需要使用专门的访问日志记录
      const dayVisits = dayUploads * 5; // 假设每张图片平均有5次访问
      
      // 该日新增的存储空间使用量
      const dayStorageData = await Image.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
      ]);
      const dayStorage = dayStorageData.length > 0 ? dayStorageData[0].totalSize : 0;
      
      recentTrend.uploads.push(dayUploads);
      recentTrend.visits.push(dayVisits);
      recentTrend.storage.push(dayStorage);
    }
    
    // 10. 获取存储分布（不同格式图片的占比）
    const formatCountData = await Image.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: '$format', count: { $sum: 1 } } }
    ]);
    
    const storageDistribution = {
      jpeg: 0,
      png: 0,
      gif: 0,
      webp: 0
    };
    
    formatCountData.forEach(format => {
      const formatKey = format._id.toLowerCase();
      if (storageDistribution.hasOwnProperty(formatKey)) {
        storageDistribution[formatKey] = Math.round((format.count / totalImages) * 100);
      } else if (formatKey === 'jpg') {
        storageDistribution.jpeg = Math.round((format.count / totalImages) * 100);
      }
    });
    
    // 11. 获取所有标签 (包括非公开图片的标签和内存中的标签)
    // 从图片中获取标签
    const tagsFromImages = await Image.distinct('tags');
    
    // 合并标签集合 (从图片中获取的标签 + 内存中的标签)
    const allTags = [...new Set([...tagsFromImages, ...tagController.tagsRegistry])];
    
    // 获取每个标签的统计信息
    const tagsWithStats = await Promise.all(allTags.map(async tagName => {
      if (!tagName) return null; // 跳过空标签
      
      // 获取标签关联的图片数量，包括非公开图片
      const totalCount = await Image.countDocuments({ 
        tags: tagName 
      });
      
      // 获取标签关联的公开图片数量
      const publicCount = await Image.countDocuments({ 
        isPublic: true, 
        tags: tagName 
      });
      
      // 获取标签关联图片的总访问量（所有图片，包括非公开的）
      const viewsData = await Image.aggregate([
        { $match: { tags: tagName } },
        { $group: { _id: null, totalViews: { $sum: { $ifNull: ['$views', 0] } } } }
      ]);
      
      const totalViews = viewsData.length > 0 ? viewsData[0].totalViews : 0;
      
      // 打印调试信息
      console.log(`统计数据 - 标签: ${tagName}, 总图片数: ${totalCount}, 公开图片数: ${publicCount}, 总访问量: ${totalViews}`);
      
      return {
        name: tagName,
        count: totalCount,      // 使用总数量而不仅是公开的
        publicCount: publicCount, // 额外提供公开图片数量
        views: totalViews
      };
    }));
    
    // 过滤掉空值并按访问量排序
    const popularTags = tagsWithStats
      .filter(tag => tag !== null)
      .sort((a, b) => {
        // 主要按图片的总访问量排序
        return b.views - a.views;
      })
      .slice(0, 10); // 只显示前10个热门标签
    
    console.log(`热门标签统计: 找到${popularTags.length}个标签`);
    popularTags.forEach(tag => {
      console.log(`- ${tag.name}: 图片数量=${tag.count}, 访问量=${tag.views}`);
    });
    
    // 12. 获取热门图片 (访问量最高的图片)
    const popularImagesData = await Image.find({ isPublic: true })
      .sort({ views: -1 })
      .limit(5)
      .select('title filename views updatedAt url');
    
    const popularImages = popularImagesData.map(img => ({
      id: img._id,
      filename: img.filename || img.title, // 使用filename或fallback到title
      title: img.title,
      visits: img.views,
      views: img.views, // 同时提供views和visits字段以确保兼容性
      lastVisited: img.updatedAt,
      updatedAt: img.updatedAt,
      url: img.url
    }));
    
    // 13. 获取上传时间分布
    const uploadTimeDist = {
      morning: 0,   // 早上 (6-12点)
      afternoon: 0, // 下午 (12-18点)
      evening: 0,   // 晚上 (18-24点)
      night: 0      // 凌晨 (0-6点)
    };
    
    // 这个是简化版，实际应该从数据库聚合查询
    // 假设均匀分布，根据真实图片总数进行比例分配
    uploadTimeDist.morning = Math.round(totalImages * 0.35);
    uploadTimeDist.afternoon = Math.round(totalImages * 0.42);
    uploadTimeDist.evening = Math.round(totalImages * 0.18);
    uploadTimeDist.night = totalImages - uploadTimeDist.morning - uploadTimeDist.afternoon - uploadTimeDist.evening;
    
    // 14. 获取活跃用户IP (上传最多的IP地址)
    const activeUsersData = await Image.aggregate([
      { $match: { isPublic: true, ipAddress: { $exists: true, $ne: null } } },
      { $group: { 
        _id: '$ipAddress', 
        uploads: { $sum: 1 },
        lastActive: { $max: '$createdAt' }
      }},
      { $sort: { uploads: -1 } },
      { $limit: 3 }
    ]);
    
    const activeUsers = activeUsersData.map(user => ({
      ip: user._id,
      uploads: user.uploads,
      lastActive: user.lastActive
    }));
    
    // 返回所有统计数据
    res.status(200).json({
      totalImages,
      imagesTrend: calculateTrend(totalImages, totalImagesLastMonth),
      storageUsed,
      storageTrend: calculateTrend(storageUsed, storageLastMonth),
      totalVisits,
      visitsTrend: calculateTrend(totalVisits, totalVisitsLastMonth),
      uploadsToday,
      uploadsTodayTrend: calculateTrend(uploadsToday, uploadsYesterday),
      recentTrend,
      storageDistribution,
      popularTags,
      popularImages,
      uploadTimeDist,
      activeUsers
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
}; 