'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Brain,
  Shield,
  Target,
  Zap,
  Activity,
  Eye,
  Database,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agent {
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
  children?: Agent[]
  tasks?: unknown[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { color: string; colorRgb: string; icon: typeof Brain; label: string }> = {
  'Стратегия': { color: '#f59e0b', colorRgb: '245,158,11', icon: Brain, label: 'Strategy' },
  'Тактика': { color: '#10b981', colorRgb: '16,185,129', icon: Target, label: 'Tactics' },
  'Контроль': { color: '#f43f5e', colorRgb: '244,63,94', icon: Shield, label: 'Control' },
  'Исполнение': { color: '#06b6d4', colorRgb: '6,182,212', icon: Zap, label: 'Execution' },
}

const ROLE_ORDER = ['Стратегия', 'Тактика', 'Контроль', 'Исполнение']

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  idle: '#eab308',
  error: '#ef4444',
  offline: '#6b7280',
}

const FORMULA_COLORS: Record<string, string> = {
  ToT: '#f59e0b',
  CoVe: '#8b5cf6',
  ReWOO: '#10b981',
  Reflexion: '#f43f5e',
  ReAct: '#06b6d4',
  MoA: '#ec4899',
}

// ─── Background Particles ────────────────────────────────────────────────────

function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number
    size: number; opacity: number; pulse: number; pulseDir: number
  }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 120; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          pulse: 0,
          pulseDir: Math.random() > 0.5 ? 1 : -1,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.pulse += 0.005 * p.pulseDir
        if (p.pulse > 1 || p.pulse < -1) p.pulseDir *= -1

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        const currentOpacity = p.opacity + p.pulse * 0.15
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 200, 255, ${currentOpacity})`
        ctx.fill()
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// ─── Data Flow Particles (along connection lines) ────────────────────────────

interface FlowParticle {
  id: number
  progress: number
  speed: number
}

function ConnectionLine({
  x1, y1, x2, y2, color, colorRgb, type, id,
}: {
  x1: number; y1: number; x2: number; y2: number
  color: string; colorRgb: string; type: 'parent' | 'twin'; id: string
}) {
  const particlesRef = useRef<FlowParticle[]>([])
  const animationRef = useRef<number>(0)
  const pathRef = useRef<SVGPathElement>(null)

  // Compute control points for a curved line
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  const offset = dist * 0.2
  // Perpendicular offset for curve
  const cx1 = midX - (dy / dist) * offset
  const cy1 = midY + (dx / dist) * offset

  const pathD = `M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`

  // Initialize flow particles
  useEffect(() => {
    if (particlesRef.current.length === 0) {
      const count = type === 'twin' ? 2 : 3
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          id: i,
          progress: i / count,
          speed: 0.002 + Math.random() * 0.003,
        })
      }
    }
  }, [type])

  // Animate particles along path
  useEffect(() => {
    const animate = () => {
      for (const p of particlesRef.current) {
        p.progress += p.speed
        if (p.progress > 1) p.progress -= 1
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  // Render flow particles using getPointAtLength
  const FlowParticles = () => {
    const [points, setPoints] = useState<Array<{ x: number; y: number }>>([])

    useEffect(() => {
      const update = () => {
        const path = pathRef.current
        if (!path) return
        const totalLen = path.getTotalLength()
        const pts = particlesRef.current.map(p => {
          const len = p.progress * totalLen
          const pt = path.getPointAtLength(len)
          return { x: pt.x, y: pt.y }
        })
        setPoints(pts)
        requestAnimationFrame(update)
      }
      const raf = requestAnimationFrame(update)
      return () => cancelAnimationFrame(raf)
    }, [])

    return (
      <>
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={2.5}
            fill={color}
            opacity={0.8}
          >
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </>
    )
  }

  return (
    <g>
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={type === 'twin' ? 1.5 : 2}
        strokeOpacity={0.25}
        strokeDasharray={type === 'twin' ? '8 4' : undefined}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={type === 'twin' ? 1 : 1.5}
        strokeOpacity={0.5}
        strokeDasharray={type === 'twin' ? '8 4' : undefined}
      />
      <FlowParticles />
      {type === 'twin' && (
        <>
          <circle cx={midX} cy={midY} r={4} fill={color} opacity={0.6} />
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            fill={color}
            fontSize="9"
            opacity={0.7}
          >
            twin
          </text>
        </>
      )}
    </g>
  )
}

// ─── Agent Node ──────────────────────────────────────────────────────────────

function AgentNode({
  agent,
  x,
  y,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
}: {
  agent: Agent
  x: number
  y: number
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  onClick: () => void
}) {
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['Исполнение']
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const formulaColor = FORMULA_COLORS[agent.formula] || '#888'
  const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      onClick={onClick}
      style={{ opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.4s ease' }}
    >
      {/* Outer glow ring */}
      <motion.circle
        r={40}
        fill="none"
        stroke={config.color}
        strokeWidth={1}
        strokeOpacity={0.15}
        animate={{
          r: [40, 44, 40],
          strokeOpacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Selection ring */}
      {isSelected && (
        <motion.circle
          r={46}
          fill="none"
          stroke={config.color}
          strokeWidth={2}
          strokeOpacity={0.6}
          animate={{
            r: [46, 50, 46],
            strokeOpacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main orb - background */}
      <motion.circle
        r={32}
        fill={`rgba(${config.colorRgb}, 0.12)`}
        stroke={config.color}
        strokeWidth={isHighlighted ? 2.5 : 1.5}
        strokeOpacity={isHighlighted ? 0.8 : 0.5}
        animate={{
          r: [32, 33.5, 32],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner glow */}
      <circle
        r={24}
        fill={`rgba(${config.colorRgb}, 0.06)`}
        filter="url(#orbGlow)"
      />

      {/* Avatar */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        style={{ pointerEvents: 'none' }}
      >
        {agent.avatar}
      </text>

      {/* Agent name */}
      <text
        y={48}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="11"
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {agent.name}
      </text>

      {/* Role label */}
      <text
        y={60}
        textAnchor="middle"
        fill={config.color}
        fontSize="8"
        opacity={0.7}
        style={{ pointerEvents: 'none' }}
      >
        {agent.role}
      </text>

      {/* Formula badge */}
      <g transform="translate(-26, -26)">
        <rect
          width={32}
          height={14}
          rx={4}
          fill={formulaColor}
          fillOpacity={0.2}
          stroke={formulaColor}
          strokeWidth={0.5}
          strokeOpacity={0.5}
        />
        <text
          x={16}
          y={10}
          textAnchor="middle"
          fill={formulaColor}
          fontSize="8"
          fontWeight="700"
          style={{ pointerEvents: 'none' }}
        >
          {agent.formula}
        </text>
      </g>

      {/* Status indicator */}
      <g transform="translate(22, -28)">
        <motion.circle
          r={5}
          fill={statusColor}
          animate={{
            opacity: agent.status === 'active'
              ? [1, 0.4, 1]
              : agent.status === 'idle'
                ? [0.7, 0.4, 0.7]
                : [0.6],
          }}
          transition={{
            duration: agent.status === 'active' ? 2 : agent.status === 'idle' ? 3 : 0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <circle
          r={5}
          fill="none"
          stroke={statusColor}
          strokeWidth={1}
          strokeOpacity={0.4}
        />
      </g>

      {/* Skills as small floating tags */}
      {skills.slice(0, 4).map((skill, i) => {
        const angle = -Math.PI / 2 + ((i - (Math.min(skills.length, 4) - 1) / 2)) * 0.55
        const tagR = 56
        const tx = Math.cos(angle) * tagR
        const ty = Math.sin(angle) * tagR + 10
        return (
          <g key={i} transform={`translate(${tx}, ${ty})`}>
            <rect
              x={-skill.length * 3.2 - 4}
              y={-6}
              width={skill.length * 6.4 + 8}
              height={12}
              rx={3}
              fill={`rgba(${config.colorRgb}, 0.15)`}
              stroke={config.color}
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
            <text
              textAnchor="middle"
              y={2}
              fill={config.color}
              fontSize="7"
              opacity={0.85}
              style={{ pointerEvents: 'none' }}
            >
              {skill.trim()}
            </text>
          </g>
        )
      })}
      {skills.length > 4 && (
        <g transform={`translate(0, ${56 + 22})`}>
          <text
            textAnchor="middle"
            fill={config.color}
            fontSize="7"
            opacity={0.6}
            style={{ pointerEvents: 'none' }}
          >
            +{skills.length - 4} more
          </text>
        </g>
      )}
    </g>
  )
}

// ─── Agent Detail Panel ──────────────────────────────────────────────────────

function AgentDetailPanel({
  agent,
  allAgents,
  onClose,
}: {
  agent: Agent
  allAgents: Agent[]
  onClose: () => void
}) {
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['Исполнение']
  const formulaColor = FORMULA_COLORS[agent.formula] || '#888'
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []

  const parent = agent.parentId ? allAgents.find(a => a.id === agent.parentId) : null
  const twin = agent.twinId ? allAgents.find(a => a.id === agent.twinId) : null
  const children = allAgents.filter(a => a.parentId === agent.id)

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-4 top-16 bottom-4 w-[340px] z-50 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15, 20, 35, 0.85)',
        backdropFilter: 'blur(24px)',
        border: `1px solid rgba(${config.colorRgb}, 0.3)`,
        boxShadow: `0 0 40px rgba(${config.colorRgb}, 0.1), 0 8px 32px rgba(0,0,0,0.5)`,
      }}
    >
      <ScrollArea className="h-full">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: `rgba(${config.colorRgb}, 0.15)`,
                  border: `1px solid rgba(${config.colorRgb}, 0.3)`,
                }}
              >
                {agent.avatar}
              </div>
              <div>
                <h3 className="text-white font-bold text-base">{agent.name}</h3>
                <p className="text-xs" style={{ color: config.color }}>{agent.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status & Formula row */}
          <div className="flex items-center gap-2 mb-4">
            <Badge
              className="text-[10px] font-semibold"
              style={{
                background: `${statusColor}20`,
                color: statusColor,
                borderColor: `${statusColor}40`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mr-1 inline-block"
                style={{ background: statusColor }}
              />
              {agent.status.toUpperCase()}
            </Badge>
            <Badge
              className="text-[10px] font-bold"
              style={{
                background: `${formulaColor}20`,
                color: formulaColor,
                borderColor: `${formulaColor}40`,
              }}
            >
              {agent.formula}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                color: config.color,
                borderColor: `rgba(${config.colorRgb}, 0.4)`,
              }}
            >
              {agent.roleGroup}
            </Badge>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Description</h4>
            <p className="text-slate-300 text-xs leading-relaxed">{agent.description}</p>
          </div>

          {/* Cognitive Formula */}
          <div className="mb-5">
            <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Cognitive Formula</h4>
            <div
              className="rounded-lg p-3"
              style={{
                background: `rgba(${config.colorRgb}, 0.08)`,
                border: `1px solid rgba(${config.colorRgb}, 0.2)`,
              }}
            >
              <span className="font-bold text-sm" style={{ color: formulaColor }}>{agent.formula}</span>
              <p className="text-slate-400 text-[10px] mt-1">
                {agent.formula === 'ToT' && 'Tree of Thoughts — explores multiple reasoning paths'}
                {agent.formula === 'CoVe' && 'Chain of Verification — validates outputs with self-checks'}
                {agent.formula === 'ReWOO' && 'Research without Observation — plans then executes'}
                {agent.formula === 'Reflexion' && 'Self-reflection — learns from past mistakes'}
                {agent.formula === 'ReAct' && 'Reasoning + Action — interleaves thought and action'}
                {agent.formula === 'MoA' && 'Mixture of Agents — combines multiple agent outputs'}
              </p>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-5">
            <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] px-2 py-0.5"
                  style={{
                    color: config.color,
                    borderColor: `rgba(${config.colorRgb}, 0.4)`,
                    background: `rgba(${config.colorRgb}, 0.08)`,
                  }}
                >
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Connections */}
          <div className="mb-5">
            <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-2">Connections</h4>
            <div className="space-y-1.5">
              {parent && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 w-16">Parent</span>
                  <span className="text-slate-200">{parent.avatar} {parent.name}</span>
                </div>
              )}
              {twin && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 w-16">Twin</span>
                  <span className="text-slate-200">{twin.avatar} {twin.name}</span>
                </div>
              )}
              {children.length > 0 && (
                <div>
                  <span className="text-slate-500 text-xs">Children</span>
                  <div className="ml-2 mt-1 space-y-1">
                    {children.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <span>{c.avatar}</span>
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task Count */}
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Tasks</h4>
            <div
              className="rounded-lg px-3 py-2 inline-flex items-center gap-2"
              style={{
                background: `rgba(${config.colorRgb}, 0.08)`,
                border: `1px solid rgba(${config.colorRgb}, 0.2)`,
              }}
            >
              <Activity className="h-3.5 w-3.5" style={{ color: config.color }} />
              <span className="text-white font-bold text-sm">{agent.tasks?.length ?? 0}</span>
              <span className="text-slate-400 text-[10px]">assigned</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentHierarchy() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/hierarchy')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Seed data
  const handleSeed = useCallback(async () => {
    setLoading(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      await fetchAgents()
    } catch {
      // ignore
    }
  }, [fetchAgents])

  // Track dimensions
  useEffect(() => {
    const update = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Calculate positions using radial layout
  const { positions, connections } = useMemo(() => {
    const cx = dimensions.width / 2
    const cy = dimensions.height / 2
    const minDim = Math.min(dimensions.width, dimensions.height)
    const baseRadius = minDim * 0.12
    const ringSpacing = minDim * 0.12

    const groupRadii: Record<string, number> = {
      'Стратегия': baseRadius,
      'Тактика': baseRadius + ringSpacing,
      'Контроль': baseRadius + ringSpacing * 2,
      'Исполнение': baseRadius + ringSpacing * 3,
    }

    const pos: Record<string, { x: number; y: number }> = {}

    // Position each group
    for (const group of ROLE_ORDER) {
      const groupAgents = agents.filter(a => a.roleGroup === group)
      const radius = groupRadii[group] || baseRadius
      const count = groupAgents.length

      groupAgents.forEach((agent, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2
        pos[agent.id] = {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        }
      })
    }

    // Build connections
    const conns: Array<{
      id: string; from: string; to: string; type: 'parent' | 'twin'
    }> = []

    for (const agent of agents) {
      if (agent.parentId && pos[agent.id] && pos[agent.parentId]) {
        conns.push({
          id: `p-${agent.id}-${agent.parentId}`,
          from: agent.parentId,
          to: agent.id,
          type: 'parent',
        })
      }
    }

    // Twin connections (avoid duplicates)
    const twinSeen = new Set<string>()
    for (const agent of agents) {
      if (agent.twinId && pos[agent.id] && pos[agent.twinId]) {
        const key = [agent.id, agent.twinId].sort().join('-')
        if (!twinSeen.has(key)) {
          twinSeen.add(key)
          conns.push({
            id: `t-${key}`,
            from: agent.id,
            to: agent.twinId,
            type: 'twin',
          })
        }
      }
    }

    return { positions: pos, connections: conns }
  }, [agents, dimensions])

  // Zoom & pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: dragStart.current.panX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.clientY - dragStart.current.y),
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Filter logic
  const isAgentDimmed = useCallback((agent: Agent) => {
    if (!activeFilter) return false
    return agent.roleGroup !== activeFilter
  }, [activeFilter])

  // Stats
  const stats = useMemo(() => {
    const byGroup: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const a of agents) {
      byGroup[a.roleGroup] = (byGroup[a.roleGroup] || 0) + 1
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
    }
    return { byGroup, byStatus, total: agents.length }
  }, [agents])

  // Empty state
  if (!loading && agents.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
        <BackgroundParticles />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10 relative"
        >
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.15)',
            }}
          >
            <Database className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Agent Data</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            The agent hierarchy is empty. Seed sample data to explore the visualization.
          </p>
          <Button
            onClick={handleSeed}
            className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Seed Data
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden relative select-none"
      style={{ background: '#0a0e1a' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <BackgroundParticles />

      {/* SVG Filters */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="orbGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Navigation bar */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{
            background: 'rgba(10, 14, 26, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-600/20 border border-cyan-500/30">
              <Brain className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-wide">P-MAS</span>
              <span className="text-slate-500 text-[10px] ml-2">Agent Hierarchy</span>
            </div>
          </div>

          {/* Role group filters */}
          <div className="hidden sm:flex items-center gap-1.5">
            {ROLE_ORDER.map(group => {
              const cfg = ROLE_CONFIG[group]
              const Icon = cfg.icon
              const count = stats.byGroup[group] || 0
              const isActive = activeFilter === group
              return (
                <button
                  key={group}
                  onClick={() => setActiveFilter(isActive ? null : group)}
                  onMouseEnter={() => setHoveredGroup(group)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: isActive
                      ? `rgba(${cfg.colorRgb}, 0.2)`
                      : 'rgba(255,255,255,0.04)',
                    color: isActive ? cfg.color : '#94a3b8',
                    border: `1px solid ${isActive ? `rgba(${cfg.colorRgb}, 0.4)` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{group}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{
                      background: `rgba(${cfg.colorRgb}, 0.15)`,
                      color: cfg.color,
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Stats & Controls */}
          <div className="flex items-center gap-3">
            {/* Status counts */}
            <div className="hidden md:flex items-center gap-2 text-[10px]">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  <span className="text-slate-400">{count}</span>
                </div>
              ))}
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-semibold">{stats.total} agents</span>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => setZoom(z => Math.max(0.3, z * 0.85))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => setZoom(z => Math.min(3, z * 1.15))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={resetView}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter dropdown */}
      <div className="sm:hidden fixed top-16 left-4 z-40">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="text-slate-400 border-white/10 bg-[#0a0e1a]/80 backdrop-blur-md text-xs"
            onClick={() => setActiveFilter(activeFilter ? null : ROLE_ORDER[0])}
          >
            <Eye className="w-3 h-3 mr-1" />
            Filter
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          {activeFilter && (
            <div className="absolute top-9 left-0 flex flex-col gap-1 p-1.5 rounded-lg z-50"
              style={{ background: 'rgba(10, 14, 26, 0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {ROLE_ORDER.map(group => {
                const cfg = ROLE_CONFIG[group]
                return (
                  <button
                    key={group}
                    onClick={() => setActiveFilter(activeFilter === group ? null : group)}
                    className="text-xs px-3 py-1.5 rounded text-left whitespace-nowrap"
                    style={{
                      color: activeFilter === group ? cfg.color : '#94a3b8',
                      background: activeFilter === group ? `rgba(${cfg.colorRgb}, 0.15)` : 'transparent',
                    }}
                  >
                    {group}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main SVG canvas */}
      <svg
        className="absolute inset-0 w-full h-full z-10"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g
          transform={`translate(${dimensions.width / 2 + pan.x}, ${dimensions.height / 2 + pan.y}) scale(${zoom}) translate(${-dimensions.width / 2}, ${-dimensions.height / 2})`}
        >
          {/* Ring guides */}
          {ROLE_ORDER.map((group, gi) => {
            const cfg = ROLE_CONFIG[group]
            const minDim = Math.min(dimensions.width, dimensions.height)
            const baseRadius = minDim * 0.12
            const ringSpacing = minDim * 0.12
            const radius = baseRadius + ringSpacing * gi
            const isHighlighted = hoveredGroup === group || activeFilter === group
            return (
              <motion.circle
                key={group}
                cx={dimensions.width / 2}
                cy={dimensions.height / 2}
                r={radius}
                fill="none"
                stroke={cfg.color}
                strokeWidth={isHighlighted ? 1.5 : 0.5}
                strokeOpacity={isHighlighted ? 0.3 : 0.08}
                strokeDasharray="4 8"
                animate={{
                  strokeOpacity: isHighlighted ? 0.3 : 0.08,
                  strokeWidth: isHighlighted ? 1.5 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              />
            )
          })}

          {/* Ring labels */}
          {ROLE_ORDER.map((group, gi) => {
            const cfg = ROLE_CONFIG[group]
            const minDim = Math.min(dimensions.width, dimensions.height)
            const baseRadius = minDim * 0.12
            const ringSpacing = minDim * 0.12
            const radius = baseRadius + ringSpacing * gi
            const isHighlighted = hoveredGroup === group || activeFilter === group
            return (
              <text
                key={`label-${group}`}
                x={dimensions.width / 2 + radius + 12}
                y={dimensions.height / 2 - 4}
                fill={cfg.color}
                fontSize="9"
                fontWeight="600"
                opacity={isHighlighted ? 0.7 : 0.25}
                style={{ transition: 'opacity 0.3s' }}
              >
                {group}
              </text>
            )
          })}

          {/* Connection lines */}
          {connections.map(conn => {
            const fromPos = positions[conn.from]
            const toPos = positions[conn.to]
            if (!fromPos || !toPos) return null
            const fromAgent = agents.find(a => a.id === conn.from)
            const cfg = ROLE_CONFIG[fromAgent?.roleGroup || 'Исполнение']
            return (
              <ConnectionLine
                key={conn.id}
                id={conn.id}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                color={cfg.color}
                colorRgb={cfg.colorRgb}
                type={conn.type}
              />
            )
          })}

          {/* Agent nodes */}
          {agents.map(agent => {
            const pos = positions[agent.id]
            if (!pos) return null
            return (
              <AgentNode
                key={agent.id}
                agent={agent}
                x={pos.x}
                y={pos.y}
                isSelected={selectedAgent?.id === agent.id}
                isHighlighted={
                  hoveredGroup === agent.roleGroup || activeFilter === agent.roleGroup
                }
                isDimmed={isAgentDimmed(agent)}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setSelectedAgent(agent)
                }}
              />
            )
          })}
        </g>
      </svg>

      {/* Agent Detail Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailPanel
            agent={selectedAgent}
            allAgents={agents}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: '#0a0e1a' }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-slate-400 text-sm">Loading hierarchy...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
