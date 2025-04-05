# 🖼️ PicMark

<div align="center">
  <img src="https://img.shields.io/badge/版本-1.0.0-blue.svg" alt="版本" />
  <img src="https://img.shields.io/badge/许可证-MIT-green.svg" alt="许可证" />
  <img src="https://img.shields.io/badge/Node.js-14.x+-yellow.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg" alt="Vue.js" />
</div>

<p align="center">
  <b>PicMark 是一款强大的图片管理平台，提供智能压缩、格式转换和专业水印功能，让您的图片管理体验前所未有的高效与便捷。无论是摄影师、设计师还是内容创作者，PicMark都能满足您的所有图片处理需求。</b>
</p>

---

## ✨ 特点亮点

- 🚀 **智能压缩** - 自动优化图片质量与文件大小的平衡
- 🔄 **格式转换** - 支持JPEG、PNG、WebP等主流格式一键转换
- 💧 **专业水印** - 自定义水印位置、透明度和样式
- 📂 **智能分类** - 自动标签识别和文件夹管理系统
- 🔍 **快速检索** - 强大的搜索功能，轻松找到需要的图片
- 🔗 **便捷分享** - 一键生成分享链接，支持权限控制
- 🌐 **云端同步** - 接入七牛云，数据安全有保障
- 📱 **响应式设计** - 完美适配各种设备屏幕

## 🖥️ 预览展示

![PicMark预览](https://your-preview-image-url.com/preview.png)

## 🛠️ 技术栈

- **前端**: Vue.js 3, Element Plus, Axios
- **后端**: Node.js, Express, MongoDB
- **存储**: 七牛云对象存储
- **部署**: Docker支持

## 🚀 快速开始

### 前置条件

- Node.js (14.x以上)
- MongoDB
- 七牛云账号与存储空间

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/picmark.git
cd picmark
```

#### 2. 后端设置

```bash
cd picmark_backend
npm install
cp .env.example .env    # 配置环境变量
npm start
```

#### 3. 前端设置

```bash
cd picmark_fronted
npm install
npm run serve
```

#### 4. 访问应用

打开浏览器访问 `http://localhost:8080`

## 📝 配置说明

### 七牛云设置

1. 在七牛云控制台创建存储空间
2. 获取AccessKey和SecretKey
3. 在`.env`文件中配置相关参数

```
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=your_bucket_domain
```

### 系统设置

通过管理面板可配置:

- 上传文件大小限制
- 允许的文件类型
- 默认压缩质量
- 水印样式与位置

## 📋 使用指南

### 图片上传

1. 拖拽文件到上传区域或点击选择文件
2. 设置压缩、转换和水印选项
3. 点击上传按钮

### 图片管理

- 创建文件夹组织图片
- 添加标签便于检索
- 调整隐私设置控制访问权限

## 🤝 贡献指南

欢迎提交问题和功能请求。如果您想贡献代码:

1. Fork项目
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 📜 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📧 联系方式

项目作者 - 15968588744@163.com

项目链接: [https://github.com/Auroral0810/picmark](https://github.com/Auroral0810/picmark) 