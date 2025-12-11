# Remote Tunnel - 5 分钟快速上手

## 💡 你要做什么？

在家里电脑上运行 PowerConnect 服务，然后在外网（公司、咖啡店、手机）访问它。

## 🎯 准备工作

- ✅ 一台有公网 IP 的云服务器：**154.37.220.3**
- ✅ 家里电脑可以上网
- ✅ PowerConnect 服务已经部署在家里电脑上

## 📋 操作步骤

### Step 1: 服务器端安装（5 分钟）

SSH 登录服务器：

```bash
ssh root@154.37.220.3
```

运行一键安装脚本：

```bash
# 方式 1: 如果已经上传了脚本
cd /path/to/PowerConnect/remote-tunnel/scripts/frp
chmod +x setup-server.sh
sudo ./setup-server.sh

# 方式 2: 远程执行（推荐）
bash <(curl -fsSL https://raw.githubusercontent.com/yourusername/PowerConnect/main/remote-tunnel/scripts/frp/setup-server.sh)
```

**重要！** 脚本完成后会显示类似这样的信息：

```
认证 Token（客户端需要）：
abc123def456ghi789...

Dashboard: http://154.37.220.3:7500
Dashboard 用户名: admin
Dashboard 密码: xyz789...
```

**请复制保存 Token！** 接下来要用。

### Step 2: 客户端安装（1 分钟）

在家里电脑上：

```bash
cd /Users/mac/project/PowerConnect/remote-tunnel
./install.sh
```

如果提示需要更新 PATH：

```bash
source ~/.bashrc  # 或 ~/.zshrc（看你用什么 shell）
```

### Step 3: 配置 Token（1 分钟）

编辑配置文件，把服务器返回的 Token 填进去：

```bash
nano config/frp/frpc.ini
```

找到这一行，替换 Token：

```ini
token = 把服务器返回的Token粘贴到这里
```

保存退出（Ctrl+O, Enter, Ctrl+X）。

### Step 4: 启动！（10 秒）

```bash
# 确保 PowerConnect 服务在运行
cd /Users/mac/project/PowerConnect/backend
npm start  # 或者 pm2 start ecosystem.config.js

# 另开一个终端，启动隧道
remote-tunnel up
```

看到这样的提示就成功了：

```
✓ frpc 启动成功 (PID: 12345)

访问信息:
  外网地址: http://154.37.220.3:8443
  本地服务: http://localhost:3000
```

### Step 5: 测试访问

在任何地方（公司、手机、朋友电脑）打开浏览器：

```
http://154.37.220.3:8443
```

应该能看到 PowerConnect 登录页面！🎉

---

## 🔧 常用命令

```bash
# 启动隧道
remote-tunnel up

# 停止隧道
remote-tunnel down

# 查看状态
remote-tunnel status

# 查看日志
remote-tunnel logs

# 遇到问题时诊断
remote-tunnel doctor
```

---

## ❓ 常见问题

### Q: 启动失败，提示 "authentication failed"

**A:** Token 配置错误。

1. 检查 `config/frp/frpc.ini` 中的 token 是否和服务器端一致
2. 重新从服务器获取 token：
   ```bash
   ssh root@154.37.220.3 'cat /etc/frp/frps.ini | grep token'
   ```

### Q: 外网无法访问 8443 端口

**A:** 防火墙没开放。

在服务器上运行：

```bash
# Ubuntu/Debian
sudo ufw allow 8443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --reload
```

### Q: 隧道启动成功，但访问显示连接失败

**A:** 本地服务没启动。

确保 PowerConnect 服务在运行：

```bash
# 检查
curl http://localhost:3000

# 如果失败，启动服务
cd /Users/mac/project/PowerConnect/backend
npm start
```

### Q: macOS 提示 "frpc" 无法打开

**A:** 安全设置问题。

```bash
# 解除限制
xattr -d com.apple.quarantine ~/.remote-tunnel/frp/frpc
```

---

## 🚀 进阶使用

### 开机自启动

**macOS（使用 launchd）：**

创建 `~/Library/LaunchAgents/com.remote-tunnel.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.remote-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/mac/.local/bin/remote-tunnel</string>
        <string>up</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

加载并启动：

```bash
launchctl load ~/Library/LaunchAgents/com.remote-tunnel.plist
```

### 使用 SSH 方案（备用方案）

如果 frp 有问题，可以试试 SSH 隧道：

```bash
remote-tunnel up --ssh
```

更简单，但稳定性略差。

---

## 📖 详细文档

- 完整使用指南：`docs/USAGE.md`
- 服务器配置：`docs/SERVER_SETUP.md`
- 故障排查：`docs/TROUBLESHOOTING.md`

---

## 🎉 大功告成！

现在你可以：

1. ✅ 在公司访问家里电脑的 PowerConnect
2. ✅ 在手机上打开浏览器访问
3. ✅ 给朋友演示你的项目
4. ✅ 随时随地管理家里的电脑

**注意安全：**
- 使用强密码登录 PowerConnect
- 不要把外网地址随便告诉别人
- 定期查看访问日志

祝使用愉快！ 🚀
