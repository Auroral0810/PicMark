const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 引入路由
const apiRoutes = require('./routes/api.routes');
const imageRoutes = require('./routes/image.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const folderRoutes = require('./routes/folder.routes');
const tagRoutes = require('./routes/tag.routes');

const app = express();

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(morgan('dev')); // 日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true }));

// 创建上传目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api', apiRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/token', uploadRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: 'PicMark API 服务运行中' });
});

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: '找不到请求的资源' 
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('API错误:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || '服务器错误',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app; 