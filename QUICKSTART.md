# PowerConnect - 快速参考

## 一键安装

```bash
# 运行安装脚本
./setup.sh
```

## 常用命令

### 开发模式

```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动前端
cd frontend
npm run dev
```

访问: http://localhost:5173

### 生产模式

```bash
# 使用 PM2
cd backend
pm2 start ecosystem.config.js

# 查看日志
pm2 logs powerconnect

# 停止服务
pm2 stop powerconnect
```

访问: http://localhost:3000

## 配置文件

`backend/.env`:
```env
PORT=3000
USERNAME=admin
PASSWORD=your-password
JWT_SECRET=your-secret-key
FS_ROOT_DIR=/path/to/root
```

## 安全提示

⚠️ **部署前必改**:
- [ ] 修改 USERNAME 和 PASSWORD
- [ ] 使用强密码（至少 12 位，包含大小写字母、数字、符号）
- [ ] 生产环境启用 HTTPS
- [ ] 考虑使用 Tailscale 等内网穿透

## 功能说明

### 终端
- 新建: 点击 `+` 按钮
- 切换: 点击对应 tab
- 关闭: 点击 tab 上的 `×`

### 文件管理
- 点击 "Files" 按钮切换到文件浏览器
- 点击目录进入
- 点击文件下载

### 手机访问
- 界面自动适配移动端
- 支持 Safari/Chrome
- 可通过系统分享功能发送到微信

## 端口说明

- `3000`: 后端服务（生产模式）
- `5173`: 前端开发服务器（仅开发模式）

## 目录结构

```
PowerConnect/
├── backend/          # 后端
│   ├── src/         # 源代码
│   └── dist/        # 编译输出
├── frontend/        # 前端
│   ├── src/         # 源代码
│   └── dist/        # 构建输出
├── README.md        # 项目说明
├── DEPLOYMENT.md    # 部署文档
└── setup.sh         # 安装脚本
```

## 故障排查

### 后端无法启动
```bash
# 检查端口占用
lsof -i :3000

# 查看日志
cd backend
npm run dev  # 查看错误信息
```

### 前端无法访问
```bash
# 确保后端已启动
# 检查防火墙设置
# 查看浏览器控制台错误
```

### WebSocket 连接失败
- 检查 JWT token 是否有效
- 确认后端服务正常运行
- 查看浏览器控制台网络错误

## 网络方案

### 方案 1: Tailscale（推荐）
1. 家用电脑和手机都安装 Tailscale
2. 登录同一账号
3. 访问: `http://100.x.x.x:3000`

### 方案 2: 端口映射
1. 路由器配置端口转发
2. 外网访问: `http://公网IP:端口`
3. **必须配置 HTTPS**

### 方案 3: Zerotier
1. 创建网络
2. 设备加入同一网络
3. 访问分配的 IP

详细配置见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## API 测试

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# 创建终端 (需要 token)
curl -X POST http://localhost:3000/api/terminal \
  -H "Authorization: Bearer YOUR_TOKEN"

# 列出文件
curl http://localhost:3000/api/fs/list?path=/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 性能优化

### 减少内存占用
- 调整 SESSION_TIMEOUT（默认 30 分钟）
- 限制最大终端数量（可在代码中添加）

### 提升响应速度
- 使用 Nginx 反向代理
- 启用 gzip 压缩
- 静态资源 CDN（可选）

## 更新项目

```bash
# 拉取最新代码
git pull

# 重新安装和构建
./setup.sh

# 重启服务
pm2 restart powerconnect
```

## 备份

定期备份：
```bash
# 配置文件
cp backend/.env ~/backup/

# 如果有重要数据
tar -czf ~/backup/files.tar.gz $FS_ROOT_DIR
```

## 监控

```bash
# PM2 监控
pm2 monit

# 查看状态
pm2 status

# 查看日志
pm2 logs powerconnect --lines 50
```

## 获取帮助

- 查看 [README.md](./README.md) 项目说明
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 部署指南
- 提交 Issue: https://github.com/HecreReed/PowerConnect/issues

---

快速参考到此结束，祝使用愉快！🎉
