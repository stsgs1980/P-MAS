import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type EdgeType = 'command' | 'sync' | 'twin' | 'delegate' | 'supervise' | 'broadcast'

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
      'Стратегия': agents.filter(a => a.roleGroup === 'Стратегия'),
      'Тактика': agents.filter(a => a.roleGroup === 'Тактика'),
      'Контроль': agents.filter(a => a.roleGroup === 'Контроль'),
      'Исполнение': agents.filter(a => a.roleGroup === 'Исполнение'),
      'Память': agents.filter(a => a.roleGroup === 'Память'),
      'Мониторинг': agents.filter(a => a.roleGroup === 'Мониторинг'),
      'Коммуникация': agents.filter(a => a.roleGroup === 'Коммуникация'),
      'Обучение': agents.filter(a => a.roleGroup === 'Обучение'),
    }

    // Stats
    const stats = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      idle: agents.filter(a => a.status === 'idle').length,
      error: agents.filter(a => a.status === 'error').length,
      offline: agents.filter(a => a.status === 'offline').length,
      paused: agents.filter(a => a.status === 'paused').length,
      standby: agents.filter(a => a.status === 'standby').length,
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

    // 4. Delegate edges: Тактика coordinator delegates to Исполнение agents
    const taktikaGroup = groups['Тактика'] || []
    const ispolnenieGroup = groups['Исполнение'] || []
    const coordinator = taktikaGroup.find(a => a.role === 'Tactical Coordinator')
    if (coordinator) {
      for (const execAgent of ispolnenieGroup) {
        connections.push({
          id: `delegate-${coordinator.id}-${execAgent.id}`,
          from: coordinator.id,
          to: execAgent.id,
          type: 'delegate',
          strength: 0.8,
        })
      }
    }

    // 5. Supervise edges: Контроль agents supervise Исполнение agents
    const kontrolGroup = groups['Контроль'] || []
    for (const controlAgent of kontrolGroup) {
      for (const execAgent of ispolnenieGroup) {
        connections.push({
          id: `supervise-${controlAgent.id}-${execAgent.id}`,
          from: controlAgent.id,
          to: execAgent.id,
          type: 'supervise',
          strength: 0.6,
        })
      }
    }

    // 6. Broadcast edges: Стратегия root agents broadcast to group leads in all other groups
    const strategiyaGroup = groups['Стратегия'] || []
    const strategiyaRoots = strategiyaGroup.filter(a => !a.parentId)
    const otherGroupLeadIds: string[] = []
    for (const [groupName, groupAgents] of Object.entries(groups)) {
      if (groupName === 'Стратегия') continue
      // Group lead = agent with no parent in that group, or first agent
      const lead = groupAgents.find(a => !a.parentId) || groupAgents[0]
      if (lead) otherGroupLeadIds.push(lead.id)
    }
    for (const rootAgent of strategiyaRoots) {
      for (const leadId of otherGroupLeadIds) {
        connections.push({
          id: `broadcast-${rootAgent.id}-${leadId}`,
          from: rootAgent.id,
          to: leadId,
          type: 'broadcast',
          strength: 0.7,
        })
      }
    }

    return NextResponse.json({ roots, groups, stats, agents, connections })
  } catch (error) {
    console.error('Failed to fetch hierarchy:', error)
    return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 })
  }
}
