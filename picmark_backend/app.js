const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
require('dotenv').config();

// 导入路由
const imageRoutes = require('./routes/image.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const folderRoutes = require('./routes/folder.routes');
const tagRoutes = require('./routes/tag.routes');
const proxyRouter = require('./routes/proxy');  // 添加代理路由
const apiRoutes = require('./routes/api.routes'); // 导入API路由

const app = express();

// 设置CORS
app.use(cors());

// 请求日志
app.use(morgan('dev'));

// 解析JSON请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 使用路由
app.use('/api', apiRoutes); // 使用API路由
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/token', uploadRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/proxy', proxyRouter);  // 注册代理路由

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'PicMark API 服务器运行中'
  });
});

// 处理404错误
app.use((req, res) => {
  res.status(404).json({
    message: '找不到请求的资源'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app; 