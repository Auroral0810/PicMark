# PicMark 图床后端

PicMark 是一个基于七牛云存储的图片管理系统后端，提供图片上传、管理、分享等功能。

## 功能特点

- 基于七牛云的图片存储
- 用户认证与授权
- 图片上传、删除、更新
- 图片分类与标签管理
- 图片点赞与浏览量统计
- RESTful API

## 技术栈

- Node.js
- Express
- MongoDB (Mongoose)
- JWT认证
- 七牛云存储
- Docker

## 项目设置

### 环境要求

- Node.js 14+
- MongoDB 4.4+
- 七牛云账号和存储空间

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件并配置以下环境变量：

```
# 服务器配置
PORT=5000
NODE_ENV=development

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/picmark

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 七牛云配置
QINIU_ACCESS_KEY=your_qiniu_access_key
QINIU_SECRET_KEY=your_qiniu_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=your_qiniu_domain
QINIU_REGION=z2  # 华南区
```

### 启动开发服务器

```bash
npm run dev
```

### 生产环境部署

使用 Docker Compose 部署：

```bash
docker-compose up -d
```

## API文档

### 认证相关

- POST `/api/auth/register` - 注册新用户
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/me` - 获取当前用户信息
- PUT `/api/auth/password` - 修改密码

### 用户相关

- PUT `/api/users/profile` - 更新用户资料

### 图片相关

- GET `/api/images/token` - 获取上传凭证
- GET `/api/images` - 获取图片列表
- POST `/api/images` - 保存图片信息
- GET `/api/images/:id` - 获取单张图片
- PUT `/api/images/:id` - 更新图片信息
- DELETE `/api/images/:id` - 删除图片
- POST `/api/images/:id/like` - 点赞/取消点赞

## 前端集成

前端与后端交互的主要流程：

1. **上传流程**：
   - 前端调用 `/api/images/token?filename=example.jpg` 获取上传凭证
   - 使用返回的 token 和 key 直接上传到七牛云
   - 上传成功后，将七牛云返回的信息发送到 `/api/images` 保存元数据

2. **图片获取流程**：
   - 前端调用 `/api/images?page=1&limit=20` 获取分页图片列表
   - 使用返回的 url 字段显示图片

3. **图片管理流程**：
   - 更新图片信息：调用 PUT `/api/images/:id`
   - 删除图片：调用 DELETE `/api/images/:id`
   - 点赞/取消点赞：调用 POST `/api/images/:id/like`

## 许可证

[MIT](LICENSE) 