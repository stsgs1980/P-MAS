import { NextResponse } from 'next/server'

// Health check + auto-restart hint for external watchdog
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'p-mas',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
