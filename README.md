# 璇玑 · 游戏运营后台 (Xuanji Operations)

以东方古风美学为底色、采用 **React 19 + Go 1.26** 全栈架构打造的游戏精细化运营管理平台。

---

## 🎨 美学设计与功能特性

- **东方传统美学设计**：
  - **宣纸底色与竹青深黛**：主色调采用沉稳的竹青色（`#1c352f` / `#2d5d4c`）与柔和的仿宣纸背景（`#f6f5f0`）。
  - **朱砂篆刻印章**：侧边栏与标题采用朱红印章 Logo（"璇" 字）点缀。
  - **水墨山峦剪影**：侧边栏底部绘制层峦叠嶂的矢量水墨山水。
  - **宋体 / 楷体雅致排版**：辅以古风楹联词句（*“知微见著 · 运筹有度”*）。
- **全栈前后端解耦与统一托管**：
  - **前端**：React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons。
  - **后端**：Go 1.26 原生高性能 HTTP 服务，采用线程安全文件持久化存储（`data/xuanji_data.json`），无外部重量级依赖，秒级冷启动。
- **八大核心运营模块**：
  1. **运营总览**：多游戏（山海长歌、九州志、云间录）与多周期（今日、近7日、近30日）关键 KPI 指标（活跃玩家、新增玩家、营收总额、次留）、分时/每日平滑贝塞尔活跃趋势折线图、环形营收构成、待办事项与实时日志。
  2. **玩家管理**：玩家检索、游戏筛选、等级与累计充值展示、侧边抽屉详情、账号一键封禁与解封（状态实时入库）。
  3. **活动管理**：活动周期展示、参与人数统计、新建活动弹窗（支持开始与结束日期计算）、活动状态一键开启/结束。
  4. **公告管理**：多服公告起草、富文本摘要、正式发布与撤回为草稿、公告删除。
  5. **GM 工具（新增）**：
     - **道具/货币补发**：定向向指定玩家发放元宝、灵石、突破丹等资源，记录发放原因。
     - **全服即时跑马灯**：向在线玩家下发金字/红字紧急与系统广播。
     - **快捷运维指令**：一键配表热重载、踢异常玩家下线、清空 Redis 跨服缓存、维护白名单模式切换。
     - **审计日志**：严格的 GM 操作流水，记录时间、操作人、目标与执行状态。
  6. **充值订单**：多支付渠道（微信/支付宝）交易追踪、订单状态流转（处理中/成功/已退款）、订单详情与核对确认、CSV 导出。
  7. **数据报表**：关键指标汇总与大屏活跃趋势分析，支持一键导出 UTF-8 CSV 报表。
  8. **系统设置**：每日简报、异常订单提醒、活动上线提醒开关持久化。
- **双重折叠侧边栏交互（新增）**：
  - **整栏折叠/展开**：点击侧栏顶端「收起侧栏」按钮，侧栏可平滑在完整模式（246px）与精简图标模式（70px）间切换，主内容区自适应平滑跟随。
  - **分组子菜单折叠/展开**：各分组标题（如「运营管理」、「数据中心」等）自带旋转折叠箭头，点击可独立折叠收起其下属子菜单（例如折叠收起玩家管理、GM工具等）。
- **全局 Command Palette 搜索**：快捷键 `Ctrl + K` 随时唤出，直通模块、玩家与活动。
- **消息通知中心**：未读消息气泡、标记已读、直达关联运营页面。
- **弹窗背景滚动锁定**：侧栏抽屉或任何弹窗打开时锁定主页面背景滚动，避免滚动穿透。

---

## 📁 项目结构

```text
xuanji/
├── backend/                  # Go 后端工程
│   ├── cmd/server/main.go    # HTTP 启动入口、CORS 中间件、SPA 托管
│   ├── internal/
│   │   ├── handler/          # RESTful API 路由与处理器
│   │   ├── model/            # 核心业务数据实体模型
│   │   └── store/            # 线程安全文件持久化数据存储与统计引擎
│   ├── data/                 # 持久化数据目录 (xuanji_data.json)
│   ├── bin/server            # 编译后的 Go 可执行文件
│   └── go.mod
├── frontend/                 # React 前端工程 (模块化架构)
│   ├── src/
│   │   ├── types/            # 领域数据模型与通用类型定义
│   │   ├── constants/        # 导航菜单、游戏列表与选项常量
│   │   ├── utils/            # 格式化函数 (数值、金额、日期、CSV导出)
│   │   ├── api/              # Go 后端 RESTful API 强类型客户端
│   │   ├── components/
│   │   │   ├── common/       # 通用组件 (TableToolbar, Drawer, GameSelect 等)
│   │   │   ├── charts/       # 数据可视化组件 (MetricStrip, TrendChart 等)
│   │   │   ├── layout/       # 框架布局组件 (Sidebar, Topbar, 水墨背景)
│   │   │   └── modals/       # 模态与浮层组件 (Ctrl+K 搜索, 抽屉详情, 新建弹窗)
│   │   ├── views/            # 业务视图页面 (Overview, Players, Events 等)
│   │   ├── App.tsx           # 顶层状态编排控制器
│   │   ├── index.css         # 古风设计系统与 Tailwind 样式
│   │   └── main.tsx          # React 挂载入口
│   ├── dist/                 # 前端打包产物 (供 Go 直接托管)
│   ├── vite.config.ts        # Vite 配置 (内置 /api 反向代理)
│   └── package.json
├── start.sh                  # 一键启动脚本 (支持统一托管与开发联调两种模式)
└── README.md                 # 项目文档
```

---

## 🚀 快速启动

在 WSL 环境或 Linux 终端中运行：

### 模式一：统一全栈模式（推荐直接查看效果）

只需启动一个端口（`8080`），Go 后端同时托管前端页面与所有 API：

```bash
./start.sh
```

打开浏览器访问：**`http://localhost:8080`**

### 模式二：前端开发联调模式（支持热重载）

同时启动 Go 后端（`8080`）与 Vite 前端热更新服务器（`5173`，自动代理 API）：

```bash
./start.sh dev
```

打开浏览器访问：**`http://localhost:5173`**

---

## 📡 RESTful API 接口速览

| 请求方法 | 接口路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/health` | 服务健康检查 |
| `GET` | `/api/overview` | 运营总览数据（KPI 指标、趋势图、营收构成、待办与动态） |
| `GET` | `/api/players` | 玩家列表（支持 `game`, `status`, `query` 检索） |
| `PATCH` | `/api/players/{id}/status` | 封禁或解封玩家账号 |
| `GET` | `/api/events` | 活动列表 |
| `POST` | `/api/events` | 创建新活动 |
| `PATCH` | `/api/events/{id}/status` | 开启或结束活动 |
| `GET` | `/api/announcements` | 公告列表 |
| `POST` | `/api/announcements` | 起草新公告 |
| `PATCH` | `/api/announcements/{id}/status` | 发布或撤回公告 |
| `DELETE` | `/api/announcements/{id}` | 删除公告 |
| `GET` | `/api/orders` | 充值订单列表 |
| `PATCH` | `/api/orders/{id}/status` | 确认订单支付成功 |
| `GET` | `/api/orders/export` | 导出订单 CSV |
| `GET` | `/api/reports` | 运营报表分析数据 |
| `GET` | `/api/reports/export` | 导出报表 CSV |
| `GET` | `/api/notices` | 获取系统通知列表 |
| `PATCH` | `/api/notices/read-all` | 全部通知标记已读 |
| `PATCH` | `/api/notices/{id}/read` | 单条通知标记已读 |
| `GET` | `/api/settings` | 获取系统设置 |
| `POST` | `/api/settings` | 保存系统设置 |
| `GET` | `/api/search?q={query}` | 全局 Command Palette 聚合检索 |
