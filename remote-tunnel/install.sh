#!/bin/bash

# ====================================================
# Remote Tunnel 安装脚本
# 在家里的电脑上运行
# ====================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="remote-tunnel"
INSTALL_DIR="${HOME}/.remote-tunnel"
BIN_DIR="${HOME}/.local/bin"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Remote Tunnel 安装程序${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# 创建目录
echo -e "${YELLOW}→${NC} 创建目录..."
mkdir -p "${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}/logs"
mkdir -p "${INSTALL_DIR}/pids"
mkdir -p "${BIN_DIR}"

# 复制文件
echo -e "${YELLOW}→${NC} 安装文件..."

# 如果当前目录就是 remote-tunnel，直接使用
if [[ $(basename "${SCRIPT_DIR}") == "${PROJECT_NAME}" ]]; then
    INSTALL_DIR="${SCRIPT_DIR}"
    echo "   检测到在项目目录中运行，使用当前目录"
else
    # 否则复制文件
    cp -r "${SCRIPT_DIR}"/* "${INSTALL_DIR}/"
    echo "   文件已复制到: ${INSTALL_DIR}"
fi

# 创建符号链接
echo -e "${YELLOW}→${NC} 创建命令链接..."
ln -sf "${INSTALL_DIR}/bin/remote-tunnel" "${BIN_DIR}/remote-tunnel"
chmod +x "${BIN_DIR}/remote-tunnel"

echo -e "${GREEN}✓${NC} 命令链接已创建: ${BIN_DIR}/remote-tunnel"

# 检查 PATH
echo ""
echo -e "${YELLOW}→${NC} 检查 PATH 环境变量..."

if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
    echo -e "${YELLOW}⚠${NC}  ${BIN_DIR} 不在 PATH 中"
    echo ""
    echo "需要将以下内容添加到你的 shell 配置文件中："
    echo ""

    # 检测 shell
    if [[ -n "${ZSH_VERSION}" ]] || [[ "${SHELL}" == *"zsh"* ]]; then
        SHELL_RC="${HOME}/.zshrc"
    else
        SHELL_RC="${HOME}/.bashrc"
    fi

    echo "export PATH=\"\${HOME}/.local/bin:\${PATH}\""
    echo ""
    read -p "是否自动添加到 ${SHELL_RC}? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "" >> "${SHELL_RC}"
        echo "# Remote Tunnel" >> "${SHELL_RC}"
        echo "export PATH=\"\${HOME}/.local/bin:\${PATH}\"" >> "${SHELL_RC}"
        echo -e "${GREEN}✓${NC} 已添加到 ${SHELL_RC}"
        echo "   请运行: source ${SHELL_RC}"
    fi
else
    echo -e "${GREEN}✓${NC} PATH 配置正确"
fi

# 配置文件
echo ""
echo -e "${YELLOW}→${NC} 检查配置文件..."

CONFIG_FILE="${INSTALL_DIR}/config/tunnel.conf"
if [[ -f "${CONFIG_FILE}" ]]; then
    # 检查是否需要更新
    if grep -q "154.37.220.3" "${CONFIG_FILE}"; then
        echo -e "${GREEN}✓${NC} 配置文件已存在"
        echo ""
        echo -e "${YELLOW}请编辑配置文件，设置正确的参数：${NC}"
        echo "   配置文件: ${CONFIG_FILE}"
        echo ""
        echo "   需要配置的项:"
        echo "   - SERVER_HOST (服务器 IP)"
        echo "   - SSH_USER (SSH 用户名)"
        echo "   - LOCAL_PORT (本地服务端口)"
        echo "   - REMOTE_PORT (远程暴露端口)"
        echo ""
    fi
else
    echo -e "${RED}✗${NC} 配置文件不存在"
    exit 1
fi

# 显示下一步
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✓ 安装完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo ""
echo "1. 【服务器端】在你的云服务器 (154.37.220.3) 上运行:"
echo "   ${BLUE}bash <(curl -fsSL https://raw.githubusercontent.com/yourusername/PowerConnect/main/remote-tunnel/scripts/frp/setup-server.sh)${NC}"
echo ""
echo "   或者手动上传并运行:"
echo "   scp ${INSTALL_DIR}/scripts/frp/setup-server.sh root@154.37.220.3:/tmp/"
echo "   ssh root@154.37.220.3 'bash /tmp/setup-server.sh'"
echo ""
echo "2. 【客户端】将服务器返回的 token 填入配置文件:"
echo "   nano ${CONFIG_FILE}"
echo ""
echo "3. 启动隧道:"
echo "   ${BLUE}remote-tunnel up${NC}"
echo ""
echo "常用命令:"
echo "  remote-tunnel up       - 启动隧道"
echo "  remote-tunnel down     - 停止隧道"
echo "  remote-tunnel status   - 查看状态"
echo "  remote-tunnel logs     - 查看日志"
echo "  remote-tunnel doctor   - 诊断问题"
echo "  remote-tunnel help     - 查看帮助"
echo ""
echo "快速测试:"
echo "  1. 先启动 PowerConnect: cd PowerConnect/backend && npm start"
echo "  2. 启动隧道: remote-tunnel up"
echo "  3. 外网访问: http://154.37.220.3:8443"
echo ""
