# Remote Tunnel - 内网穿透工具总结

## 🎉 完成！一个完整的内网穿透解决方案

你现在拥有一套功能完整、易于使用的内网穿透工具，支持多种方案，一键启动。

---

## ✨ 核心特性

### 1. **双方案支持**
- ✅ **frp**: 生产级别，高性能，稳定可靠
- ✅ **SSH 反向隧道**: 极简方案，无需额外安装

### 2. **一键操作**
```bash
remote-tunnel up      # 启动
remote-tunnel down    # 停止
remote-tunnel status  # 状态
```

### 3. **自动化安装**
- 服务器端：一条命令自动安装配置 frps
- 客户端：一条命令安装，自动配置环境

### 4. **智能管理**
- 自动重连
- 进程守护
- 日志记录
- 状态监控
- 问题诊断

---

## 📁 项目结构

```
remote-tunnel/
├── bin/
│   └── remote-tunnel           # 主命令（统一入口）
├── config/
│   ├── tunnel.conf             # 主配置文件
│   ├── frp/
│   │   ├── frps.ini           # 服务端配置
│   │   └── frpc.ini           # 客户端配置
│   └── services/
│       └── powerconnect.conf  # 服务配置
├── scripts/
│   ├── frp/
│   │   ├── setup-server.sh    # 服务器安装脚本
│   │   └── client.sh          # 客户端管理脚本
│   └── ssh/
│       └── tunnel.sh          # SSH 隧道脚本
├── docs/
│   ├── QUICKSTART.md          # 5 分钟快速上手
│   ├── USAGE.md               # 完整使用指南
│   └── SUMMARY.md             # 本文件
├── install.sh                  # 客户端安装脚本
└── README.md                   # 项目说明
```

---

## 🚀 使用流程

### 第一次使用

**1. 服务器端（只需一次）：**

```bash
ssh root@154.37.220.3
bash setup-server.sh
# 记下返回的 Token
```

**2. 客户端：**

```bash
cd remote-tunnel
./install.sh
nano config/frp/frpc.ini  # 填入 Token
remote-tunnel up
```

**3. 访问：**

```
http://154.37.220.3:8443
```

### 日常使用

```bash
# 启动 PowerConnect
cd PowerConnect/backend && npm start

# 启动隧道
remote-tunnel up

# 外网访问
# http://154.37.220.3:8443
```

---

## 🛠️ 常用命令速查

### 基本操作

| 命令 | 说明 |
|------|------|
| `remote-tunnel up` | 启动隧道（默认 frp） |
| `remote-tunnel up --frp` | 使用 frp 启动 |
| `remote-tunnel up --ssh` | 使用 SSH 启动 |
| `remote-tunnel down` | 停止隧道 |
| `remote-tunnel restart` | 重启隧道 |
| `remote-tunnel status` | 查看状态 |
| `remote-tunnel logs` | 查看日志 |

### 管理操作

| 命令 | 说明 |
|------|------|
| `remote-tunnel test` | 测试服务器连接 |
| `remote-tunnel doctor` | 诊断问题 |
| `remote-tunnel switch` | 切换方案 |
| `remote-tunnel config` | 编辑配置 |

### 高级操作

| 命令 | 说明 |
|------|------|
| `./scripts/ssh/tunnel.sh monitor` | SSH 监控模式（自动重连） |
| `./scripts/ssh/tunnel.sh setup-key` | 配置 SSH 密钥 |
| `./scripts/frp/client.sh install` | 手动安装 frpc |

---

## 🎯 方案选择指南

### 使用 frp 的场景

✅ 长期使用
✅ 生产环境
✅ 需要稳定性
✅ 需要多端口映射
✅ 需要高性能

### 使用 SSH 的场景

✅ 临时测试
✅ 快速演示
✅ 不想安装额外软件
✅ 简单的单端口转发
✅ 已有 SSH 访问权限

---

## 📊 功能对比

| 功能 | frp | SSH 隧道 |
|------|-----|----------|
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 易用性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 配置复杂度 | 中 | 低 |
| 安装要求 | 需要 root | 只需 SSH |
| 多端口 | ✅ | ✅ |
| 自动重连 | ✅ | ⚠️ 需配置 |
| 管理面板 | ✅ | ❌ |
| 加密传输 | 可选 | 内置 |
| 数据压缩 | 可选 | ❌ |

---

## 🔐 安全建议

1. **修改默认配置**
   - ✅ 使用强 Token（至少 32 位随机）
   - ✅ 修改默认端口
   - ✅ 配置防火墙规则

2. **使用 HTTPS**
   - 在服务器端配置 Nginx + SSL
   - 获取免费证书（Let's Encrypt）
   - 参考 PowerConnect 的 DEPLOYMENT.md

3. **限制访问**
   - 配置 IP 白名单（如果有固定 IP）
   - 使用 Nginx 基本认证
   - 定期查看访问日志

4. **监控和维护**
   - 定期更新 frp 版本
   - 查看异常日志
   - 备份配置文件

---

## 🌟 高级用法

### 1. 映射多个服务

编辑 `config/frp/frpc.ini`：

```ini
[powerconnect]
type = tcp
local_port = 3000
remote_port = 8443

[another-service]
type = tcp
local_port = 8080
remote_port = 8080

[ssh]
type = tcp
local_port = 22
remote_port = 2222
```

### 2. 使用域名访问

在服务器配置 Nginx：

```nginx
server {
    listen 80;
    server_name powerconnect.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8443;
    }
}
```

### 3. 开机自启动

**macOS / Linux:**

```bash
# 使用 systemd（Linux）
sudo systemctl enable remote-tunnel

# 使用 launchd（macOS）
# 见 docs/QUICKSTART.md
```

### 4. 监控和告警

编辑 `config/tunnel.conf` 启用通知：

```bash
ENABLE_NOTIFICATION="true"
NOTIFICATION_METHOD="webhook"
WEBHOOK_URL="https://your-webhook-url"
```

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [README.md](../README.md) | 项目概述 |
| [QUICKSTART.md](QUICKSTART.md) | 5 分钟快速上手 ⭐ |
| [USAGE.md](USAGE.md) | 完整使用指南 |
| [config/tunnel.conf](../config/tunnel.conf) | 配置文件详解 |

---

## 🐛 故障排查快速索引

| 问题 | 解决方法 |
|------|----------|
| 无法连接服务器 | 检查服务器 frps 状态、防火墙 |
| Token 认证失败 | 核对客户端和服务器 token |
| 外网无法访问 | 检查防火墙、本地服务 |
| SSH 隧道断开 | 使用监控模式、配置密钥 |
| frpc 安装失败 | 手动下载、使用国内镜像 |

详细排查步骤见 [USAGE.md](USAGE.md#故障排查)

---

## 🎁 实用脚本集合

### 一键启动 PowerConnect + 隧道

创建 `start-all.sh`：

```bash
#!/bin/bash

# 启动 PowerConnect
cd /Users/mac/project/PowerConnect/backend
pm2 start ecosystem.config.js

# 启动隧道
remote-tunnel up

echo "全部启动完成！"
echo "访问: http://154.37.220.3:8443"
```

### 状态检查脚本

创建 `check-status.sh`：

```bash
#!/bin/bash

echo "=== PowerConnect 状态 ==="
pm2 list | grep powerconnect

echo ""
echo "=== 隧道状态 ==="
remote-tunnel status

echo ""
echo "=== 本地测试 ==="
curl -s -o /dev/null -w "本地服务: %{http_code}\n" http://localhost:3000

echo ""
echo "=== 外网测试 ==="
curl -s -o /dev/null -w "外网访问: %{http_code}\n" http://154.37.220.3:8443
```

---

## 💡 最佳实践

1. **开发环境**
   - 本地开发时使用 `remote-tunnel up --ssh` 快速测试
   - 稳定后切换到 frp

2. **生产环境**
   - 使用 frp 方案
   - 配置开机自启
   - 定期备份配置
   - 启用日志轮转

3. **测试流程**
   ```bash
   # 1. 本地测试
   curl http://localhost:3000

   # 2. 启动隧道
   remote-tunnel up

   # 3. 外网测试
   curl http://154.37.220.3:8443
   ```

4. **监控维护**
   ```bash
   # 每天检查一次
   remote-tunnel status

   # 每周查看日志
   remote-tunnel logs

   # 发现问题时诊断
   remote-tunnel doctor
   ```

---

## 🎊 总结

你现在拥有：

✅ **完整的内网穿透解决方案**
- frp 和 SSH 两种方案
- 一键安装部署
- 统一命令管理

✅ **生产级别的功能**
- 自动重连
- 日志记录
- 状态监控
- 问题诊断

✅ **详尽的文档**
- 快速上手指南
- 完整使用手册
- 故障排查索引

✅ **灵活的配置**
- 多服务支持
- 域名访问
- HTTPS 加密
- 开机自启

---

## 🚀 现在开始使用吧！

```bash
# 1. 服务器安装
ssh root@154.37.220.3 'bash setup-server.sh'

# 2. 客户端安装
cd remote-tunnel && ./install.sh

# 3. 配置 token
nano config/frp/frpc.ini

# 4. 启动隧道
remote-tunnel up

# 5. 外网访问
# http://154.37.220.3:8443
```

祝使用愉快！🎉

---

**需要帮助？**
- 查看文档：`docs/USAGE.md`
- 运行诊断：`remote-tunnel doctor`
- 查看日志：`remote-tunnel logs`
