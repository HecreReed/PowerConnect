#!/bin/bash

# ====================================================
# SSH 反向隧道管理脚本
# 最简单的内网穿透方案，只需要 SSH
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

# 配置
PID_FILE="${PID_DIR:-$HOME/.remote-tunnel/pids}/ssh-tunnel.pid"
LOG_FILE="${LOG_DIR:-$HOME/.remote-tunnel/logs}/ssh-tunnel.log"

# 创建目录
mkdir -p "$(dirname "${PID_FILE}")"
mkdir -p "$(dirname "${LOG_FILE}")"

# SSH 选项
SSH_OPTS="-N -T"
SSH_OPTS="${SSH_OPTS} -o ServerAliveInterval=${SSH_KEEPALIVE_INTERVAL:-60}"
SSH_OPTS="${SSH_OPTS} -o ServerAliveCountMax=${SSH_KEEPALIVE_COUNT:-3}"
SSH_OPTS="${SSH_OPTS} -o ExitOnForwardFailure=yes"
SSH_OPTS="${SSH_OPTS} -o StrictHostKeyChecking=no"

# 如果配置了密钥
if [[ -n "${SSH_KEY}" && -f "${SSH_KEY}" ]]; then
    SSH_OPTS="${SSH_OPTS} -i ${SSH_KEY}"
fi

# ====================================================
# 函数定义
# ====================================================

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

# 启动隧道
start_tunnel() {
    if is_running; then
        echo -e "${YELLOW}⚠${NC}  SSH 隧道已在运行中 (PID: $(cat ${PID_FILE}))"
        return 0
    fi

    echo -e "${YELLOW}→${NC} 启动 SSH 反向隧道..."
    echo "   本地端口: ${LOCAL_PORT}"
    echo "   远程端口: ${REMOTE_PORT}"
    echo "   服务器: ${SSH_USER}@${SERVER_HOST}:${SSH_PORT}"

    # 检查 SSH 连接
    echo -e "${YELLOW}→${NC} 测试 SSH 连接..."
    if ! ssh ${SSH_OPTS} -p ${SSH_PORT} ${SSH_USER}@${SERVER_HOST} -O check 2>/dev/null; then
        echo "   首次连接，可能需要输入密码..."
    fi

    # 启动反向隧道
    # -R 远程端口:本地地址:本地端口
    ssh ${SSH_OPTS} \
        -p ${SSH_PORT} \
        -R ${REMOTE_PORT}:localhost:${LOCAL_PORT} \
        ${SSH_USER}@${SERVER_HOST} \
        >> "${LOG_FILE}" 2>&1 &

    local pid=$!
    echo ${pid} > "${PID_FILE}"

    # 等待连接建立
    sleep 2

    if is_running; then
        echo -e "${GREEN}✓${NC} SSH 隧道启动成功 (PID: ${pid})"
        echo ""
        show_access_info
        return 0
    else
        echo -e "${RED}✗${NC} SSH 隧道启动失败！"
        echo "查看日志: tail -f ${LOG_FILE}"
        return 1
    fi
}

# 停止隧道
stop_tunnel() {
    if ! is_running; then
        echo -e "${YELLOW}⚠${NC}  SSH 隧道未运行"
        return 0
    fi

    local pid=$(cat "${PID_FILE}")
    echo -e "${YELLOW}→${NC} 停止 SSH 隧道 (PID: ${pid})..."

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
    echo -e "${GREEN}✓${NC} SSH 隧道已停止"
}

# 重启隧道
restart_tunnel() {
    echo -e "${YELLOW}→${NC} 重启 SSH 隧道..."
    stop_tunnel
    sleep 1
    start_tunnel
}

# 查看状态
status() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}SSH 隧道状态${NC}"
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

        # 检查远程端口是否监听
        echo -e "${YELLOW}→${NC} 检查远程端口..."
        if ssh -p ${SSH_PORT} ${SSH_USER}@${SERVER_HOST} "ss -tlnp | grep :${REMOTE_PORT}" 2>/dev/null | grep -q LISTEN; then
            echo -e "${GREEN}✓${NC} 远程端口 ${REMOTE_PORT} 正在监听"
        else
            echo -e "${RED}✗${NC} 远程端口可能未正常监听"
        fi
    else
        echo -e "状态: ${RED}未运行${NC}"
    fi

    echo ""
    echo "日志文件: ${LOG_FILE}"
    echo ""
}

# 显示访问信息
show_access_info() {
    echo -e "${BLUE}访问信息:${NC}"
    echo "  外网地址: http://${SERVER_HOST}:${REMOTE_PORT}"
    echo "  本地服务: http://localhost:${LOCAL_PORT}"
    echo ""
}

# 查看日志
logs() {
    if [[ ! -f "${LOG_FILE}" ]]; then
        echo -e "${YELLOW}⚠${NC}  日志文件不存在"
        return
    fi

    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}SSH 隧道日志（最后 50 行）${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    tail -n 50 "${LOG_FILE}"
    echo ""
    echo "实时查看: tail -f ${LOG_FILE}"
}

# 测试连接
test_connection() {
    echo -e "${YELLOW}→${NC} 测试 SSH 连接..."

    if ssh -p ${SSH_PORT} -o ConnectTimeout=5 ${SSH_USER}@${SERVER_HOST} "echo 'SSH 连接成功'" 2>&1; then
        echo -e "${GREEN}✓${NC} SSH 连接正常"
        return 0
    else
        echo -e "${RED}✗${NC} SSH 连接失败"
        return 1
    fi
}

# 监控模式（自动重连）
monitor() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}SSH 隧道监控模式${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    echo "自动重连已启用，按 Ctrl+C 退出"
    echo ""

    while true; do
        if ! is_running; then
            echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} 隧道断开，正在重连..."
            start_tunnel || true
        fi

        sleep ${RECONNECT_INTERVAL:-5}
    done
}

# 配置 SSH 密钥（可选）
setup_ssh_key() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}配置 SSH 密钥认证${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""

    SSH_KEY="${HOME}/.ssh/id_rsa"

    if [[ -f "${SSH_KEY}" ]]; then
        echo -e "${GREEN}✓${NC} SSH 密钥已存在: ${SSH_KEY}"
    else
        echo -e "${YELLOW}→${NC} 生成 SSH 密钥..."
        ssh-keygen -t rsa -b 4096 -f "${SSH_KEY}" -N ""
        echo -e "${GREEN}✓${NC} SSH 密钥已生成"
    fi

    echo ""
    echo -e "${YELLOW}→${NC} 复制公钥到服务器..."
    echo "   服务器: ${SSH_USER}@${SERVER_HOST}"
    echo ""

    if ssh-copy-id -p ${SSH_PORT} ${SSH_USER}@${SERVER_HOST}; then
        echo -e "${GREEN}✓${NC} SSH 密钥已复制到服务器"
        echo ""
        echo "现在可以免密码连接服务器了！"
    else
        echo -e "${RED}✗${NC} 复制失败，请手动复制"
        echo ""
        echo "手动复制方法："
        echo "1. 查看公钥: cat ${SSH_KEY}.pub"
        echo "2. 登录服务器，添加到: ~/.ssh/authorized_keys"
    fi
}

# ====================================================
# 主逻辑
# ====================================================

case "${1:-}" in
    start)
        start_tunnel
        ;;
    stop)
        stop_tunnel
        ;;
    restart)
        restart_tunnel
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
    monitor)
        monitor
        ;;
    setup-key)
        setup_ssh_key
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs|test|monitor|setup-key}"
        echo ""
        echo "命令说明:"
        echo "  start      - 启动隧道"
        echo "  stop       - 停止隧道"
        echo "  restart    - 重启隧道"
        echo "  status     - 查看状态"
        echo "  logs       - 查看日志"
        echo "  test       - 测试连接"
        echo "  monitor    - 监控模式（自动重连）"
        echo "  setup-key  - 配置 SSH 密钥认证"
        exit 1
        ;;
esac
