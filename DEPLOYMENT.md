# PowerConnect 部署文档

本文档提供详细的部署和网络配置说明。

## 目录

- [基本部署](#基本部署)
- [端口映射与路由器配置](#端口映射与路由器配置)
- [内网穿透方案（推荐）](#内网穿透方案推荐)
- [Nginx 反向代理](#nginx-反向代理)
- [Systemd 服务配置](#systemd-服务配置)
- [HTTPS 配置](#https-配置)
- [防火墙配置](#防火墙配置)
- [性能优化](#性能优化)

---

## 基本部署

### 1. 环境要求

- Node.js 18+
- npm 或 pnpm
- Linux/macOS 操作系统
- 至少 512MB RAM
- 至少 1GB 磁盘空间

### 2. 安装步骤

```bash
# 克隆或下载代码
cd PowerConnect

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置文件

创建 `backend/.env`：

```bash
cd backend
cp .env.example .env
nano .env  # 或使用你喜欢的编辑器
```

**重要配置项**：

```env
# 服务器端口（默认 3000）
PORT=3000

# 监听地址（0.0.0.0 允许外部访问，127.0.0.1 仅本地）
HOST=0.0.0.0

# JWT 密钥（必须修改！至少 32 字符）
JWT_SECRET=你的随机密钥-至少32个字符-使用随机生成器

# 登录凭据（必须修改！）
USERNAME=你的用户名
PASSWORD=你的强密码

# 文件系统根目录（留空则使用用户主目录）
FS_ROOT_DIR=/home/youruser/shared

# 终端会话超时时间（分钟）
SESSION_TIMEOUT=30

# CORS 允许的来源
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

**生成随机密钥**：

```bash
# Linux/macOS
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 构建和启动

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build

# 直接启动（测试用）
npm start

# 使用 PM2 启动（生产环境推荐）
npm install -g pm2
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 5. PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs powerconnect

# 重启服务
pm2 restart powerconnect

# 停止服务
pm2 stop powerconnect

# 删除服务
pm2 delete powerconnect

# 监控
pm2 monit
```

---

## 端口映射与路由器配置

### 场景说明

- 家用电脑内网 IP：`192.168.1.100`（示例）
- 路由器公网 IP：`1.2.3.4`（示例，以实际为准）
- 后端监听端口：`3000`
- 外部访问端口：`8443`（可自定义）

### 配置步骤

#### 1. 查看内网 IP

```bash
# Linux
ip addr show

# macOS
ifconfig

# 查找类似 192.168.x.x 或 10.x.x.x 的地址
```

#### 2. 路由器端口转发设置

登录路由器管理界面（通常是 `192.168.1.1` 或 `192.168.0.1`）：

1. 找到 **端口转发**、**虚拟服务器** 或 **NAT** 设置
2. 添加新规则：
   ```
   服务名称：PowerConnect
   外部端口：8443
   内部 IP：192.168.1.100
   内部端口：3000
   协议：TCP
   ```
3. 保存并重启路由器

#### 3. 查看公网 IP

```bash
# 方法 1
curl ifconfig.me

# 方法 2
curl ipinfo.io/ip

# 方法 3（路由器管理页面查看）
```

#### 4. 测试访问

外部访问地址：`http://1.2.3.4:8443`

**⚠️ 安全警告**：

- 直接公网暴露风险较大
- 必须使用强密码
- 强烈建议配置 HTTPS（见后文）
- 考虑配置防火墙限制访问 IP
- **更推荐使用内网穿透方案（见下节）**

---

## 内网穿透方案（推荐）

内网穿透方案无需在路由器配置端口转发，更安全便捷。

### 方案 1：Tailscale（最推荐）

**优点**：
- 免费且易用
- 自动 NAT 穿透
- 点对点加密
- 跨平台（Windows/Mac/Linux/iOS/Android）

**配置步骤**：

1. **在家用电脑安装 Tailscale**

```bash
# macOS
brew install tailscale
tailscale up

# Linux (Ubuntu/Debian)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 其他 Linux 发行版
# 访问 https://tailscale.com/download
```

2. **在手机安装 Tailscale**

- iOS：App Store 搜索 "Tailscale"
- Android：Google Play 搜索 "Tailscale"

3. **登录同一账号**

家用电脑和手机使用同一个 Tailscale 账号登录。

4. **获取内网 IP**

```bash
tailscale ip -4
# 输出类似：100.x.x.x
```

5. **访问**

在手机浏览器访问：`http://100.x.x.x:3000`

**配置静态域名（可选）**：

Tailscale 管理后台可设置 MagicDNS，访问：
`http://your-computer.your-tailnet.ts.net:3000`

---

### 方案 2：Zerotier

**优点**：
- 开源
- 支持更多平台
- 可自建 Moon 服务器

**配置步骤**：

1. **注册账号**

访问 https://my.zerotier.com 注册并创建网络。

2. **安装客户端**

```bash
# macOS
brew install zerotier-one

# Linux
curl -s https://install.zerotier.com | sudo bash
```

3. **加入网络**

```bash
# 使用你的 Network ID
sudo zerotier-cli join <your-network-id>
```

4. **在 Web 界面授权设备**

访问 https://my.zerotier.com，在网络成员列表中勾选授权。

5. **手机端**

- iOS/Android 安装 Zerotier One
- 加入相同的网络 ID

6. **访问**

查看分配的 IP 并访问：`http://x.x.x.x:3000`

---

### 方案 3：frp（适合有公网服务器）

如果你有一台公网服务器，可使用 frp 进行内网穿透。

**服务端（公网服务器）**：

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.0/frp_0.52.0_linux_amd64.tar.gz
tar -xzf frp_0.52.0_linux_amd64.tar.gz
cd frp_0.52.0_linux_amd64

# 配置 frps.ini
cat > frps.ini <<EOF
[common]
bind_port = 7000
EOF

# 启动服务端
./frps -c frps.ini
```

**客户端（家用电脑）**：

```bash
# 下载并解压（同上）

# 配置 frpc.ini
cat > frpc.ini <<EOF
[common]
server_addr = 你的公网服务器IP
server_port = 7000

[powerconnect]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 8443
EOF

# 启动客户端
./frpc -c frpc.ini
```

**访问**：`http://你的公网服务器IP:8443`

---

## Nginx 反向代理

使用 Nginx 提供 HTTPS、静态文件服务和负载均衡。

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# macOS
brew install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置文件

创建 `/etc/nginx/sites-available/powerconnect`：

```nginx
# HTTP 配置（用于重定向到 HTTPS）
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置（见 HTTPS 配置章节）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 静态文件（可选，如果前端独立部署）
    # location / {
    #     root /path/to/PowerConnect/frontend/dist;
    #     try_files $uri $uri/ /index.html;
    # }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 超时设置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # 所有其他请求转发到后端（SPA 模式）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/powerconnect /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 开机自启
sudo systemctl enable nginx
```

---

## HTTPS 配置

### 使用 Let's Encrypt（免费证书）

**前提**：
- 拥有域名
- 域名 A 记录指向你的服务器公网 IP
- 80 和 443 端口开放

**安装 Certbot**：

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# macOS
brew install certbot

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**申请证书**：

```bash
# 自动配置 Nginx
sudo certbot --nginx -d your-domain.com

# 或手动配置
sudo certbot certonly --nginx -d your-domain.com
```

**自动续期**：

```bash
# 测试续期
sudo certbot renew --dry-run

# 设置自动续期（通常已自动配置）
sudo systemctl status certbot.timer
```

**证书位置**：
- 证书：`/etc/letsencrypt/live/your-domain.com/fullchain.pem`
- 私钥：`/etc/letsencrypt/live/your-domain.com/privkey.pem`

---

## Systemd 服务配置

如果不使用 PM2，可以用 systemd 管理服务。

创建 `/etc/systemd/system/powerconnect.service`：

```ini
[Unit]
Description=PowerConnect Remote Terminal Service
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/PowerConnect/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=powerconnect

[Install]
WantedBy=multi-user.target
```

**启用服务**：

```bash
# 重载配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start powerconnect

# 开机自启
sudo systemctl enable powerconnect

# 查看状态
sudo systemctl status powerconnect

# 查看日志
sudo journalctl -u powerconnect -f
```

---

## 防火墙配置

### UFW（Ubuntu/Debian）

```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH（重要！）
sudo ufw allow 22/tcp

# 允许应用端口
sudo ufw allow 3000/tcp

# 如果使用 Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 限制特定 IP 访问（推荐）
sudo ufw allow from 你的IP地址 to any port 3000

# 查看状态
sudo ufw status verbose
```

### firewalld（CentOS/RHEL）

```bash
# 启动防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 开放端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp

# 重载规则
sudo firewall-cmd --reload

# 查看规则
sudo firewall-cmd --list-all
```

### iptables（通用）

```bash
# 允许端口
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

---

## 性能优化

### 1. Node.js 配置

增加内存限制（如果需要）：

```bash
# 在 ecosystem.config.js 中
node_args: '--max-old-space-size=512'
```

### 2. Nginx 优化

```nginx
# worker 进程数（通常等于 CPU 核心数）
worker_processes auto;

# 每个 worker 的连接数
events {
    worker_connections 1024;
}

# 启用 gzip
http {
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 3. 系统优化

增加文件描述符限制：

```bash
# 编辑 /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535

# 立即生效（当前会话）
ulimit -n 65535
```

---

## 常见问题

### Q: WebSocket 连接失败

**A**: 检查：
1. Nginx 配置中是否正确配置了 WebSocket 代理
2. 防火墙是否开放了端口
3. 浏览器控制台查看具体错误信息

### Q: 文件下载失败

**A**: 检查：
1. `FS_ROOT_DIR` 配置是否正确
2. 用户是否有读取权限
3. 文件路径是否在根目录范围内

### Q: 终端中文显示乱码

**A**: 设置正确的 locale：

```bash
# 查看当前 locale
locale

# 设置 UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
```

### Q: 如何更改端口

**A**: 修改 `backend/.env` 中的 `PORT` 配置并重启服务。

---

## 监控和日志

### PM2 监控

```bash
# 实时监控
pm2 monit

# Web 监控界面（可选）
pm2 install pm2-logrotate
pm2 web
```

### 日志管理

```bash
# PM2 日志
pm2 logs powerconnect --lines 100

# Systemd 日志
sudo journalctl -u powerconnect --since today

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 备份建议

定期备份以下内容：

1. **配置文件**：`backend/.env`
2. **用户数据**：`FS_ROOT_DIR` 指定的目录
3. **数据库**（如果未来扩展）

```bash
# 备份脚本示例
#!/bin/bash
BACKUP_DIR=/backup/powerconnect-$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
cp backend/.env $BACKUP_DIR/
tar -czf $BACKUP_DIR/files.tar.gz /path/to/FS_ROOT_DIR
```

---

## 安全检查清单

部署前务必确认：

- [ ] 已修改默认用户名和密码
- [ ] JWT_SECRET 使用随机生成的强密钥
- [ ] 启用了 HTTPS（生产环境）
- [ ] 配置了防火墙规则
- [ ] 限制了文件系统根目录
- [ ] 定期更新依赖包（`npm audit`）
- [ ] 考虑使用内网穿透而非公网暴露
- [ ] 配置了日志轮转
- [ ] 设置了备份计划

---

## 获取帮助

如有问题：

1. 查看日志文件
2. 检查配置是否正确
3. 阅读本文档相关章节
4. 提交 Issue（附带日志和配置信息）

---

## 更新说明

### 更新步骤

```bash
# 1. 备份
cp backend/.env backend/.env.backup

# 2. 拉取最新代码
git pull

# 3. 更新依赖
cd backend && npm install
cd ../frontend && npm install

# 4. 重新构建
cd ../frontend && npm run build
cd ../backend && npm run build

# 5. 重启服务
pm2 restart powerconnect
# 或
sudo systemctl restart powerconnect
```

---

祝部署顺利！🚀
