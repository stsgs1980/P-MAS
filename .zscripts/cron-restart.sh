#!/bin/bash
# P-MAS Cron Restart - called by cron scheduler every 3 minutes
# Checks if server is alive, restarts if dead

PROJECT_DIR="/home/z/my-project/P-MAS"
LOG_FILE="/tmp/zdev.log"
PORT=3000

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
    disown
    sleep 8
}

code=$(health)
if [ "$code" = "200" ]; then
    echo "OK"
    exit 0
fi

echo "DOWN (HTTP=$code), restarting..."
kill_all
start
code=$(health)
echo "Result: HTTP=$code"
