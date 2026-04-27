import dagre from 'dagre'

export interface AgentData {
  id: string
  name: string
  role: string
  roleGroup: string
  status: string
  formula: string
  parentId?: string | null
  twinId?: string | null
  skills: string
  description: string
  avatar: string
  children?: AgentData[]
  tasks?: unknown[]
}

export type EdgeType = 'command' | 'sync' | 'twin' | 'delegate' | 'supervise' | 'broadcast'

export interface ConnectionData {
  id: string
  from: string
  to: string
  type: EdgeType
  strength?: number
}

// ─── Role configuration ────────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<string, { color: string; colorRgb: string; label: string; level: number }> = {
  'Стратегия':      { color: '#67E8F9', colorRgb: '103,232,249', label: 'Strategy',   level: 0 },
  'Тактика':        { color: '#22D3EE', colorRgb: '34,211,238',  label: 'Tactics',    level: 1 },
  'Контроль':       { color: '#06B6D4', colorRgb: '6,182,212',   label: 'Control',    level: 2 },
  'Исполнение':     { color: '#0891B2', colorRgb: '8,145,178',   label: 'Execution',  level: 3 },
  'Память':         { color: '#0E7490', colorRgb: '14,116,144',  label: 'Memory',     level: 4 },
  'Мониторинг':     { color: '#155E75', colorRgb: '21,94,117',   label: 'Monitoring', level: 4 },
  'Коммуникация':   { color: '#164E63', colorRgb: '22,78,99',    label: 'Comms',      level: 4 },
  'Обучение':       { color: '#0C4A6E', colorRgb: '12,74,110',   label: 'Learning',   level: 4 },
}

export const ROLE_ORDER = ['Стратегия', 'Тактика', 'Контроль', 'Исполнение', 'Память', 'Мониторинг', 'Коммуникация', 'Обучение']

export const STATUS_COLORS: Record<string, string> = {
  active: '#22D3EE',
  idle: '#6B7280',
  error: '#EF4444',
  offline: '#4B5563',
  paused: '#F59E0B',
  standby: '#8B5CF6',
}

export const EDGE_CONFIG: Record<EdgeType, { strokeDasharray: string; label: string; color: string; defaultVisible: boolean }> = {
  command:   { strokeDasharray: '',        label: 'Command',   color: '#22D3EE', defaultVisible: true },
  sync:      { strokeDasharray: '5 5',     label: 'Sync',     color: '#64748B', defaultVisible: true },
  twin:      { strokeDasharray: '8 4',     label: 'Twin',     color: '#0891B2', defaultVisible: true },
  delegate:  { strokeDasharray: '6 3',     label: 'Delegate', color: '#0891B2', defaultVisible: false },
  supervise: { strokeDasharray: '2 4',     label: 'Supervise',color: '#475569', defaultVisible: false },
  broadcast: { strokeDasharray: '12 4 2 4',label: 'Broadcast',color: '#0E7490', defaultVisible: false },
}

// ─── Dagre layout ──────────────────────────────────────────────────────────────

export interface NodePosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

// ─── Virtual layer nodes for Dagre rank constraints ──────────────────────────

export function computeDagreLayout(
  agents: AgentData[],
  connections: ConnectionData[],
  direction: 'TB' | 'LR' = 'TB'
): NodePosition[] {
  // Hybrid layout: use Dagre for X positioning within each layer,
  // but manually assign Y positions based on ROLE_CONFIG level.
  // This guarantees strict layer separation.

  const nodeWidth = 160
  const nodeHeight = 58
  const layerGap = 100
  const nodeSep = 50
  const marginX = 40
  const marginTop = 40

  // Group agents by level
  const layers: Record<number, AgentData[]> = {}
  for (const agent of agents) {
    const cfg = ROLE_CONFIG[agent.roleGroup]
    const level = cfg ? cfg.level : 4
    if (!layers[level]) layers[level] = []
    layers[level].push(agent)
  }

  const sortedLevels = Object.keys(layers).map(Number).sort((a, b) => a - b)

  // Use Dagre per-layer for X positioning
  const positions: Record<string, { x: number; y: number }> = {}
  let currentY = marginTop

  for (const level of sortedLevels) {
    const layerAgents = layers[level]
    if (layerAgents.length === 0) continue

    // Simple even distribution for X within each layer
    // (more readable than Dagre's LR mode for single-rank layers)
    const totalWidth = layerAgents.length * nodeWidth + (layerAgents.length - 1) * nodeSep
    let startX = marginX

    for (let i = 0; i < layerAgents.length; i++) {
      positions[layerAgents[i].id] = {
        x: startX + i * (nodeWidth + nodeSep),
        y: currentY,
      }
    }

    // Move Y down for next layer
    currentY += nodeHeight + layerGap
  }

  return agents.map(agent => {
    const pos = positions[agent.id] || { x: 0, y: 0 }
    return {
      id: agent.id,
      x: pos.x,
      y: pos.y,
      width: nodeWidth,
      height: nodeHeight,
    }
  })
}

// ─── Build connections from agent data ─────────────────────────────────────────

export function buildConnections(agents: AgentData[]): ConnectionData[] {
  const conns: ConnectionData[] = []
  const seen = new Set<string>()

  const addConn = (id: string, from: string, to: string, type: EdgeType, strength: number) => {
    if (seen.has(id)) return
    seen.add(id)
    conns.push({ id, from, to, type, strength })
  }

  // Command: parent → child
  for (const agent of agents) {
    if (agent.parentId) {
      addConn(`cmd-${agent.id}`, agent.parentId, agent.id, 'command', 1)
    }
  }

  // Sync: same roleGroup + same parent
  for (const group of ROLE_ORDER) {
    const groupAgents = agents.filter(a => a.roleGroup === group)
    for (let i = 0; i < groupAgents.length; i++) {
      for (let j = i + 1; j < groupAgents.length; j++) {
        const a1 = groupAgents[i]
        const a2 = groupAgents[j]
        if (a1.parentId === a2.parentId) {
          const key = [a1.id, a2.id].sort().join('-')
          addConn(`sync-${key}`, a1.id, a2.id, 'sync', 0.5)
        }
      }
    }
  }

  // Twin
  const twinSeen = new Set<string>()
  for (const agent of agents) {
    if (agent.twinId) {
      const key = [agent.id, agent.twinId].sort().join('-')
      if (!twinSeen.has(key)) {
        twinSeen.add(key)
        addConn(`twin-${key}`, agent.id, agent.twinId!, 'twin', 1)
      }
    }
  }

  // Delegate: Тактика coordinators → Исполнение agents without parent
  const taktikaAgents = agents.filter(a => a.roleGroup === 'Тактика')
  const ispolnenieAgents = agents.filter(a => a.roleGroup === 'Исполнение')
  for (const t of taktikaAgents) {
    if (t.role.toLowerCase().includes('coordinator')) {
      for (const e of ispolnenieAgents) {
        if (!e.parentId) {
          addConn(`delegate-${t.id}-${e.id}`, t.id, e.id, 'delegate', 0.7)
        }
      }
    }
  }

  // Supervise: Контроль → Исполнение
  const kontrolAgents = agents.filter(a => a.roleGroup === 'Контроль')
  for (const c of kontrolAgents) {
    for (const e of ispolnenieAgents) {
      const superviseCount = conns.filter(cn => cn.type === 'supervise' && cn.to === e.id).length
      if (superviseCount === 0) {
        addConn(`supervise-${c.id}-${e.id}`, c.id, e.id, 'supervise', 0.4)
        break
      }
    }
  }

  // Broadcast: root Strategy → all group leads
  const rootStrategy = agents.filter(a => a.roleGroup === 'Стратегия' && !a.parentId)
  for (const s of rootStrategy) {
    const groupLeads = agents.filter(a => !a.parentId && a.roleGroup !== 'Стратегия')
    for (const lead of groupLeads) {
      addConn(`broadcast-${s.id}-${lead.id}`, s.id, lead.id, 'broadcast', 0.5)
    }
  }

  return conns
}

// ─── Formula descriptions ──────────────────────────────────────────────────────

export const FORMULA_DESC: Record<string, string> = {
  CoT: 'Chain of Thought — step-by-step reasoning decomposition',
  ToT: 'Tree of Thoughts — explores multiple reasoning paths',
  GoT: 'Graph of Thoughts — models reasoning as a directed graph',
  AoT: 'Algorithm of Thoughts — algorithmic reasoning via LLM',
  SoT: 'Skeleton of Thought — outline first, then fill details',
  CoVe: 'Chain of Verification — validates outputs with self-checks',
  ReWOO: 'Research without Observation — plans then executes',
  Reflexion: 'Self-reflection — learns from past mistakes',
  ReAct: 'Reasoning + Action — interleaves thought and action',
  MoA: 'Mixture of Agents — combines multiple agent outputs',
  SelfRefine: 'Self-Refine — iteratively improves its own output',
  LATS: 'Language Agent Tree Search — MCTS + LLM reasoning',
  SelfConsistency: 'Self-Consistency — multiple paths + majority vote',
  PoT: 'Program of Thought — reasons via code execution',
  DSPy: 'DSPy — Declarative Self-Improving Prompt Optimization',
  PromptChaining: 'Prompt Chaining — Sequential task decomposition',
  LeastToMost: 'Least-to-Most — Progressive complexity reasoning',
  StepBack: 'Step-Back — Abstract before solving',
  PlanAndSolve: 'Plan-and-Solve — Two-phase approach',
  MetaCoT: 'Meta-Co-T — Meta-reasoning over CoT',
}
