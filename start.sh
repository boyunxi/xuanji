#!/usr/bin/env bash
set -e

# ==============================================================================
#  璇玑 · 古风游戏运营后台 (Xuanji Operations)
#  React 19 + Go 1.26 全栈一键启动脚本
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# 加载 NVM 环境（若存在）
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  \. "$NVM_DIR/nvm.sh"
fi

MODE="${1:-prod}"

cleanup() {
  echo ""
  echo "正在停止「璇玑」运营后台服务..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "====================================================="
echo "        璇 玑 · 游 戏 运 营 后 台 (Xuanji)          "
echo "        古风美学设计 · React + Go 全栈实现           "
echo "====================================================="

# 1. 编译 Go 后端
echo "▶ 编译 Go 后端服务..."
cd "$BACKEND_DIR"
go build -o "$BACKEND_DIR/bin/server" ./cmd/server
echo "✔ Go 后端编译完成"

if [ "$MODE" = "dev" ] || [ "$MODE" = "--dev" ]; then
  echo "▶ 启动模式: [开发联调模式] (Vite Dev Server + Go API)"
  echo ""

  # 启动 Go 后端 (8080)
  cd "$BACKEND_DIR"
  ./bin/server &
  GO_PID=$!

  # 等待后端就绪
  sleep 1

  # 启动 Vite 前端 (5173)
  cd "$FRONTEND_DIR"
  echo "▶ 启动前端 Vite 调试服务器 (带 API 反向代理)..."
  pnpm dev --host 0.0.0.0 --port 5173 &
  VITE_PID=$!

  echo ""
  echo "====================================================="
  echo " ✔ 前端开发页面: http://localhost:5173"
  echo " ✔ Go 后端服务:   http://localhost:8080"
  echo " ✔ API 健康检查:  http://localhost:8080/api/health"
  echo " (按 Ctrl+C 可同时停止所有服务)"
  echo "====================================================="

  wait
else
  echo "▶ 启动模式: [统一全栈服务] (Go 直接托管 React 前端与 API)"
  echo ""

  # 检查是否已有 dist，若没有则构建
  if [ ! -d "$FRONTEND_DIR/dist" ]; then
    echo "▶ 首次运行，正在构建前端静态资源..."
    cd "$FRONTEND_DIR"
    pnpm build
  fi

  cd "$BACKEND_DIR"
  export STATIC_DIR="$FRONTEND_DIR/dist"
  echo ""
  echo "====================================================="
  echo " ✔ 访问地址:     http://localhost:8080"
  echo " ✔ 统一服务端口: 8080 (静态页面 + RESTful API)"
  echo " (按 Ctrl+C 可停止服务)"
  echo "====================================================="
  ./bin/server
fi
