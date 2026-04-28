// P-MAS Dev Server Watchdog
// Checks every 30 seconds if Next.js dev server is alive on port 3000
// Restarts it if dead

const PORT = 3031
const CHECK_INTERVAL = 30_000 // 30 seconds
const SERVER_PORT = 3000
const SERVER_STARTUP_WAIT = 8_000 // 8 seconds for Turbopack compile

async function checkServer(): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${SERVER_PORT}/`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.status === 200
  } catch {
    return false
  }
}

async function restartServer(): Promise<boolean> {
  console.log(`[${new Date().toISOString()}] Server is dead. Restarting...`)

  // Kill any existing process
  const proc = Bun.spawn(['pkill', '-f', 'next dev'], { stderr: 'pipe' })
  await proc.exited

  await Bun.sleep(2000)

  // Start server with disown
  const startProc = Bun.spawn(
    ['bash', '-c', `cd /home/z/my-project && npx next dev -p ${SERVER_PORT} </dev/null >/tmp/zdev.log 2>&1 & disown`],
    { stderr: 'pipe' }
  )
  await startProc.exited

  // Wait for compilation
  await Bun.sleep(SERVER_STARTUP_WAIT)

  // Verify
  const alive = await checkServer()
  console.log(`[${new Date().toISOString()}] Server restart ${alive ? 'SUCCESS' : 'FAILED'}`)
  return alive
}

async function watchdogLoop() {
  console.log(`[${new Date().toISOString()}] Watchdog started. Checking every ${CHECK_INTERVAL / 1000}s`)

  // Initial check
  let alive = await checkServer()
  console.log(`[${new Date().toISOString()}] Initial check: ${alive ? 'ALIVE' : 'DEAD'}`)

  if (!alive) {
    await restartServer()
  }

  // Main loop
  while (true) {
    await Bun.sleep(CHECK_INTERVAL)
    alive = await checkServer()

    if (!alive) {
      await restartServer()
    } else {
      // Quiet heartbeat — only log every 10th check (5 min)
      const now = new Date()
      if (now.getMinutes() % 5 === 0 && now.getSeconds() < 30) {
        console.log(`[${now.toISOString()}] Heartbeat: server alive`)
      }
    }
  }
}

// Health check HTTP server on watchdog port
const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'watchdog', port: PORT })
    }
    return Response.json({ error: 'Not found' }, { status: 404 })
  },
})

console.log(`Watchdog health endpoint: http://127.0.0.1:${PORT}/health`)

// Start watchdog loop
watchdogLoop()
