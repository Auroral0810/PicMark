# 构建阶段
FROM node:18 as build-stage

WORKDIR /app

# 设置npm配置
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retries 3

# 复制包配置文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用（禁用ESLint）
RUN npm run build -- --skip-plugins=eslint

# 生产阶段
FROM nginx:stable as production-stage

# 复制构建结果到Nginx服务目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制自定义Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"] 