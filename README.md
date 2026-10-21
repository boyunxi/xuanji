# 璇玑 · 游戏运营后台 (Xuanji Operations)

以东方古风美学为底色、采用 **React 19 + Go 1.26** 全栈架构打造的游戏精细化运营管理平台。支持通过可插拔驱动网关无缝接入 **Cocos2d-x (C++/JS)、Cocos Creator、Unity** 等客户端引擎配合 **纯 Go 高并发逻辑服集群**。

---

## 🎨 美学设计与核心功能特性

- **东方传统美学设计**：
  - **宣纸底色与竹青深黛**：主色调采用沉稳的竹青色（`#1c352f` / `#2d5d4c`）与柔和的仿宣纸背景（`#f6f5f0`）。
  - **朱砂篆刻印章**：侧边栏与标题采用朱红印章 Logo（"璇" 字）点缀。
  - **水墨山峦剪影**：侧边栏底部绘制层峦叠嶂的矢量水墨山水。
  - **宋体 / 楷体雅致排版**：辅以古风楹联词句（*“知微见著 · 运筹有度”*），严控全局表格单元格单行防换行。
- **全栈前后端解耦与统一托管**：
  - **前端**：React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons。
  - **后端**：Go 1.26 原生高性能 HTTP 服务，支持 PostgreSQL 16 持久化与 Redis 8 缓存加速，兼备零依赖本地秒级冷启动。
- **十全精细化运营模块**：
  1. **运营总览**：多区服（山海长歌、九州志、云间录）与多周期（今日、近7日、近30日）关键 KPI 指标（活跃玩家、新增玩家、营收总额、次留）、平滑贝塞尔活跃趋势折线图、环形营收构成、待办与实时流水。
  2. **玩家管理**：
     - **标签与运营备注**：支持「修仙榜首」、「大R道友」、「活跃帮主」、「重点监控」等印泥色标与自由备注。
     - **智能置顶算法**：拥有标签的玩家实时自动置顶到表格最上一行，金色 Pin 标识与高光饰边。
     - **状态与抽屉**：玩家快捷封禁/解封、侧边抽屉明细追踪。
  3. **活动管理**：活动周期展示、精细化起止日期配置、活动实时开关、活动进度重置与全服活动数据清空。
  4. **商城管理**：游戏道具上下架、元宝/灵石定价维护、限购类型、热销标签管理与实时状态切换。
  5. **双重日志模块**：
     - **操作日志**：追踪运营执事后台 GM、封禁、发信等操作审计。
     - **游戏日志**：按区服、事件分类（升级/掉落/消耗/充值）、玩家 ID、关卡深度检索。
  6. **补偿信函（邮件系统）**：支持全服通告与定向补偿邮件，可批量打包道具/元宝附件，支持紧急撤回与领取统计。
  7. **卡密与礼包码 (CDKey)**：通用兑换码与唯一独占卡密批量生成、一键导出 CSV、严格核销防刷与兑换流水审计。
  8. **GM 控制台**：定向资源补发、全服紧急金/红字跑马灯、控制台指令执行。
  9. **充值订单**：多支付渠道交易追踪、订单状态流转与导出。
  10. **报表与系统设置**：大屏分析报表 CSV 导出、全局 `Ctrl + K` 搜索、消息通知中心。

---

## 📁 项目结构

```text
xuanji/
├── backend/                  # Go 后端工程
│   ├── cmd/server/main.go    # HTTP 启动入口、CORS 中间件、SPA 托管
│   ├── internal/
│   │   ├── auth/             # 基于 Token 的运营执事鉴权模块
│   │   ├── gameserver/       # 游戏服网关驱动 (HTTP, Redis, Hybrid, Mock)
│   │   ├── handler/          # RESTful API 路由与处理器
│   │   ├── model/            # 核心业务数据实体模型
│   │   └── store/            # 数据库持久化、缓存与统计引擎
│   ├── data/                 # 本地持久化数据目录
│   └── go.mod
├── frontend/                 # React 前端工程 (模块化架构)
│   ├── src/
│   │   ├── types/            # 领域数据模型与通用类型定义
│   │   ├── constants/        # 导航菜单、游戏列表与选项常量
│   │   ├── styles/           # 模块化古风样式系统
│   │   ├── components/       # 抽屉、弹窗、图表、布局组件
│   │   ├── views/            # 各业务视图页面 (Overview, Players, Shop, Logs 等)
│   │   └── App.tsx           # 顶层状态编排控制器
│   ├── vite.config.ts        # Vite 配置 (内置 /api 反向代理)
│   └── package.json
├── docs/
│   └── GAME_SERVER_INTEGRATION.md # 真实游戏服接入与 Cocos2d-x + Go 全套技术指南
└── README.md                 # 项目总览文档
```

---

## 🚀 跨平台快速启动指南

> **关于脚本的说明**：为保障 Windows 开发环境的整洁与跨平台兼容性，**本仓库不跟踪上传 `.sh` 文件**。无论您使用的是 **Windows (CMD / PowerShell)** 还是 **Linux / macOS / WSL**，均可直接运行以下命令或直接复制代码创建脚本。

### 方式 A：无脚本快速运行（Windows / Linux / macOS 通用）

#### 1. 构建前端静态资源
```bash
cd frontend
pnpm install
pnpm build
cd ..
```

#### 2. 启动 Go 全栈后端（直接托管前端与全部 API）
```bash
cd backend
go run cmd/server/main.go
```

打开浏览器访问：**`http://localhost:8080`**  
默认管理员账号：**`admin`**，密码：**`xuanji2026`**

---

### 方式 B：Windows 原生批处理 (`start.bat`)

在项目根目录新建文本文件 `start.bat`，粘贴以下内容并保存，之后双击即可一键拉起：

```bat
@echo off
chcp 65001 >nul
echo =====================================================
echo    璇 玑 · 游 戏 运 营 后 台 (Xuanji Operations)
echo    Windows 统一全栈启动中...
echo =====================================================

:: 1. 检查前端产物
if not exist "frontend\dist\index.html" (
    echo ▶ 首次运行，正在构建前端静态页面...
    cd frontend
    call pnpm build
    cd ..
)

:: 2. 编译并启动后端
cd backend
go build -o bin\server.exe ./cmd/server
echo.
echo ✔ 服务启动成功，请访问: http://localhost:8080
echo ✔ 默认账号: admin   密码: xuanji2026
echo.
bin\server.exe
pause
```

---

### 方式 C：Windows PowerShell (`start.ps1`)

在 PowerShell 中执行以下命令可直接启动（支持端口防冲突与开发模式）：

```powershell
# 普通全栈模式 (端口 8080)
cd backend; go run cmd/server/main.go

# 或者前后端联调模式 (前端 5173 + 后端 8080)
# 终端 1 启动后端:
cd backend; go run cmd/server/main.go

# 终端 2 启动前端热重载:
cd frontend; pnpm dev
```

---

### 方式 D：Linux / macOS / WSL 命令行一键拉起

在 Linux / WSL 终端执行：

```bash
# 释放 8080 端口（若有残留）
lsof -ti :8080 | xargs kill -9 2>/dev/null || true

# 编译并启动
cd frontend && pnpm build && cd ../backend
go run cmd/server/main.go
```

---

## 🔐 默认管理员凭据与配置

| 配置项 | 环境变量键名 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| **管理员令号** | `AUTH_USERNAME` | `admin` | 运营后台登录账号 |
| **鉴权密钥** | `AUTH_PASSWORD` | `xuanji2026` | 运营后台登录密码 |
| **监听端口** | `PORT` | `8080` | 统一全栈服务端口 |
| **PostgreSQL** | `PG_HOST` / `PG_USER` | `127.0.0.1` / `xuanji` | 本地数据库服务（可选） |
| **Redis** | `REDIS_ADDR` | `127.0.0.1:6379` | 缓存与广播总线（可选） |

> 配置可在根目录 [`.env`](file:///home/boyunxi/code/xuanji/.env)（参考模板 [`.env.example`](file:///home/boyunxi/code/xuanji/.env.example)）中进行自定义。

---

## 🎮 真实游戏服务器 (Go) 与 Cocos2d-x 客户端接入

璇玑运营平台支持无缝对接外部真实的商业级网络游戏服，特别是 **Cocos2d-x (C++ / JS) / Cocos Creator 客户端 + 纯 Go 游戏逻辑服** 架构。

详细技术指南请查阅：
📖 **[真实游戏服务器与 Cocos2d-x + 纯 Go 服务端接入技术指南 (docs/GAME_SERVER_INTEGRATION.md)](file:///home/boyunxi/code/xuanji/docs/GAME_SERVER_INTEGRATION.md)**

该文档全面包含：
1. **零侵入解耦架构**：Cocos2d-x 客户端无需嵌入运营 SDK，正常监听游戏协议；Go 游戏服作为中枢中转璇玑指令。
2. **7 大 GM 接口规范**：踢人下线、发道具/元宝、账号封禁/解封、跑马灯广播、全服邮件派发、自定义控制台指令。
3. **安全机制**：HMAC-SHA256 签名计算、时间戳防重放、`requestId` 幂等防刷锁。
4. **代码范例**：
   - 纯 Go 游戏服端完整可运行的 GM 网关实现；
   - Cocos2d-x (C++) 客户端协议监听与飘字动效；
   - Cocos Creator (TypeScript) 客户端监听与弹窗分发。
5. **多区服分流路由**：通过 `GAME_SERVER_SERVERS_JSON` 环境变量实现多节点物理机路由分发。
6. **自检 Ping 探针**：一键端到端探测真实物理机节点的连通性与网络延迟。
