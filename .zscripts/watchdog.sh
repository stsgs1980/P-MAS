#!/bin/bash
# P-MAS Watchdog v2.2 (one-shot)
# Usage: bash watchdog.sh [--force|--status]

PROJECT_DIR="/home/z/my-project/P-MAS"
LOG_FILE="/tmp/zdev.log"
PORT=3000

ts() { date '+%Y-%m-%d %H:%M:%S'; }

health() {
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 --max-time 5 "http://127.0.0.1:$PORT/" 2>/dev/null)
    echo "${code:-000}"
}

kill_all() {
    pkill -9 -f 'next dev' 2>/dev/null || true
    sleep 1
}

start() {
    cd "$PROJECT_DIR"
    : > "$LOG_FILE"
    nohup npx next dev -p "$PORT" </dev/null >>"$LOG_FILE" 2>&1 &
    sleep 8
}

case "${1:-}" in
    --status|-s)
        code=$(health)
        pid=$(pgrep -f 'next dev' 2>/dev/null | head -1 || true)
        echo "[$(ts)] PID=${pid:-none} HTTP=$code"
        ;;
    --force|-f)
        echo "[$(ts)] FORCE restart"
        kill_all
        start
        code=$(health)
        echo "[$(ts)] Result: HTTP=$code"
        ;;
    *)
        code=$(health)
        if [ "$code" = "200" ]; then exit 0; fi
        echo "[$(ts)] DOWN (HTTP=$code), restarting..."
        kill_all
        start
        code=$(health)
        echo "[$(ts)] Result: HTTP=$code"
        if [ "$code" != "200" ]; then
            echo "[$(ts)] Retry in 10s..."
            sleep 10
            kill_all
            start
            code=$(health)
            echo "[$(ts)] Retry: HTTP=$code"
        fi
        ;;
esac
