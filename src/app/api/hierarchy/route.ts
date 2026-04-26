import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type EdgeType = 'command' | 'sync' | 'twin'

interface TypedConnection {
  id: string
  from: string
  to: string
  type: EdgeType
  strength: number
}

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
      '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f': agents.filter(a => a.roleGroup === '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f'),
      '\u0422\u0430\u043a\u0442\u0438\u043a\u0430': agents.filter(a => a.roleGroup === '\u0422\u0430\u043a\u0442\u0438\u043a\u0430'),
      '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c': agents.filter(a => a.roleGroup === '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c'),
      '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435': agents.filter(a => a.roleGroup === '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435'),
    }

    // Stats
    const stats = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      idle: agents.filter(a => a.status === 'idle').length,
      error: agents.filter(a => a.status === 'error').length,
      offline: agents.filter(a => a.status === 'offline').length,
      tasks: agents.reduce((sum, a) => sum + (a.tasks?.length || 0), 0),
    }

    // Build typed connections
    const connections: TypedConnection[] = []

    // 1. Command edges: parent -> child
    for (const agent of agents) {
      if (agent.parentId) {
        connections.push({
          id: `cmd-${agent.id}-${agent.parentId}`,
          from: agent.parentId,
          to: agent.id,
          type: 'command',
          strength: 1,
        })
      }
    }

    // 2. Sync edges: between agents in same roleGroup with same parent (siblings)
    const syncSeen = new Set<string>()
    for (const group of Object.values(groups)) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a1 = group[i]
          const a2 = group[j]
          if (a1.parentId === a2.parentId) {
            const key = [a1.id, a2.id].sort().join('-')
            if (!syncSeen.has(key)) {
              syncSeen.add(key)
              connections.push({
                id: `sync-${key}`,
                from: a1.id,
                to: a2.id,
                type: 'sync',
                strength: 0.5,
              })
            }
          }
        }
      }
    }

    // 3. Twin edges
    const twinSeen = new Set<string>()
    for (const agent of agents) {
      if (agent.twinId) {
        const key = [agent.id, agent.twinId].sort().join('-')
        if (!twinSeen.has(key)) {
          twinSeen.add(key)
          connections.push({
            id: `twin-${key}`,
            from: agent.id,
            to: agent.twinId,
            type: 'twin',
            strength: 1,
          })
        }
      }
    }

    return NextResponse.json({ roots, groups, stats, agents, connections })
  } catch (error) {
    console.error('Failed to fetch hierarchy:', error)
    return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
  }
}
