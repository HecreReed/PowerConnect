# Remote Tunnel 完整使用指南

## 快速开始（5 分钟上手）

### 第一步：在服务器端安装 frp

SSH 登录到你的云服务器 **154.37.220.3**：

```bash
ssh root@154.37.220.3
```

下载并运行服务器端安装脚本：

```bash
# 下载脚本
wget https://raw.githubusercontent.com/HecreReed/PowerConnect/main/remote-tunnel/scripts/frp/setup-server.sh

# 或者如果没有 wget，使用 curl
curl -O https://raw.githubusercontent.com/HecreReed/PowerConnect/main/remote-tunnel/scripts/frp/setup-server.sh

# 运行安装脚本
chmod +x setup-server.sh
sudo bash setup-server.sh
```

**重要**：脚本运行完成后会显示 **认证 Token**，类似这样：

```
认证 Token（客户端需要）：
abc123def456...
```

**请复制并保存这个 Token！**后面客户端配置需要用到。

### 第二步：在家里电脑安装客户端

```bash
cd /Users/mac/project/PowerConnect/remote-tunnel
./install.sh
```

安装完成后，如果提示需要更新 PATH，运行：

```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

### 第三步：配置客户端

编辑配置文件：

```bash
nano config/tunnel.conf
```

修改以下关键配置：

```bash
# 服务器 IP（已经是正确的）
SERVER_HOST="154.37.220.3"

# SSH 用户名（根据实际情况修改）
SSH_USER="root"

# 本地 PowerConnect 服务端口
LOCAL_PORT="3000"

# 远程暴露的端口
REMOTE_PORT="8443"
```

然后编辑 frp 客户端配置：

```bash
nano config/frp/frpc.ini
```

将服务器返回的 Token 填入：

```ini
[common]
server_addr = 154.37.220.3
server_port = 7000
token = 这里填入服务器返回的Token
```

### 第四步：启动隧道

```bash
# 确保 PowerConnect 服务已启动
cd /Users/mac/project/PowerConnect/backend
npm start  # 或 pm2 start

# 在另一个终端启动隧道
remote-tunnel up
```

看到成功提示后，就可以通过外网访问了：

```
http://154.37.220.3:8443
```

---

## 详细命令说明

### 基本命令

```bash
# 启动隧道（使用默认方法）
remote-tunnel up

# 使用 frp 方式启动
remote-tunnel up --frp

# 使用 SSH 方式启动
remote-tunnel up --ssh

# 停止隧道
remote-tunnel down

# 重启隧道
remote-tunnel restart

# 查看状态
remote-tunnel status

# 查看日志
remote-tunnel logs

# 测试连接
remote-tunnel test

# 诊断问题
remote-tunnel doctor
```

### 高级命令

```bash
# 切换默认方案
remote-tunnel switch

# 编辑配置文件
remote-tunnel config

# 查看帮助
remote-tunnel help
```

---

## 两种方案对比

### 方案 1: frp（推荐）

**优点：**
- ✅ 性能好，稳定性高
- ✅ 支持多种协议（TCP/UDP/HTTP/HTTPS）
- ✅ 支持多个端口映射
- ✅ 内置管理面板
- ✅ 自动重连机制
- ✅ 支持加密和压缩

**缺点：**
- ❌ 需要在服务器端安装 frps
- ❌ 需要配置 token

**适用场景：**
- 长期使用
- 需要稳定的生产环境
- 需要映射多个端口
- 需要性能保障

**启动方式：**
```bash
remote-tunnel up --frp
```

### 方案 2: SSH 反向隧道

**优点：**
- ✅ 无需额外安装（只需 SSH）
- ✅ 配置简单
- ✅ 天然加密

**缺点：**
- ❌ 连接可能不稳定
- ❌ 依赖 SSH 连接保持
- ❌ 性能略低于 frp

**适用场景：**
- 临时测试
- 快速演示
- 没有 root 权限安装 frp
- 简单的端口转发需求

**启动方式：**
```bash
remote-tunnel up --ssh
```

---

## 配置文件详解

### 主配置文件：`config/tunnel.conf`

```bash
# 服务器配置
SERVER_HOST="154.37.220.3"        # 公网服务器 IP
SSH_PORT="22"                      # SSH 端口
SSH_USER="root"                    # SSH 用户名

# 隧道配置
LOCAL_PORT="3000"                  # 本地服务端口
REMOTE_PORT="8443"                 # 远程暴露端口
FRP_TOKEN="your-token-here"        # frp 认证 token
FRP_BIND_PORT="7000"               # frp 服务端端口

# 默认方案
DEFAULT_METHOD="frp"               # frp | ssh

# 高级选项
AUTO_RECONNECT="true"              # 自动重连
RECONNECT_INTERVAL="5"             # 重连间隔（秒）
LOG_DIR="$HOME/.remote-tunnel/logs"
PID_DIR="$HOME/.remote-tunnel/pids"

# SSH 配置
SSH_KEY="$HOME/.ssh/id_rsa"        # SSH 密钥路径
SSH_KEEPALIVE_INTERVAL="60"        # 保活间隔
SSH_KEEPALIVE_COUNT="3"            # 保活重试次数

# frp 配置
FRP_VERSION="0.52.3"               # frp 版本
FRP_ADMIN_PORT="7400"              # 管理端口
FRP_USE_ENCRYPTION="false"         # 是否加密
FRP_USE_COMPRESSION="false"        # 是否压缩
```

### frp 客户端配置：`config/frp/frpc.ini`

```ini
[common]
server_addr = 154.37.220.3
server_port = 7000
token = your-token-here

admin_addr = 127.0.0.1
admin_port = 7400

log_file = ./logs/frpc.log
log_level = info

[powerconnect]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 8443
```

---

## 常见使用场景

### 场景 1：远程访问家里的 PowerConnect 服务

1. 确保家里电脑上 PowerConnect 服务运行在 3000 端口
2. 启动隧道：`remote-tunnel up`
3. 外网访问：`http://154.37.220.3:8443`

### 场景 2：映射多个服务

编辑 `config/frp/frpc.ini`，添加更多服务：

```ini
# PowerConnect 服务
[powerconnect]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 8443

# 另一个 Web 服务
[web-service]
type = tcp
local_ip = 127.0.0.1
local_port = 8080
remote_port = 8080

# SSH 服务（方便远程 SSH 到家里电脑）
[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 2222
```

重启隧道：`remote-tunnel restart`

### 场景 3：临时测试（使用 SSH 方案）

如果只是临时测试，不想配置 frp：

```bash
# 使用 SSH 方案
remote-tunnel up --ssh

# 测试完成后停止
remote-tunnel down
```

### 场景 4：长期运行（守护进程）

使用 frp + systemd 或 pm2：

**方式 1：使用 systemd（Linux）**

创建服务文件 `/etc/systemd/system/remote-tunnel.service`：

```ini
[Unit]
Description=Remote Tunnel Service
After=network.target

[Service]
Type=simple
User=youruser
ExecStart=/home/youruser/.local/bin/remote-tunnel up --frp
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable remote-tunnel
sudo systemctl start remote-tunnel
```

**方式 2：使用 pm2（跨平台）**

创建启动脚本 `start-tunnel.sh`：

```bash
#!/bin/bash
/Users/mac/.local/bin/remote-tunnel up --frp
```

使用 pm2 启动：

```bash
pm2 start start-tunnel.sh --name remote-tunnel
pm2 save
```

---

## 故障排查

### 问题 1：无法连接到服务器

**症状：**
```
✗ 无法连接到服务器 154.37.220.3:7000
```

**解决方法：**

1. 检查服务器端 frps 是否运行：
   ```bash
   ssh root@154.37.220.3 'systemctl status frps'
   ```

2. 检查防火墙是否开放端口：
   ```bash
   ssh root@154.37.220.3 'ufw status'
   # 或
   ssh root@154.37.220.3 'firewall-cmd --list-all'
   ```

3. 测试端口连通性：
   ```bash
   nc -zv 154.37.220.3 7000
   # 或
   telnet 154.37.220.3 7000
   ```

### 问题 2：Token 认证失败

**症状：**
```
authentication failed
```

**解决方法：**

1. 检查客户端配置文件中的 token 是否正确
2. 确保 token 与服务器端一致：
   ```bash
   ssh root@154.37.220.3 'cat /etc/frp/frps.ini | grep token'
   ```

### 问题 3：远程端口无法访问

**症状：**
隧道显示连接成功，但外网无法访问 `http://154.37.220.3:8443`

**解决方法：**

1. 检查本地服务是否运行：
   ```bash
   curl http://localhost:3000
   ```

2. 检查服务器防火墙：
   ```bash
   ssh root@154.37.220.3 'ufw allow 8443/tcp'
   ```

3. 查看 frp 日志：
   ```bash
   remote-tunnel logs
   # 或服务器端
   ssh root@154.37.220.3 'journalctl -u frps -n 50'
   ```

### 问题 4：SSH 隧道频繁断开

**解决方法：**

1. 配置 SSH 密钥认证（避免密码超时）：
   ```bash
   remote-tunnel up --ssh
   # 在另一个终端
   ./scripts/ssh/tunnel.sh setup-key
   ```

2. 调整 SSH 保活参数（编辑 `config/tunnel.conf`）：
   ```bash
   SSH_KEEPALIVE_INTERVAL="30"
   SSH_KEEPALIVE_COUNT="5"
   ```

3. 使用监控模式（自动重连）：
   ```bash
   ./scripts/ssh/tunnel.sh monitor
   ```

### 问题 5：frpc 安装失败

**症状：**
```
✗ 下载失败！请检查网络
```

**解决方法：**

1. 手动下载 frp：
   ```bash
   # 访问 GitHub Releases
   https://github.com/fatedier/frp/releases

   # 下载对应版本，例如 macOS arm64
   curl -L -O https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_darwin_arm64.tar.gz

   # 解压
   tar -xzf frp_0.52.3_darwin_arm64.tar.gz

   # 复制 frpc 到安装目录
   cp frp_0.52.3_darwin_arm64/frpc ~/.remote-tunnel/frp/
   chmod +x ~/.remote-tunnel/frp/frpc
   ```

2. 或使用国内镜像（脚本会自动尝试）

---

## 性能优化

### 1. 启用 frp 压缩

编辑 `config/frp/frpc.ini`：

```ini
[powerconnect]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 8443
use_compression = true  # 启用压缩
```

适用于带宽有限的场景，但会增加 CPU 使用率。

### 2. 启用 frp 加密

```ini
[powerconnect]
use_encryption = true  # 启用加密
```

增加数据传输安全性，但会略微降低性能。

### 3. 调整连接池

```ini
[common]
pool_count = 10  # 增加连接池大小
```

---

## 安全建议

1. **修改默认端口**
   - 不使用 frp 默认的 7000 端口
   - 修改服务器端配置并同步到客户端

2. **使用强 Token**
   - Token 至少 32 位随机字符
   - 定期更换 Token

3. **配置防火墙**
   - 只开放必要的端口
   - 限制访问 IP（如果有固定 IP）

4. **启用 HTTPS**
   - 在服务器端配置 Nginx + SSL
   - 参考 PowerConnect 的 DEPLOYMENT.md

5. **监控日志**
   - 定期查看隧道日志
   - 发现异常及时处理

---

## 进阶技巧

### 1. 多台电脑共享同一服务器

每台电脑使用不同的用户名和端口：

**电脑 A（config/frp/frpc.ini）：**
```ini
[common]
user = home-computer-A

[powerconnect-a]
remote_port = 8443
```

**电脑 B（config/frp/frpc.ini）：**
```ini
[common]
user = home-computer-B

[powerconnect-b]
remote_port = 8444
```

### 2. 使用域名访问

在服务器端配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name powerconnect.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

然后通过域名访问：`http://powerconnect.yourdomain.com`

### 3. 设置访问密码（额外保护）

在服务器端 Nginx 配置：

```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://127.0.0.1:8443;
}
```

创建密码文件：

```bash
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

---

## 常用运维命令

```bash
# 查看隧道状态
remote-tunnel status

# 查看实时日志
remote-tunnel logs
tail -f ~/.remote-tunnel/logs/frpc.log

# 测试连接
remote-tunnel test

# 重启隧道
remote-tunnel restart

# 诊断问题
remote-tunnel doctor

# 查看 frp 管理面板
# 浏览器访问: http://localhost:7400

# 服务器端查看 frp 状态
ssh root@154.37.220.3 'systemctl status frps'

# 服务器端查看 frp 日志
ssh root@154.37.220.3 'journalctl -u frps -f'

# 服务器端重启 frp
ssh root@154.37.220.3 'systemctl restart frps'
```

---

## 快速参考卡片

```
┌─────────────────────────────────────────┐
│  Remote Tunnel 快速参考                │
├─────────────────────────────────────────┤
│  启动: remote-tunnel up                 │
│  停止: remote-tunnel down               │
│  状态: remote-tunnel status             │
│  日志: remote-tunnel logs               │
│  诊断: remote-tunnel doctor             │
├─────────────────────────────────────────┤
│  访问地址:                              │
│  http://154.37.220.3:8443               │
├─────────────────────────────────────────┤
│  配置文件:                              │
│  config/tunnel.conf                     │
│  config/frp/frpc.ini                    │
└─────────────────────────────────────────┘
```

---

需要更多帮助？查看：
- 项目 README: `remote-tunnel/README.md`
- 服务器配置: `docs/SERVER_SETUP.md`
- 故障排查: `docs/TROUBLESHOOTING.md`
