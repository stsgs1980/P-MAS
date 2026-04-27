'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  type AgentData,
  type EdgeType,
  type ViewMode,
} from './types'
import { fetchWithRetry } from '@/lib/client-fetch'

// ─── Node / Edge types ─────────────────────────────────────────────────────────

const nodeTypes = { agentNode: AgentNode }
const edgeTypes = { agentEdge: AgentEdge }

// ─── Layer labels for DAG visualization ────────────────────────────────────────

const LAYER_LABELS = [
  { level: 0, label: 'L0 Strategy', color: '#67E8F9' },
  { level: 1, label: 'L1 Tactics', color: '#22D3EE' },
  { level: 2, label: 'L2 Control', color: '#06B6D4' },
  { level: 3, label: 'L3 Execution', color: '#0891B2' },
  { level: 4, label: 'L4 Support', color: '#0E7490' },
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
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // ─── Fetch agents ──────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/hierarchy')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  // ─── Simulate status transitions ───────────────────────────────────────
  useEffect(() => {
    if (agents.length === 0) return
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
  }, [agents.length])

  // ─── Connections ────────────────────────────────────────────────────────
  const connections = useMemo(() => buildConnections(agents), [agents])

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
              background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)',
              fontSize: 9, fontWeight: 700, color: '#06B6D4',
            }}
          >
            <div style={{
              width: 5, height: 5, borderRadius: '50%', background: '#06B6D4',
              boxShadow: '0 0 4px #06B6D4',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            LIVE
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
            style={{
              padding: '3px 5px', borderRadius: 3,
              background: 'transparent', border: '1px solid rgba(51,51,51,0.3)',
              color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            title="Zoom In"
          >
            <ZoomIn size={11} />
          </button>
          <button
            style={{
              padding: '3px 5px', borderRadius: 3,
              background: 'transparent', border: '1px solid rgba(51,51,51,0.3)',
              color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            title="Zoom Out"
          >
            <ZoomOut size={11} />
          </button>
          <button
            style={{
              padding: '3px 5px', borderRadius: 3,
              background: 'transparent', border: '1px solid rgba(51,51,51,0.3)',
              color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
            title="Fit View"
          >
            <Maximize2 size={11} />
          </button>
        </div>
      </div>

      {/* ─── Main layout ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <GroupSidebar
          agents={agents}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSidebarSelect}
        />

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
            <Controls
              showInteractive={false}
              style={{
                background: 'rgba(10,10,10,0.9)',
                border: '1px solid rgba(51,51,51,0.3)',
                borderRadius: 8,
              }}
            />
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

            {/* Layer labels overlay — only in hierarchy mode */}
            {viewMode === 'hierarchy' && (
              <Panel position="top-left" style={{ pointerEvents: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {LAYER_LABELS.map(layer => {
                    const pos = layerPositions[layer.level]
                    if (!pos) return null
                    return (
                      <div
                        key={layer.level}
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: layer.color,
                          opacity: 0.4,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                        }}
                      >
                        {layer.label}
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
        />
      </div>

      {/* ─── KPI Strip ──────────────────────────────────────────────────── */}
      <KPIStrip agents={agents} />
    </div>
  )
}
