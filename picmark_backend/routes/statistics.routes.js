const express = require('express');
const router = express.Router();

/**
 * @desc    获取统计数据
 * @route   GET /api/statistics
 * @access  公开
 */
router.get('/', async (req, res) => {
  try {
    // 返回默认统计数据
    return res.status(200).json({
      success: true,
      data: {
        totalImages: 0,
        totalSize: 0,
        formatDistribution: [
          { format: 'JPEG', count: 0, size: 0 },
          { format: 'PNG', count: 0, size: 0 },
          { format: 'GIF', count: 0, size: 0 },
          { format: 'WEBP', count: 0, size: 0 },
          { format: 'SVG', count: 0, size: 0 }
        ],
        uploadTrend: [
          { date: new Date().toISOString().split('T')[0], count: 0 }
        ],
        folderDistribution: [
          { folder: '默认文件夹', count: 0 }
        ]
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

module.exports = router; 