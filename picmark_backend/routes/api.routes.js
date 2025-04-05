const express = require('express');
const imageRoutes = require('./image.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const folderRoutes = require('./folder.routes');
const tagRoutes = require('./tag.routes');
const statisticsController = require('../controllers/statisticsController');

const router = express.Router();

// 重定向到API文档页面
router.get('/', (req, res) => {
  res.redirect('/docs');
});

// 使用特定的路由
router.use('/images', imageRoutes);
router.use('/users', userRoutes);
router.use('/token', uploadRoutes);
router.use('/folders', folderRoutes);
router.use('/tags', tagRoutes);

// 添加统计API路由，使用统计控制器获取真实数据
router.get('/statistics', statisticsController.getStatistics);

module.exports = router; 