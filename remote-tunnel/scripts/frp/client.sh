#!/bin/bash

# ====================================================
# frp 客户端管理脚本
# 在家里的电脑上运行
# ====================================================

set -e

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 加载配置
CONFIG_FILE="${PROJECT_ROOT}/config/tunnel.conf"
if [[ -f "${CONFIG_FILE}" ]]; then
    source "${CONFIG_FILE}"
else
    echo "错误: 配置文件不存在: ${CONFIG_FILE}"
    exit 1
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认值
FRP_VERSION="${FRP_VERSION:-0.52.3}"
FRP_DIR="${HOME}/.remote-tunnel/frp"
FRP_CONFIG="${PROJECT_ROOT}/config/frp/frpc.ini"
PID_FILE="${PID_DIR:-$HOME/.remote-tunnel/pids}/frpc.pid"
LOG_FILE="${LOG_DIR:-$HOME/.remote-tunnel/logs}/frpc.log"

# 创建必要的目录
mkdir -p "${FRP_DIR}"
mkdir -p "$(dirname "${PID_FILE}")"
mkdir -p "$(dirname "${LOG_FILE}")"

# ====================================================
# 函数定义
# ====================================================

# 检查 frpc 是否已安装
check_frpc_installed() {
    if [[ -f "${FRP_DIR}/frpc" ]]; then
        return 0
    else
        return 1
    fi
}

# 安装 frpc
install_frpc() {
    echo -e "${YELLOW}→${NC} frpc 未安装，开始安装..."

    # 检测架构
    ARCH=$(uname -m)
    case ${ARCH} in
        x86_64)
            FRP_ARCH="amd64"
            ;;
        arm64|aarch64)
            FRP_ARCH="arm64"
            ;;
        armv7l)
            FRP_ARCH="arm"
            ;;
        *)
            echo -e "${RED}✗${NC} 不支持的系统架构: ${ARCH}"
            exit 1
            ;;
    esac

    # 检测操作系统
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')

    FRP_PACKAGE="frp_${FRP_VERSION}_${OS}_${FRP_ARCH}"
    DOWNLOAD_URL="https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/${FRP_PACKAGE}.tar.gz"

    echo "   下载 frp ${FRP_VERSION} for ${OS}/${FRP_ARCH}..."

    cd /tmp
    if ! curl -L -o "${FRP_PACKAGE}.tar.gz" "${DOWNLOAD_URL}"; then
        echo -e "${RED}✗${NC} 下载失败！尝试使用镜像..."
        DOWNLOAD_URL="https://ghproxy.com/${DOWNLOAD_URL}"
        if ! curl -L -o "${FRP_PACKAGE}.tar.gz" "${DOWNLOAD_URL}"; then
            echo -e "${RED}✗${NC} 下载失败！请检查网络"
            exit 1
        fi
    fi

    echo "   解压..."
    tar -xzf "${FRP_PACKAGE}.tar.gz"

    echo "   安装..."
    cp "${FRP_PACKAGE}/frpc" "${FRP_DIR}/"
    chmod +x "${FRP_DIR}/frpc"

    # 清理
    rm -rf "${FRP_PACKAGE}" "${FRP_PACKAGE}.tar.gz"

    echo -e "${GREEN}✓${NC} frpc 安装完成"
}

# 检查配置文件
check_config() {
    if [[ ! -f "${FRP_CONFIG}" ]]; then
        echo -e "${RED}✗${NC} 配置文件不存在: ${FRP_CONFIG}"
        exit 1
    fi

    # 检查是否还是默认 token
    if grep -q "change-this-to-random-token" "${FRP_CONFIG}"; then
        echo -e "${RED}✗${NC} 请先修改配置文件中的 token！"
        echo "   配置文件: ${FRP_CONFIG}"
        echo "   需要与服务器端的 token 一致"
        exit 1
    fi

    # 检查服务器地址
    if grep -q "154.37.220.3" "${FRP_CONFIG}"; then
        SERVER_ADDR=$(grep "server_addr" "${FRP_CONFIG}" | head -1 | awk '{print $3}')
        echo -e "${GREEN}✓${NC} 服务器地址: ${SERVER_ADDR}"
    fi
}

# 启动 frpc
start_frpc() {
    if is_running; then
        echo -e "${YELLOW}⚠${NC}  frpc 已在运行中 (PID: $(cat ${PID_FILE}))"
        return 0
    fi

    echo -e "${YELLOW}→${NC} 启动 frpc..."

    # 检查是否已安装
    if ! check_frpc_installed; then
        install_frpc
    fi

    # 检查配置
    check_config

    # 启动
    nohup "${FRP_DIR}/frpc" -c "${FRP_CONFIG}" >> "${LOG_FILE}" 2>&1 &
    local pid=$!
    echo ${pid} > "${PID_FILE}"

    # 等待启动
    sleep 2

    if is_running; then
        echo -e "${GREEN}✓${NC} frpc 启动成功 (PID: ${pid})"
        echo ""
        show_access_info
        return 0
    else
        echo -e "${RED}✗${NC} frpc 启动失败！"
        echo "查看日志: tail -f ${LOG_FILE}"
        return 1
    fi
}

# 停止 frpc
stop_frpc() {
    if ! is_running; then
        echo -e "${YELLOW}⚠${NC}  frpc 未运行"
        return 0
    fi

    local pid=$(cat "${PID_FILE}")
    echo -e "${YELLOW}→${NC} 停止 frpc (PID: ${pid})..."

    kill ${pid} 2>/dev/null || true

    # 等待进程结束
    local count=0
    while kill -0 ${pid} 2>/dev/null && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done

    # 强制杀死
    if kill -0 ${pid} 2>/dev/null; then
        echo "   强制停止..."
        kill -9 ${pid} 2>/dev/null || true
    fi

    rm -f "${PID_FILE}"
    echo -e "${GREEN}✓${NC} frpc 已停止"
}

# 检查是否运行中
is_running() {
    if [[ -f "${PID_FILE}" ]]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 ${pid} 2>/dev/null; then
            return 0
        else
            rm -f "${PID_FILE}"
            return 1
        fi
    fi
    return 1
}

# 查看状态
status() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}frp 隧道状态${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""

    if is_running; then
        local pid=$(cat "${PID_FILE}")
        echo -e "状态: ${GREEN}运行中${NC}"
        echo "PID: ${pid}"

        # 显示进程信息
        if command -v ps &> /dev/null; then
            echo ""
            echo "进程信息:"
            ps -p ${pid} -o pid,ppid,user,%cpu,%mem,etime,command | tail -n +2
        fi

        echo ""
        show_access_info
    else
        echo -e "状态: ${RED}未运行${NC}"
    fi

    echo ""
    echo "配置文件: ${FRP_CONFIG}"
    echo "日志文件: ${LOG_FILE}"
    echo ""
}

# 显示访问信息
show_access_info() {
    echo -e "${BLUE}访问信息:${NC}"
    echo "  外网地址: http://${SERVER_HOST}:${REMOTE_PORT}"
    echo "  本地服务: http://localhost:${LOCAL_PORT}"
    echo ""
    echo "  frp 管理面板: http://localhost:${FRP_ADMIN_PORT:-7400}"
    echo ""
}

# 查看日志
logs() {
    if [[ ! -f "${LOG_FILE}" ]]; then
        echo -e "${YELLOW}⚠${NC}  日志文件不存在"
        return
    fi

    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}frpc 日志（最后 50 行）${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    tail -n 50 "${LOG_FILE}"
    echo ""
    echo "实时查看: tail -f ${LOG_FILE}"
}

# 重启
restart() {
    echo -e "${YELLOW}→${NC} 重启 frpc..."
    stop_frpc
    sleep 1
    start_frpc
}

# 测试连接
test_connection() {
    echo -e "${YELLOW}→${NC} 测试服务器连接..."

    if ! command -v nc &> /dev/null; then
        echo -e "${RED}✗${NC} 需要安装 netcat (nc)"
        return 1
    fi

    if nc -zv ${SERVER_HOST} ${FRP_BIND_PORT} 2>&1 | grep -q succeeded; then
        echo -e "${GREEN}✓${NC} 服务器连接正常"
        return 0
    else
        echo -e "${RED}✗${NC} 无法连接到服务器 ${SERVER_HOST}:${FRP_BIND_PORT}"
        return 1
    fi
}

# ====================================================
# 主逻辑
# ====================================================

case "${1:-}" in
    start)
        start_frpc
        ;;
    stop)
        stop_frpc
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    test)
        test_connection
        ;;
    install)
        install_frpc
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs|test|install}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动隧道"
        echo "  stop    - 停止隧道"
        echo "  restart - 重启隧道"
        echo "  status  - 查看状态"
        echo "  logs    - 查看日志"
        echo "  test    - 测试服务器连接"
        echo "  install - 安装 frpc"
        exit 1
        ;;
esac
