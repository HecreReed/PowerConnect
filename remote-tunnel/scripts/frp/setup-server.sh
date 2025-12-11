#!/bin/bash

# ====================================================
# frp 服务端安装脚本
# 在公网服务器 (154.37.220.3) 上运行此脚本
# ====================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
FRP_VERSION="0.52.3"
INSTALL_DIR="/opt/frp"
CONFIG_DIR="/etc/frp"
LOG_DIR="/var/log/frp"
SERVICE_FILE="/etc/systemd/system/frps.service"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}frp 服务端安装脚本${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# 检查是否为 root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}错误: 此脚本必须以 root 权限运行${NC}"
   echo "请使用: sudo $0"
   exit 1
fi

# 检测系统架构
ARCH=$(uname -m)
case ${ARCH} in
    x86_64)
        FRP_ARCH="amd64"
        ;;
    aarch64)
        FRP_ARCH="arm64"
        ;;
    armv7l)
        FRP_ARCH="arm"
        ;;
    *)
        echo -e "${RED}不支持的系统架构: ${ARCH}${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✓${NC} 检测到系统架构: ${ARCH} (frp: ${FRP_ARCH})"

# 检测操作系统
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
    echo -e "${GREEN}✓${NC} 检测到操作系统: ${OS}"
else
    echo -e "${YELLOW}⚠${NC}  无法检测操作系统，假设为 Linux"
    OS="linux"
fi

# 下载 frp
FRP_PACKAGE="frp_${FRP_VERSION}_linux_${FRP_ARCH}"
DOWNLOAD_URL="https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/${FRP_PACKAGE}.tar.gz"

echo ""
echo -e "${YELLOW}→${NC} 下载 frp ${FRP_VERSION}..."
echo "   下载地址: ${DOWNLOAD_URL}"

cd /tmp
if ! wget -q --show-progress "${DOWNLOAD_URL}"; then
    echo -e "${RED}✗${NC} 下载失败！尝试使用国内镜像..."
    DOWNLOAD_URL="https://ghproxy.com/${DOWNLOAD_URL}"
    if ! wget -q --show-progress "${DOWNLOAD_URL}"; then
        echo -e "${RED}✗${NC} 下载失败！请检查网络连接"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} 下载完成"

# 解压
echo -e "${YELLOW}→${NC} 解压..."
tar -xzf "${FRP_PACKAGE}.tar.gz"
cd "${FRP_PACKAGE}"

# 创建目录
echo -e "${YELLOW}→${NC} 创建目录..."
mkdir -p "${INSTALL_DIR}"
mkdir -p "${CONFIG_DIR}"
mkdir -p "${LOG_DIR}"

# 安装文件
echo -e "${YELLOW}→${NC} 安装文件..."
cp frps "${INSTALL_DIR}/"
chmod +x "${INSTALL_DIR}/frps"

# 检查是否已有配置文件
if [[ -f "${CONFIG_DIR}/frps.ini" ]]; then
    echo -e "${YELLOW}⚠${NC}  配置文件已存在，备份为 frps.ini.bak"
    cp "${CONFIG_DIR}/frps.ini" "${CONFIG_DIR}/frps.ini.bak.$(date +%Y%m%d%H%M%S)"
fi

# 生成随机 token
RANDOM_TOKEN=$(openssl rand -base64 32)
RANDOM_DASHBOARD_PWD=$(openssl rand -base64 16)

# 创建配置文件
cat > "${CONFIG_DIR}/frps.ini" <<EOF
# frp 服务端配置文件
# 自动生成于 $(date)

[common]
bind_addr = 0.0.0.0
bind_port = 7000

# 认证 token（客户端需要使用相同的 token）
token = ${RANDOM_TOKEN}

# Dashboard 配置
dashboard_addr = 0.0.0.0
dashboard_port = 7500
dashboard_user = admin
dashboard_pwd = ${RANDOM_DASHBOARD_PWD}

# 日志配置
log_file = ${LOG_DIR}/frps.log
log_level = info
log_max_days = 7

# 允许的端口范围
allow_ports = 8000-9000

# 最大连接池
max_pool_count = 50

# 心跳超时
heartbeat_timeout = 90

# TCP 多路复用
tcp_mux = true
EOF

echo -e "${GREEN}✓${NC} 配置文件已创建: ${CONFIG_DIR}/frps.ini"

# 创建 systemd 服务
cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=frp server service
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=${INSTALL_DIR}/frps -c ${CONFIG_DIR}/frps.ini
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓${NC} Systemd 服务已创建: ${SERVICE_FILE}"

# 重载 systemd
systemctl daemon-reload

# 配置防火墙
echo ""
echo -e "${YELLOW}→${NC} 配置防火墙..."

configure_firewall() {
    if command -v ufw &> /dev/null; then
        echo "   检测到 ufw，配置规则..."
        ufw allow 7000/tcp comment "frp server"
        ufw allow 7500/tcp comment "frp dashboard"
        ufw allow 8443/tcp comment "PowerConnect service"
        echo -e "${GREEN}✓${NC} ufw 规则已添加"
    elif command -v firewall-cmd &> /dev/null; then
        echo "   检测到 firewalld，配置规则..."
        firewall-cmd --permanent --add-port=7000/tcp
        firewall-cmd --permanent --add-port=7500/tcp
        firewall-cmd --permanent --add-port=8443/tcp
        firewall-cmd --reload
        echo -e "${GREEN}✓${NC} firewalld 规则已添加"
    else
        echo -e "${YELLOW}⚠${NC}  未检测到防火墙，请手动开放以下端口："
        echo "     - 7000 (frp 服务)"
        echo "     - 7500 (frp 管理面板)"
        echo "     - 8443 (PowerConnect 服务)"
    fi
}

configure_firewall

# 启动服务
echo ""
echo -e "${YELLOW}→${NC} 启动 frp 服务..."
systemctl enable frps
systemctl start frps

# 检查状态
sleep 2
if systemctl is-active --quiet frps; then
    echo -e "${GREEN}✓${NC} frp 服务启动成功！"
else
    echo -e "${RED}✗${NC} frp 服务启动失败！"
    echo "查看日志: journalctl -u frps -n 50"
    exit 1
fi

# 清理
cd /tmp
rm -rf "${FRP_PACKAGE}" "${FRP_PACKAGE}.tar.gz"

# 显示总结
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}安装完成！${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}重要信息（请保存）：${NC}"
echo ""
echo "服务器地址: $(hostname -I | awk '{print $1}')"
echo "frp 端口: 7000"
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):7500"
echo "Dashboard 用户名: admin"
echo "Dashboard 密码: ${RANDOM_DASHBOARD_PWD}"
echo ""
echo -e "${RED}认证 Token（客户端需要）：${NC}"
echo "${RANDOM_TOKEN}"
echo ""
echo -e "${YELLOW}请将以上信息保存到客户端配置文件！${NC}"
echo ""
echo "配置文件位置: ${CONFIG_DIR}/frps.ini"
echo "日志位置: ${LOG_DIR}/frps.log"
echo ""
echo "常用命令："
echo "  启动服务: systemctl start frps"
echo "  停止服务: systemctl stop frps"
echo "  重启服务: systemctl restart frps"
echo "  查看状态: systemctl status frps"
echo "  查看日志: journalctl -u frps -f"
echo ""
