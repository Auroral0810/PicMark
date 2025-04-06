FROM node:18-alpine

# 创建工作目录
WORKDIR /app

# 安装构建工具和健康检查所需的wget
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    wget

# 设置npm配置
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retries 3

# 首先只复制package.json和package-lock.json
COPY package*.json ./

# 设置环境变量，避免使用预编译的bcrypt
ENV BCRYPT_FORCE_REBUILD=1
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# 安装依赖（包括必需的axios模块）
RUN npm install --only=production && \
    npm install axios && \
    npm cache clean --force

# 复制源代码
COPY . .

# 创建日志和上传目录
RUN mkdir -p logs uploads && \
    chmod -R 755 logs uploads

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "index.js"]
