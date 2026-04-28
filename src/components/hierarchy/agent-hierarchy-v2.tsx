'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { io as socketIO, Socket } from 'socket.io-client'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  RefreshCw,
  Search,
  LayoutGrid,
  Circle,
  Grid3X3,
  Home,
  ChevronRight,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Crosshair,
  Layers,
  ArrowUpDown,
} from 'lucide-react'

import { AgentNode } from './agent-node'
import { AgentEdge } from './agent-edge'
import { GroupSidebar, DetailPanel, KPIStrip } from './panels'
import {
  computeDagreLayout,
  computeRadialLayout,
  computeGridLayout,
  buildConnections,
  ROLE_CONFIG,
  ROLE_ORDER,
  EDGE_CONFIG,
  FORMULA_DESC,
  type AgentData,
  type ConnectionData,
  type EdgeType,
  type ViewMode,
} from './types'
import { fetchWithRetry } from '@/lib/client-fetch'

// ─── Node / Edge types ─────────────────────────────────────────────────────────

const nodeTypes = { agentNode: AgentNode }
const edgeTypes = { agentEdge: AgentEdge }

// ─── Layer labels for DAG visualization ────────────────────────────────────────

const LAYER_LABELS = [
  { level: 0, label: 'L0', fullLabel: 'Strategy', color: '#67E8F9', colorRgb: '103,232,249', desc: 'Strategic planning & vision' },
  { level: 1, label: 'L1', fullLabel: 'Tactics', color: '#22D3EE', colorRgb: '34,211,238', desc: 'Coordination & delegation' },
  { level: 2, label: 'L2', fullLabel: 'Control', color: '#06B6D4', colorRgb: '6,182,212', desc: 'Quality & safety oversight' },
  { level: 3, label: 'L3', fullLabel: 'Execution', color: '#0891B2', colorRgb: '8,145,178', desc: 'Task execution & testing' },
  { level: 4, label: 'L4', fullLabel: 'Support', color: '#0E7490', colorRgb: '14,116,144', desc: 'Memory, monitoring, comms, learning' },
]

// ─── Main component ────────────────────────────────────────────────────────────

export default function AgentHierarchy({ onBack }: { onBack?: () => void }) {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState<Set<EdgeType>>(
    new Set(Object.entries(EDGE_CONFIG).filter(([, v]) => v.defaultVisible).map(([k]) => k as EdgeType))
  )
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy')
  const [showLayers, setShowLayers] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReturnType<typeof Object> | null>(null)

  // ─── Add Agent modal state ───────────────────────────────────────────
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentRole, setNewAgentRole] = useState('')
  const [newAgentGroup, setNewAgentGroup] = useState('Исполнение')
  const [newAgentFormula, setNewAgentFormula] = useState('ReAct')
  const [newAgentStatus, setNewAgentStatus] = useState('active')
  const [newAgentSkills, setNewAgentSkills] = useState('')

  // ─── WebSocket connection for real-time updates ────────────────────────
  const [wsConnected, setWsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = socketIO('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[ws] connected')
      setWsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[ws] disconnected')
      setWsConnected(false)
    })

    socket.on('agents:snapshot', (data: { agents: AgentData[] }) => {
      if (data.agents && data.agents.length > 0) {
        setAgents(data.agents)
      }
    })

    socket.on('agent:status', (data: { agentId: string; newStatus: string; oldStatus: string; timestamp: string }) => {
      setAgents(prev => prev.map(a => a.id === data.agentId ? { ...a, status: data.newStatus } : a))
    })

    socket.on('agent:created', (data: { agent: AgentData }) => {
      setAgents(prev => {
        if (prev.some(a => a.id === data.agent.id)) return prev
        return [...prev, data.agent]
      })
      fetchAgents() // refetch to get updated connections
    })

    socket.on('agent:updated', (data: { agent: AgentData }) => {
      setAgents(prev => prev.map(a => a.id === data.agent.id ? { ...a, ...data.agent } : a))
    })

    socket.on('agent:deleted', (data: { agentId: string }) => {
      setAgents(prev => prev.filter(a => a.id !== data.agentId))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // ─── Fallback: simulate status transitions when WebSocket is disconnected ─
  useEffect(() => {
    if (wsConnected || agents.length === 0) return
    const statusCycle = ['active', 'idle', 'paused', 'standby'] as const
    const interval = setInterval(() => {
      const count = 1 + Math.floor(Math.random() * 2)
      setAgents(prev => {
        const next = [...prev]
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length)
          const agent = next[idx]
          const currentIdx = statusCycle.indexOf(agent.status as typeof statusCycle[number])
          const nextIdx = (currentIdx + 1 + Math.floor(Math.random() * (statusCycle.length - 1))) % statusCycle.length
          next[idx] = { ...agent, status: statusCycle[nextIdx] }
        }
        return next
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [wsConnected, agents.length])

  // ─── Connections (from API, with client-side fallback) ─────────────────
  const [apiConnections, setApiConnections] = useState<ConnectionData[]>([])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/hierarchy')
      const data = await res.json()
      setAgents(data.agents || [])
      // Use server-built connections (more accurate than client rebuild)
      if (Array.isArray(data.connections)) {
        setApiConnections(data.connections)
      }
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  // Fallback to client-side connections if API didn't provide them
  const clientConnections = useMemo(() => buildConnections(agents), [agents])
  const connections = apiConnections.length > 0 ? apiConnections : clientConnections

  // ─── Search matches ────────────────────────────────────────────────────
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    for (const agent of agents) {
      const skills = agent.skills ? agent.skills.toLowerCase() : ''
      if (agent.name.toLowerCase().includes(q) || agent.role.toLowerCase().includes(q) || skills.includes(q)) {
        matches.add(agent.id)
      }
    }
    return matches
  }, [agents, searchQuery])

  // ─── Build React Flow nodes ────────────────────────────────────────────
  const { positions } = useMemo(() => {
    let layoutPositions
    switch (viewMode) {
      case 'radial':
        layoutPositions = computeRadialLayout(agents)
        break
      case 'grid':
        layoutPositions = computeGridLayout(agents)
        break
      case 'hierarchy':
      default:
        layoutPositions = computeDagreLayout(agents, connections)
        break
    }
    const posMap: Record<string, { x: number; y: number }> = {}
    for (const p of layoutPositions) {
      posMap[p.id] = { x: p.x, y: p.y }
    }
    return { positions: posMap }
  }, [agents, connections, viewMode])

  const flowNodes: Node[] = useMemo(() => {
    return agents.map(agent => {
      const pos = positions[agent.id] || { x: 0, y: 0 }
      const isDimmed = (activeFilter && agent.roleGroup !== activeFilter) ||
        (searchQuery.trim() && !searchMatches.has(agent.id))
      const isHighlighted = searchQuery.trim() && searchMatches.has(agent.id)
      const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []

      return {
        id: agent.id,
        type: 'agentNode',
        position: pos,
        data: {
          ...agent,
          isHighlighted,
          isDimmed,
          skillCount: skills.length,
          taskCount: Array.isArray(agent.tasks) ? agent.tasks.length : 0,
        },
        selected: agent.id === selectedAgentId,
      }
    })
  }, [agents, positions, activeFilter, searchQuery, searchMatches, selectedAgentId])

  // ─── Build React Flow edges ────────────────────────────────────────────
  const flowEdges: Edge[] = useMemo(() => {
    return connections
      .filter(conn => visibleEdgeTypes.has(conn.type))
      .map(conn => ({
        id: conn.id,
        source: conn.from,
        target: conn.to,
        type: 'agentEdge',
        data: {
          edgeType: conn.type,
          strength: conn.strength,
          flowAnimation: true,
        },
      }))
  }, [connections, visibleEdgeTypes])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Sync derived nodes/edges into state
  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  // ─── Selection ─────────────────────────────────────────────────────────
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedAgentId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedAgentId(null)
  }, [])

  // ─── Select agent from sidebar ─────────────────────────────────────────
  const handleSidebarSelect = useCallback((id: string) => {
    setSelectedAgentId(id)
  }, [])

  // ─── Focus on selected agent node ────────────────────────────────────
  const handleFocus = useCallback(() => {
    if (selectedAgentId && reactFlowInstance.current) {
      const instance = reactFlowInstance.current as any
      instance.fitView({ nodes: [{ id: selectedAgentId }], padding: 0.3, duration: 500 })
    }
  }, [selectedAgentId])

  // ─── Fit all nodes to view ───────────────────────────────────────────
  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      const instance = reactFlowInstance.current as any
      instance.fitView({ padding: 0.2, duration: 500 })
    }
  }, [])

  // ─── Add new agent ───────────────────────────────────────────────────
  const handleAddAgent = useCallback(async () => {
    if (!newAgentName.trim()) return
    try {
      const res = await fetchWithRetry('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgentName,
          role: newAgentRole || 'Custom Agent',
          roleGroup: newAgentGroup,
          formula: newAgentFormula,
          status: newAgentStatus,
          skills: newAgentSkills,
          description: `${newAgentRole || 'Custom Agent'} agent in ${newAgentGroup} group`,
        }),
      })
      if (res.ok) {
        setShowAddAgent(false)
        setNewAgentName('')
        setNewAgentRole('')
        setNewAgentSkills('')
        setNewAgentGroup('Исполнение')
        setNewAgentFormula('ReAct')
        setNewAgentStatus('active')
        fetchAgents()
      }
    } catch {
      // Error handling — silently fail for now
    }
  }, [newAgentName, newAgentRole, newAgentGroup, newAgentFormula, newAgentStatus, newAgentSkills, fetchAgents])

  // ─── Selected agent data ───────────────────────────────────────────────
  const selectedAgent = useMemo(
    () => agents.find(a => a.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  )

  // ─── Edge type toggle ──────────────────────────────────────────────────
  const toggleEdgeType = useCallback((type: EdgeType) => {
    setVisibleEdgeTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  // ─── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'Escape') { setSelectedAgentId(null); return }
      if (e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key) - 1
        if (index < ROLE_ORDER.length) {
          const group = ROLE_ORDER[index]
          setActiveFilter(prev => prev === group ? null : group)
        }
        return
      }
      if (e.key === '9') { setActiveFilter(null); return }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ─── Compute layer Y positions for labels ──────────────────────────────
  const layerPositions = useMemo(() => {
    const layerY: Record<number, { minY: number; maxY: number }> = {}
    for (const agent of agents) {
      const cfg = ROLE_CONFIG[agent.roleGroup]
      if (!cfg) continue
      const level = cfg.level
      const pos = positions[agent.id]
      if (!pos) continue
      if (!layerY[level]) layerY[level] = { minY: pos.y, maxY: pos.y + 58 }
      else {
        layerY[level].minY = Math.min(layerY[level].minY, pos.y)
        layerY[level].maxY = Math.max(layerY[level].maxY, pos.y + 58)
      }
    }
    return layerY
  }, [agents, positions])

  // ─── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#555',
        fontSize: 14,
        gap: 8,
      }}>
        <RefreshCw size={16} color="#555" className="animate-spin" />
        Loading hierarchy...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000' }}>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#0A0A0A',
          borderBottom: '1px solid rgba(51,51,51,0.5)',
          padding: '0 20px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#06B6D4',
            }}
          >
            P
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>P-</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#06B6D4' }}>MAS</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Dashboard</span>
            <ChevronRight size={10} color="#555" />
            <span style={{ color: '#fff', fontWeight: 600 }}>Hierarchy</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 10,
              background: wsConnected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: wsConnected ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.15)',
              fontSize: 9, fontWeight: 700,
              color: wsConnected ? '#22C55E' : '#EF4444',
            }}
          >
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: wsConnected ? '#22C55E' : '#EF4444',
              boxShadow: wsConnected ? '0 0 4px #22C55E' : '0 0 4px #EF4444',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </div>
          <button
            onClick={() => fetchAgents()}
            style={{
              padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
              background: '#1A1A1A', border: '1px solid rgba(51,51,51,0.4)', color: '#64748B', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <RefreshCw size={10} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddAgent(true)}
            style={{
              padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
              background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', color: '#06B6D4', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Plus size={10} />
            Add Agent
          </button>
        </div>
      </div>

      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#0A0A0A',
          borderBottom: '1px solid rgba(51,51,51,0.25)',
          padding: '0 20px',
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* View mode buttons — Lucide icons only */}
          {([
            { mode: 'hierarchy' as const, Icon: LayoutGrid, label: 'Hierarchy' },
            { mode: 'radial' as const, Icon: Circle, label: 'Radial' },
            { mode: 'grid' as const, Icon: Grid3X3, label: 'Grid' },
          ]).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                background: viewMode === mode ? 'rgba(6,182,212,0.06)' : 'transparent',
                border: viewMode === mode ? '1px solid rgba(6,182,212,0.15)' : '1px solid transparent',
                color: viewMode === mode ? '#06B6D4' : '#555',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <Icon size={9} />
              {label}
            </button>
          ))}

          <div style={{ width: 1, height: 16, background: 'rgba(51,51,51,0.25)', margin: '0 4px' }} />

          {/* Layers toggle */}
          <button
            onClick={() => setShowLayers(prev => !prev)}
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: showLayers ? 'rgba(6,182,212,0.06)' : 'transparent',
              border: showLayers ? '1px solid rgba(6,182,212,0.15)' : '1px solid transparent',
              color: showLayers ? '#06B6D4' : '#555',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
              display: 'flex', alignItems: 'center', gap: 3,
            }}
            title="Toggle layer labels"
          >
            <Layers size={9} />
            Layers
          </button>

          {/* Layout auto-recalculate */}
          <button
            onClick={() => {
              // Force layout recalculation by briefly switching viewMode
              const currentMode = viewMode
              setViewMode('grid')
              setTimeout(() => setViewMode(currentMode), 50)
            }}
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: 'transparent',
              border: '1px solid transparent',
              color: '#555',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
              display: 'flex', alignItems: 'center', gap: 3,
            }}
            title="Re-layout (Dagre auto-arrange)"
          >
            <ArrowUpDown size={9} />
            Layout
          </button>

          <div style={{ width: 1, height: 16, background: 'rgba(51,51,51,0.25)', margin: '0 4px' }} />

          {/* Search — Lucide Search icon */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#111', border: '1px solid rgba(51,51,51,0.25)',
              borderRadius: 6, padding: '3px 8px', width: 180,
            }}
          >
            <Search size={10} color="#555" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 10, width: '100%',
              }}
            />
            <span style={{ fontSize: 8, color: '#555', background: 'rgba(51,51,51,0.4)', padding: '1px 4px', borderRadius: 3 }}>
              Cmd+K
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: 'rgba(51,51,51,0.25)', margin: '0 4px' }} />

          {/* Edge type filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {(Object.entries(EDGE_CONFIG) as [EdgeType, typeof EDGE_CONFIG[EdgeType]][]).map(([type, cfg]) => (
              <button
                key={type}
                onClick={() => toggleEdgeType(type)}
                style={{
                  padding: '2px 6px', borderRadius: 3, fontSize: 8, fontWeight: 600,
                  cursor: 'pointer',
                  color: cfg.color,
                  opacity: visibleEdgeTypes.has(type) ? 1 : 0.35,
                  background: visibleEdgeTypes.has(type) ? `${cfg.color}10` : 'transparent',
                  border: visibleEdgeTypes.has(type) ? `1px solid ${cfg.color}30` : '1px solid transparent',
                  transition: 'opacity 0.2s',
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom controls — Lucide icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={() => {
              if (reactFlowInstance.current) {
                const instance = reactFlowInstance.current as any
                instance.zoomIn({ duration: 300 })
              }
            }}
            style={{
              padding: '3px 5px', borderRadius: 3,
              background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(51,51,51,0.3)',
              color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            title="Zoom In"
          >
            <ZoomIn size={11} />
          </button>
          <button
            onClick={() => {
              if (reactFlowInstance.current) {
                const instance = reactFlowInstance.current as any
                instance.zoomOut({ duration: 300 })
              }
            }}
            style={{
              padding: '3px 5px', borderRadius: 3,
              background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(51,51,51,0.3)',
              color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            title="Zoom Out"
          >
            <ZoomOut size={11} />
          </button>
          <div style={{ width: 1, height: 14, background: 'rgba(51,51,51,0.25)', margin: '0 2px' }} />
          <button
            onClick={handleFitView}
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(51,51,51,0.3)',
              color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
              textTransform: 'uppercase',
            }}
            title="Fit to screen"
          >
            <Maximize2 size={9} />
            Fit
          </button>
          <button
            onClick={handleFocus}
            style={{
              padding: '3px 8px', borderRadius: 4,
              background: selectedAgentId ? 'rgba(6,182,212,0.06)' : 'rgba(13,13,13,0.95)',
              border: selectedAgentId ? '1px solid rgba(6,182,212,0.15)' : '1px solid rgba(51,51,51,0.3)',
              color: selectedAgentId ? '#06B6D4' : '#555',
              cursor: selectedAgentId ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
            }}
            title="Focus on selected node"
          >
            <Crosshair size={9} />
            Focus
          </button>
        </div>
      </div>

      {/* ─── Main layout ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div className="custom-scrollbar" style={{ overflowY: 'auto' }}>
          <GroupSidebar
            agents={agents}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleSidebarSelect}
          />
        </div>

        {/* React Flow Canvas */}
        <div ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => { reactFlowInstance.current = instance }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={3}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#000' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={40}
              size={0.5}
              color="rgba(51,51,51,0.3)"
            />
            {/* Native controls hidden — custom zoom buttons in toolbar */}
            <MiniMap
              nodeColor={node => {
                const data = node.data as AgentData
                const cfg = ROLE_CONFIG[data?.roleGroup] || ROLE_CONFIG['Исполнение']
                return cfg.color
              }}
              maskColor="rgba(0,0,0,0.7)"
              style={{
                background: 'rgba(10,10,10,0.92)',
                border: '1px solid rgba(51,51,51,0.3)',
                borderRadius: 8,
              }}
            />

            {/* Layer labels overlay with enhanced visual bands — only in hierarchy mode */}
            {viewMode === 'hierarchy' && showLayers && (
              <Panel position="top-left" style={{ pointerEvents: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {LAYER_LABELS.map(layer => {
                    const pos = layerPositions[layer.level]
                    if (!pos) return null
                    const agentCount = agents.filter(a => {
                      const cfg = ROLE_CONFIG[a.roleGroup]
                      return cfg && cfg.level === layer.level
                    }).length
                    const activeCount = agents.filter(a => {
                      const cfg = ROLE_CONFIG[a.roleGroup]
                      return cfg && cfg.level === layer.level && a.status === 'active'
                    }).length
                    return (
                      <div key={layer.level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Layer badge */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: `rgba(${layer.colorRgb}, 0.08)`,
                            border: `1px solid rgba(${layer.colorRgb}, 0.15)`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              color: layer.color,
                              letterSpacing: 0.5,
                            }}
                          >
                            {layer.label}
                          </span>
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 600,
                              color: layer.color,
                              opacity: 0.7,
                            }}
                          >
                            {layer.fullLabel}
                          </span>
                        </div>
                        {/* Agent count */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: layer.color }}>
                            {activeCount}/{agentCount}
                          </span>
                          <span style={{ fontSize: 7, color: '#555' }}>active</span>
                        </div>
                        {/* Horizontal separator line */}
                        <div
                          style={{
                            flex: 1,
                            height: 1,
                            minWidth: 40,
                            background: `linear-gradient(90deg, ${layer.color}30, transparent)`,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Detail Panel */}
        <DetailPanel
          agent={selectedAgent}
          allAgents={agents}
          onClose={() => setSelectedAgentId(null)}
          onAgentUpdated={(updatedAgent) => {
            setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a))
          }}
          onAgentDeleted={(agentId) => {
            setAgents(prev => prev.filter(a => a.id !== agentId))
            setSelectedAgentId(null)
          }}
        />
      </div>

      {/* ─── KPI Strip ──────────────────────────────────────────────────── */}
      <KPIStrip agents={agents} />

      {/* ─── Add Agent Modal ─────────────────────────────────────────────── */}
      {showAddAgent && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddAgent(false) }}
        >
          <div
            style={{
              background: '#0A0A0A', border: '1px solid rgba(51,51,51,0.5)',
              borderRadius: 12, width: 400, maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(51,51,51,0.3)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#06B6D4' }}>Add New Agent</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Create a new agent in the multi-agent system</div>
              </div>
              <button
                onClick={() => setShowAddAgent(false)}
                style={{
                  padding: 4, borderRadius: 4, background: 'rgba(51,51,51,0.2)',
                  border: '1px solid rgba(51,51,51,0.3)', color: '#888', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Form fields */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Agent Name
                </label>
                <input
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  placeholder="e.g. Novyj-Agent"
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                />
              </div>

              {/* Role */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Role
                </label>
                <input
                  value={newAgentRole}
                  onChange={e => setNewAgentRole(e.target.value)}
                  placeholder="e.g. Custom Agent"
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                />
              </div>

              {/* Role Group */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Role Group
                </label>
                <select
                  value={newAgentGroup}
                  onChange={e => setNewAgentGroup(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                >
                  {ROLE_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Cognitive Formula */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Cognitive Formula
                </label>
                <select
                  value={newAgentFormula}
                  onChange={e => setNewAgentFormula(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                >
                  {Object.keys(FORMULA_DESC).map(f => (
                    <option key={f} value={f}>{f} — {FORMULA_DESC[f].split('—')[0].trim()}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={newAgentStatus}
                  onChange={e => setNewAgentStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                >
                  {['active', 'idle', 'paused', 'standby'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Skills */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Skills (comma-separated)
                </label>
                <input
                  value={newAgentSkills}
                  onChange={e => setNewAgentSkills(e.target.value)}
                  placeholder="e.g. analysis,reporting,optimization"
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid rgba(51,51,51,0.3)',
              display: 'flex', justifyContent: 'flex-end', gap: 8,
            }}>
              <button
                onClick={() => setShowAddAgent(false)}
                style={{
                  padding: '6px 16px', borderRadius: 6, background: '#1A1A1A',
                  border: '1px solid rgba(51,51,51,0.4)', color: '#B0B0B0',
                  cursor: 'pointer', fontSize: 11,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgent}
                disabled={!newAgentName.trim()}
                style={{
                  padding: '6px 16px', borderRadius: 6,
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  color: '#06B6D4', cursor: 'pointer', fontSize: 11,
                  opacity: newAgentName.trim() ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Plus size={10} />
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
