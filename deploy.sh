#!/bin/bash

# 设置颜色变量
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # 重置颜色

# 输出时间
print_time() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# 成功消息
print_success() {
  echo -e "${GREEN}[成功]${NC} $1"
}

# 错误消息
print_error() {
  echo -e "${RED}[错误]${NC} $1"
}

# 警告消息
print_warning() {
  echo -e "${RED}[警告]${NC} $1"
}

# 检查Docker和Docker Compose是否已安装
check_prerequisites() {
  print_time "检查环境依赖..."
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker未安装，请先安装Docker。"
    exit 1
  fi
  print_success "Docker已安装"
  
  if ! docker compose version &> /dev/null; then
    print_error "Docker Compose未安装或版本过低，请安装Docker Compose V2。"
    exit 1
  fi
  print_success "Docker Compose已安装"
}

# 创建必要目录
create_directories() {
  print_time "创建必要目录..."
  
  mkdir -p picmark_backend/logs
  mkdir -p picmark_backend/uploads
  
  chmod -R 777 picmark_backend/logs
  chmod -R 777 picmark_backend/uploads
  
  print_success "目录创建完成"
}

# 检查是否存在构建问题
check_build_issues() {
  print_time "检查构建环境..."
  
  # 检测当前系统架构
  ARCH=$(uname -m)
  echo "检测到系统架构: $ARCH"
  
  # 询问是否需要清理后端node_modules
  read -p "是否清理后端node_modules目录以解决可能的兼容性问题？(y/n) " CLEAN_MODULES
  
  if [[ "$CLEAN_MODULES" == "y" || "$CLEAN_MODULES" == "Y" ]]; then
    print_time "清理后端node_modules目录..."
    
    if [ -d "picmark_backend/node_modules" ]; then
      rm -rf picmark_backend/node_modules
      print_success "已清理node_modules目录"
    else
      print_warning "node_modules目录不存在，无需清理"
    fi
  fi
}

# 停止并移除旧容器
clean_old_containers() {
  print_time "清理旧容器..."
  
  docker compose down --remove-orphans
  
  print_success "旧容器已清理"
}

# 构建并启动容器
build_and_start() {
  print_time "构建并启动容器..."
  
  # 使用--build参数确保重新构建镜像
  docker compose up -d --build
  
  if [ $? -eq 0 ]; then
    print_success "容器已成功启动"
  else
    print_error "容器启动失败"
    exit 1
  fi
}

# 检查服务健康状态
check_services() {
  print_time "检查服务状态..."
  sleep 15
  
  # 检查MongoDB
  if docker compose ps mongodb | grep -q "Up"; then
    print_success "MongoDB服务运行正常"
  else
    print_error "MongoDB服务启动失败"
  fi
  
  # 检查后端
  if docker compose ps backend | grep -q "Up"; then
    print_success "后端服务运行正常"
    
    # 进一步检查后端健康状态
    sleep 5
    if curl -s http://localhost:3000/api 2>&1 | grep -q "PicMark API"; then
      print_success "后端API可访问"
    else
      print_warning "后端API可能无法访问，请检查日志"
      docker compose logs backend | tail -n 30
    fi
  else
    print_error "后端服务启动失败"
    echo "查看后端日志获取详细错误:"
    docker compose logs backend | tail -n 30
  fi
  
  # 检查前端
  if docker compose ps frontend | grep -q "Up"; then
    print_success "前端服务运行正常"
  else
    print_error "前端服务启动失败"
  fi
}

# 显示服务访问信息
show_access_info() {
  print_time "服务已启动，可通过以下方式访问:"
  
  # 获取当前主机IP
  if [[ "$(uname)" == "Darwin" ]]; then
    # MacOS
    HOST_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
  else
    # Linux
    HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
  fi
  
  if [ -z "$HOST_IP" ] || [ "$HOST_IP" == " " ]; then
    HOST_IP="localhost"
  fi
  
  echo -e "- 前端应用: ${GREEN}http://$HOST_IP${NC}"
  echo -e "- 后端API: ${GREEN}http://$HOST_IP:3000/api${NC}"
  echo -e "- MongoDB: ${GREEN}mongodb://$HOST_IP:27017/picmark${NC}"
  
  echo -e "\n使用以下命令查看日志:"
  echo -e "- 前端日志: ${BLUE}docker compose logs -f frontend${NC}"
  echo -e "- 后端日志: ${BLUE}docker compose logs -f backend${NC}"
  echo -e "- 数据库日志: ${BLUE}docker compose logs -f mongodb${NC}"
}

# 执行主程序
main() {
  echo -e "\n${BLUE}=============== PicMark 部署脚本 ===============${NC}\n"
  
  check_prerequisites
  check_build_issues
  create_directories
  clean_old_containers
  build_and_start
  check_services
  show_access_info
  
  echo -e "\n${GREEN}=============== 部署完成 ===============${NC}\n"
}

# 执行主程序
main 