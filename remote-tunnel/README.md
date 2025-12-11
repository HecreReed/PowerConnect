# Remote Tunnel - 内网穿透工具套件

一键启动内网穿透，支持多种方案。

## 快速开始

```bash
# 1. 安装（家里电脑）
cd remote-tunnel
./install.sh

# 2. 配置服务器信息
nano config/tunnel.conf

# 3. 启动隧道
remote-tunnel up

# 4. 停止隧道
remote-tunnel down

# 5. 查看状态
remote-tunnel status
```

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **frp** | 功能强大、性能好、支持多协议 | 需要在服务器安装服务端 | 长期使用、生产环境 |
| **SSH隧道** | 最简单、无需额外安装 | 稳定性略差、需保持SSH连接 | 临时使用、快速测试 |

## 目录结构

```
remote-tunnel/
├── config/
│   ├── tunnel.conf          # 主配置文件
│   ├── frp/
│   │   ├── frps.ini        # 服务端配置
│   │   └── frpc.ini        # 客户端配置
│   └── services/
│       └── powerconnect.conf # 服务配置
├── scripts/
│   ├── frp/
│   │   ├── setup-server.sh   # 服务器端安装脚本
│   │   └── client.sh         # 客户端启动脚本
│   ├── ssh/
│   │   └── tunnel.sh         # SSH隧道脚本
│   └── utils/
│       └── check-deps.sh     # 依赖检查
├── bin/
│   └── remote-tunnel         # 主命令
├── install.sh                # 安装脚本
└── README.md                 # 本文档
```

## 详细文档

- [配置指南](docs/CONFIG.md)
- [服务器端设置](docs/SERVER_SETUP.md)
- [故障排查](docs/TROUBLESHOOTING.md)
