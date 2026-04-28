#!/bin/bash
# Keepalive watchdog — restarts Next.js dev server when it dies
# Runs in infinite loop, checks every 10 seconds

PORT=3000
PROJECT_DIR="/home/z/my-project"
LOG="/tmp/zdev.log"

while true; do
  # Check if server responds
  if ! curl -s -o /dev/null -w '' http://127.0.0.1:$PORT/ 2>/dev/null; then
    echo "[$(date '+%H:%M:%S')] Server down, restarting..." >> "$LOG"
    pkill -f "next dev" 2>/dev/null
    sleep 1
    cd "$PROJECT_DIR" && npx next dev -p $PORT </dev/null >>"$LOG" 2>&1 &
    disown
    sleep 8
    if curl -s -o /dev/null http://127.0.0.1:$PORT/ 2>/dev/null; then
      echo "[$(date '+%H:%M:%S')] Server restarted OK" >> "$LOG"
    else
      echo "[$(date '+%H:%M:%S')] Server restart FAILED" >> "$LOG"
    fi
  fi
  sleep 10
done
