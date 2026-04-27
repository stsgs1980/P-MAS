#!/bin/bash
# P-MAS Dev Server Watchdog Loop v2.2
# Background daemon: checks server every 180s, restarts if down.
# Start: nohup bash /home/z/my-project/P-MAS/.zscripts/watchdog-loop.sh &
# Stop:  pkill -f watchdog-loop

PROJECT_DIR="/home/z/my-project/P-MAS"
LOG_FILE="/tmp/zdev.log"
WATCHDOG_LOG="/home/z/my-project/P-MAS/.zscripts/watchdog.log"
PORT=3000
CHECK_INTERVAL=180

ts() { date '+%Y-%m-%d %H:%M:%S'; }

health() {
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 --max-time 5 "http://127.0.0.1:$PORT/" 2>/dev/null)
    # If curl fails completely, code will be empty
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

log() {
    echo "[$(ts)] $*" >> "$WATCHDOG_LOG"
}

# Prevent multiple instances
LOCK_FILE="/tmp/watchdog-loop.pid"
if [ -f "$LOCK_FILE" ]; then
    OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null || true)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[$(ts)] Watchdog loop already running (PID $OLD_PID), exiting." >&2
        exit 0
    fi
fi
echo $$ > "$LOCK_FILE"

log "Watchdog loop started (PID $$, interval=${CHECK_INTERVAL}s)"

# Initial start
code=$(health)
if [ "$code" != "200" ]; then
    log "Initial: server down (HTTP=$code), starting..."
    kill_all
    start
    code=$(health)
    log "Initial result: HTTP=$code"
fi

# Main loop
while true; do
    sleep "$CHECK_INTERVAL"
    code=$(health)
    if [ "$code" = "200" ]; then
        continue
    fi
    log "DOWN (HTTP=$code), restarting..."
    kill_all
    start
    code=$(health)
    log "Restart: HTTP=$code"
    if [ "$code" != "200" ]; then
        log "Retry in 10s..."
        sleep 10
        kill_all
        start
        code=$(health)
        log "Retry: HTTP=$code"
    fi
    # Rotate log if >1MB
    if [ -f "$WATCHDOG_LOG" ] && [ "$(stat -c%s "$WATCHDOG_LOG" 2>/dev/null || echo 0)" -gt 1048576 ]; then
        mv "$WATCHDOG_LOG" "${WATCHDOG_LOG}.old"
        log "Log rotated"
    fi
done
