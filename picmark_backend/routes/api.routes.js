const express = require('express');
const imageRoutes = require('./image.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const folderRoutes = require('./folder.routes');

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

module.exports = router; 