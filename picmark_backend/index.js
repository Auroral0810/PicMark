require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

// index.js
const PORT = process.env.PORT || 3000; // 改为3000或其他未被占用的端口

// 连接到MongoDB
connectDB()
  .then(() => {
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('服务器启动失败:', err);
    process.exit(1);
  }); 