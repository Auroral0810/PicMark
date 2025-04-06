const express = require('express');
const router = express.Router();

/**
 * @desc    获取系统设置
 * @route   GET /api/settings/system
 * @access  公开
 */
router.get('/system', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        type: 'system',
        settings: {
          upload: {
            renameType: 'timestamp',
            maxSize: 10,
            allowedTypesMIME: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
          }
        },
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取系统设置失败',
      error: error.message
    });
  }
});

/**
 * @desc    获取七牛云设置
 * @route   GET /api/settings/qiniu
 * @access  公开
 */
router.get('/qiniu', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        type: 'qiniu',
        settings: {
          domain: process.env.QINIU_DOMAIN || 'example.com',
          bucket: process.env.QINIU_BUCKET || 'picmark',
          accessKey: process.env.QINIU_ACCESS_KEY || '',
          secretKey: process.env.QINIU_SECRET_KEY || '',
          region: process.env.QINIU_REGION || 'z0'
        },
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('获取七牛云设置失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取七牛云设置失败',
      error: error.message
    });
  }
});

module.exports = router; 