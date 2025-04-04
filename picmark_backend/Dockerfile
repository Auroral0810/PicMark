FROM node:16-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

# 创建日志和上传目录
RUN mkdir -p /app/logs /app/uploads

# 设置权限
RUN chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "index.js"]
