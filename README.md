# PowerConnect

远程控制家用电脑终端 + 文件管理系统

一个功能完整的远程终端和文件管理解决方案，支持多终端会话、文件浏览下载，移动端友好。

## 特性

- 🖥️ **多终端会话**：同时开启多个终端，随时切换
- 📁 **文件管理**：浏览目录、下载文件、查看文件信息
- 🔐 **安全认证**：JWT 令牌认证，路径安全限制
- 📱 **移动端友好**：完全适配手机浏览器（Safari/Chrome）
- 🚀 **高性能**：基于 WebSocket 的实时终端通信
- 🎨 **简洁界面**：清晰易用的 UI 设计

## 技术栈

### 后端
- Node.js + TypeScript
- Fastify（Web 框架）
- node-pty（终端模拟）
- WebSocket（实时通信）
- JWT（认证）

### 前端
- React + TypeScript
- Vite（构建工具）
- xterm.js（终端组件）
- React Router（路由）

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，设置你的配置：

```env
PORT=3000
HOST=0.0.0.0

# 重要：修改这些安全配置！
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
USERNAME=your-username
PASSWORD=your-strong-password

# 文件系统根目录（默认为用户主目录）
FS_ROOT_DIR=/home/youruser

# 终端会话超时（分钟）
SESSION_TIMEOUT=30
```

### 3. 开发模式运行

```bash
# 终端 1：启动后端
cd backend
npm run dev

# 终端 2：启动前端
cd frontend
npm run dev
```

然后访问 http://localhost:5173

### 4. 生产环境部署

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build

# 启动服务（使用 pm2）
npm install -g pm2
pm2 start ecosystem.config.js

# 查看日志
pm2 logs powerconnect

# 查看状态
pm2 status
```

## 项目结构

```
PowerConnect/
├── backend/                # 后端代码
│   ├── src/
│   │   ├── config/        # 配置管理
│   │   ├── middleware/    # 中间件（认证）
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── types/         # TypeScript 类型
│   │   ├── server.ts      # 服务器配置
│   │   └── index.ts       # 入口文件
│   └── package.json
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   └── styles/        # 样式文件
│   └── package.json
├── README.md              # 本文件
└── DEPLOYMENT.md          # 详细部署文档
```

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - 验证 token

### 终端
- `POST /api/terminal` - 创建新终端
- `DELETE /api/terminal/:sessionId` - 关闭终端
- `GET /api/terminal/list` - 列出所有活动终端
- `WS /ws/terminal/:sessionId` - 终端 WebSocket 连接

### 文件系统
- `GET /api/fs/list?path=/xxx` - 列出目录内容
- `GET /api/fs/download?path=/xxx` - 下载文件
- `POST /api/fs/mkdir` - 创建目录
- `POST /api/fs/delete` - 删除文件/目录
- `POST /api/fs/rename` - 重命名文件/目录
- `GET /api/fs/info?path=/xxx` - 获取文件信息

## 使用说明

### 终端操作

1. **新建终端**：点击 tab 栏右侧的 "+" 按钮
2. **切换终端**：点击对应的 tab
3. **关闭终端**：点击 tab 上的 "×" 按钮
4. **输入命令**：直接在终端中输入，支持中文和复制粘贴

### 文件管理

1. **浏览文件**：点击顶部 "Files" 按钮切换到文件浏览器
2. **进入目录**：点击目录名称
3. **下载文件**：点击文件行的下载按钮（⬇️）
4. **返回上级**：点击 "Up" 按钮或面包屑导航

### 移动端使用

- 界面自动适配手机屏幕
- 支持触摸操作
- 下载的文件可通过系统分享功能发送到微信等 App

## 安全注意事项

⚠️ **重要提示**

1. **修改默认密码**：部署前务必修改 `.env` 中的用户名和密码
2. **使用强密钥**：JWT_SECRET 应至少 32 个字符，随机生成
3. **启用 HTTPS**：生产环境必须使用 HTTPS（见部署文档）
4. **限制访问**：
   - 推荐使用 Tailscale/Zerotier/frp 等内网穿透方案
   - 不建议直接暴露到公网
   - 如必须公网访问，务必配置防火墙限制访问 IP

5. **文件系统限制**：
   - 所有文件操作限制在配置的根目录内
   - 防止路径穿越攻击
   - 建议设置专门的共享目录作为根目录

## 进阶配置

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解：

- Nginx 反向代理配置
- HTTPS 证书申请
- 端口映射设置
- 内网穿透方案
- Systemd 服务配置
- 防火墙配置

## 故障排查

### 无法连接 WebSocket

检查：
1. 后端服务是否正常运行
2. 防火墙是否开放端口
3. 反向代理是否正确配置 WebSocket 支持

### 文件下载失败

检查：
1. 文件路径是否在根目录范围内
2. 文件权限是否正确
3. JWT token 是否有效

### 终端中文乱码

确保：
1. 系统 locale 设置正确（UTF-8）
2. 终端环境变量正确

## 未来扩展

如果要打包成 iOS/Android App：

1. 使用 WebView 加载前端页面
2. 拦截下载请求，调用原生分享功能
3. 可使用 React Native WebView 或 Capacitor

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 致谢

- xterm.js：优秀的终端组件
- node-pty：终端模拟库
- Fastify：高性能 Web 框架
