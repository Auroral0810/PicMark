const express = require('express');
const router = express.Router();
const imageRoutes = require('./image.routes');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');
const tokenController = require('../controllers/tokenController');
const imageController = require('../controllers/imageController');
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// 公开路由
// 上传凭证
router.get('/token', tokenController.getToken);
// 图片搜索
router.get('/images/search', imageController.searchImages);

// 设置API - 特定路由必须放在通用路由前面
// 测试七牛云连接
router.post('/settings/qiniu/test', settingsController.testQiniuConnection);
// 通用设置路由
router.get('/settings/:type', settingsController.getSettings);
router.post('/settings/:type', settingsController.saveSettings);

// 需要认证的路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/images', imageRoutes);

module.exports = router; 