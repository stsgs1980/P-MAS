import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: { children: true, twin: true, twinOf: true, tasks: true },
      orderBy: { createdAt: 'asc' }
    })

    // Build tree structure
    const agentMap = new Map(agents.map(a => [a.id, { ...a, children: [] as any[] }]))
    const roots: any[] = []

    for (const agent of agentMap.values()) {
      if (agent.parentId && agentMap.has(agent.parentId)) {
        agentMap.get(agent.parentId)!.children.push(agent)
      } else {
        roots.push(agent)
      }
    }

    // Group by roleGroup
    const groups = {
      'Стратегия': agents.filter(a => a.roleGroup === 'Стратегия'),
      'Тактика': agents.filter(a => a.roleGroup === 'Тактика'),
      'Контроль': agents.filter(a => a.roleGroup === 'Контроль'),
      'Исполнение': agents.filter(a => a.roleGroup === 'Исполнение'),
    }

    // Stats
    const stats = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      idle: agents.filter(a => a.status === 'idle').length,
      error: agents.filter(a => a.status === 'error').length,
      offline: agents.filter(a => a.status === 'offline').length,
    }

    return NextResponse.json({ roots, groups, stats, agents })
  } catch (error) {
    console.error('Failed to fetch hierarchy:', error)
    return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
  }
}
