#!/bin/bash
# P-MAS Dev Server Keepalive
# Runs Next.js dev server, auto-restarts on crash
# Usage: bash /home/z/my-project/keep-alive.sh &

while true; do
  echo "[$(date)] Starting Next.js dev server..."
  cd /home/z/my-project
  npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 3s..."
  sleep 3
done
