'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Building2,
  BarChart3,
  ClipboardList,
  Radio,
  Search,
  TrendingUp,
  ShieldCheck,
  Flame,
  Bug,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  LayoutGrid,
  Circle,
  Users,
  ArrowRight,
  ArrowLeftRight,
  Diamond,
  Layers,
  ListChecks,
  Hash,
  type LucideIcon,
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

type EdgeType = 'command' | 'sync' | 'twin'

interface Connection {
  id: string
  from: string
  to: string
  type: EdgeType
  strength?: number
}

type ViewMode = 'radial' | 'grid'

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { color: string; colorRgb: string; icon: LucideIcon; label: string }> = {
  '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f': { color: '#f59e0b', colorRgb: '245,158,11', icon: Brain, label: 'Strategy' },
  '\u0422\u0430\u043a\u0442\u0438\u043a\u0430': { color: '#10b981', colorRgb: '16,185,129', icon: Target, label: 'Tactics' },
  '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c': { color: '#f43f5e', colorRgb: '244,63,94', icon: Shield, label: 'Control' },
  '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435': { color: '#06b6d4', colorRgb: '6,182,212', icon: Zap, label: 'Execution' },
}

const ROLE_ORDER = ['\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f', '\u0422\u0430\u043a\u0442\u0438\u043a\u0430', '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c', '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435']

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

const EDGE_CONFIG: Record<EdgeType, { strokeDasharray: string | undefined; label: string; icon: LucideIcon }> = {
  command: { strokeDasharray: undefined, label: 'Command', icon: ArrowRight },
  sync: { strokeDasharray: '3 5', label: 'Sync', icon: ArrowLeftRight },
  twin: { strokeDasharray: '8 4', label: 'Twin', icon: Diamond },
}

const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  'building-2': Building2,
  'bar-chart-3': BarChart3,
  'sparkles': Sparkles,
  'target': Target,
  'clipboard-list': ClipboardList,
  'radio': Radio,
  'search': Search,
  'trending-up': TrendingUp,
  'shield-check': ShieldCheck,
  'zap': Zap,
  'flame': Flame,
  'bug': Bug,
  'check-circle': CheckCircle,
  'brain': Brain,
  'shield': Shield,
  'activity': Activity,
}

function getAvatarIcon(avatarName: string): LucideIcon {
  return AVATAR_ICON_MAP[avatarName] || Brain
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

// ─── Background Grid ─────────────────────────────────────────────────────────

function BackgroundGrid({ width, height }: { width: number; height: number }) {
  const spacing = 60
  return (
    <g opacity={0.04}>
      {Array.from({ length: Math.ceil(width / spacing) + 1 }, (_, i) => (
        <line
          key={`vg-${i}`}
          x1={i * spacing}
          y1={0}
          x2={i * spacing}
          y2={height}
          stroke="#94a3b8"
          strokeWidth={0.3}
        />
      ))}
      {Array.from({ length: Math.ceil(height / spacing) + 1 }, (_, i) => (
        <line
          key={`hg-${i}`}
          x1={0}
          y1={i * spacing}
          x2={width}
          y2={i * spacing}
          stroke="#94a3b8"
          strokeWidth={0.3}
        />
      ))}
    </g>
  )
}

// ─── Data Flow Particles (along connection lines) ────────────────────────────

interface FlowParticle {
  id: number
  progress: number
  speed: number
}

function ConnectionLine({
  x1, y1, x2, y2, color, colorRgb, type, strength = 1, hoveredEdge, fromName, toName,
}: {
  x1: number; y1: number; x2: number; y2: number
  color: string; colorRgb: string; type: EdgeType; strength?: number
  hoveredEdge: string | null; fromName: string; toName: string
}) {
  const particlesRef = useRef<FlowParticle[]>([])
  const animationRef = useRef<number>(0)
  const pathRef = useRef<SVGPathElement>(null)

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  const offset = dist * 0.2
  const cx1 = midX - (dy / dist) * offset
  const cy1 = midY + (dx / dist) * offset

  const pathD = `M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`

  const edgeId = `edge-${x1}-${y1}-${x2}-${y2}`
  const isHovered = hoveredEdge === edgeId

  // Calculate arrow position and rotation
  const arrowLen = 8
  const endAngle = Math.atan2(y2 - cy1, x2 - cx1)
  const arrowX1 = x2 - arrowLen * Math.cos(endAngle - Math.PI / 6)
  const arrowY1 = y2 - arrowLen * Math.sin(endAngle - Math.PI / 6)
  const arrowX2 = x2 - arrowLen * Math.cos(endAngle + Math.PI / 6)
  const arrowY2 = y2 - arrowLen * Math.sin(endAngle + Math.PI / 6)

  // For sync edges, also draw arrow at the start
  const startAngle = Math.atan2(y1 - cy1, x1 - cx1)
  const sArrowX1 = x1 - arrowLen * Math.cos(startAngle - Math.PI / 6)
  const sArrowY1 = y1 - arrowLen * Math.sin(startAngle - Math.PI / 6)
  const sArrowX2 = x1 - arrowLen * Math.cos(startAngle + Math.PI / 6)
  const sArrowY2 = y1 - arrowLen * Math.sin(startAngle + Math.PI / 6)

  useEffect(() => {
    if (particlesRef.current.length === 0) {
      const count = type === 'twin' ? 2 : type === 'sync' ? 1 : 3
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          id: i,
          progress: i / count,
          speed: 0.002 + Math.random() * 0.003,
        })
      }
    }
  }, [type])

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

  const strokeWidth = type === 'command' ? 0.4 + strength * 0.2 : type === 'twin' ? 0.4 : 0.3
  const syncColor = '#64748b'

  const strokeColor = type === 'sync' ? syncColor : color

  return (
    <g
      data-edge-id={edgeId}
      style={{ cursor: 'pointer' }}
    >
      {/* Background path for hover detection */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={6}
      />
      {/* Main path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={isHovered ? 0.4 : 0.18}
        strokeDasharray={EDGE_CONFIG[type].strokeDasharray}
      />
      {/* Glow path */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 0.5}
        strokeOpacity={isHovered ? 0.5 : 0.25}
        strokeDasharray={EDGE_CONFIG[type].strokeDasharray}
      />

      {/* Twin pulsing glow */}
      {type === 'twin' && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.1}
          strokeDasharray="8 4"
        >
          <animate
            attributeName="strokeOpacity"
            values="0.04;0.15;0.04"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* End arrow (for all types) */}
      <polygon
        points={`${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={strokeColor}
        opacity={isHovered ? 0.8 : 0.5}
      />

      {/* Bidirectional arrows for sync */}
      {type === 'sync' && (
        <polygon
          points={`${x1},${y1} ${sArrowX1},${sArrowY1} ${sArrowX2},${sArrowY2}`}
          fill={syncColor}
          opacity={isHovered ? 0.8 : 0.5}
        />
      )}

      {/* Diamond markers for twin */}
      {type === 'twin' && (
        <>
          <polygon
            points={`${midX},${midY - 5} ${midX + 5},${midY} ${midX},${midY + 5} ${midX - 5},${midY}`}
            fill={color}
            opacity={0.6}
          />
        </>
      )}

      <FlowParticles />

      {/* Edge label on hover */}
      {isHovered && (
        <g>
          <rect
            x={midX - 32}
            y={midY - 20}
            width={64}
            height={16}
            rx={4}
            fill="rgba(10, 14, 26, 0.9)"
            stroke={strokeColor}
            strokeWidth={0.3}
            strokeOpacity={0.3}
          />
          <text
            x={midX}
            y={midY - 10}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontWeight="600"
            style={{ pointerEvents: 'none' }}
          >
            {EDGE_CONFIG[type].label}
          </text>
          {/* Connection annotation tooltip */}
          <rect
            x={midX - 60}
            y={midY + 8}
            width={120}
            height={28}
            rx={6}
            fill="rgba(10, 14, 26, 0.95)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.3}
          />
          <text
            x={midX}
            y={midY + 20}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="8"
            style={{ pointerEvents: 'none' }}
          >
            {fromName} {' -> '} {toName}
          </text>
          <text
            x={midX}
            y={midY + 32}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            style={{ pointerEvents: 'none' }}
          >
            [{EDGE_CONFIG[type].label}]
          </text>
        </g>
      )}
    </g>
  )
}

// ─── Agent Node (Enhanced) ───────────────────────────────────────────────────

function AgentNode({
  agent,
  x,
  y,
  isSelected,
  isHighlighted,
  isDimmed,
  isCollapsed,
  skillCount,
  onClick,
  onToggleCollapse,
  onHover,
}: {
  agent: Agent
  x: number
  y: number
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  isCollapsed: boolean
  skillCount: number
  onClick: () => void
  onToggleCollapse: () => void
  onHover: (id: string | null) => void
}) {
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435']
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const formulaColor = FORMULA_COLORS[agent.formula] || '#888'
  const AvatarIcon = getAvatarIcon(agent.avatar)
  const hasChildren = (agent.children && agent.children.length > 0) || false

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => onHover(agent.id)}
      onMouseLeave={() => onHover(null)}
      style={{ opacity: isDimmed ? 0.2 : isCollapsed ? 0.4 : 1, transition: 'opacity 0.4s ease' }}
    >
      {/* Activity indicator ring - spins when active */}
      {agent.status === 'active' && (
        <motion.circle
          r={38}
          fill="none"
          stroke={config.color}
          strokeWidth={0.2}
          strokeOpacity={0.15}
          strokeDasharray="3 10"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '0 0' }}
        />
      )}

      {/* Outer glow ring */}
      <motion.circle
        r={35}
        fill="none"
        stroke={config.color}
        strokeWidth={0.25}
        strokeOpacity={0.08}
        animate={{
          r: [35, 38, 35],
          strokeOpacity: [0.1, 0.18, 0.1],
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
          r={40}
          fill="none"
          stroke={config.color}
          strokeWidth={0.5}
          strokeOpacity={0.4}
          animate={{
            r: [40, 43, 40],
            strokeOpacity: [0.4, 0.2, 0.4],
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
        r={28}
        fill={`rgba(${config.colorRgb}, 0.12)`}
        stroke={config.color}
        strokeWidth={isHighlighted ? 0.6 : 0.4}
        strokeOpacity={isHighlighted ? 0.6 : 0.3}
        animate={{
          r: [28, 29, 28],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner glow */}
      <circle
        r={20}
        fill={`rgba(${config.colorRgb}, 0.06)`}
        filter="url(#orbGlow)"
      />

      {/* Avatar SVG icon via foreignObject */}
      <foreignObject x={-10} y={-10} width={20} height={20} style={{ pointerEvents: 'none' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AvatarIcon size={16} color={config.color} strokeWidth={1.5} />
        </div>
      </foreignObject>

      {/* Agent name */}
      <text
        y={42}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="10"
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {agent.name}
      </text>

      {/* Skill count text below name */}
      <text
        y={52}
        textAnchor="middle"
        fill={config.color}
        fontSize="7"
        opacity={0.6}
        style={{ pointerEvents: 'none' }}
      >
        {skillCount} skills
      </text>

      {/* Formula badge */}
      <g transform="translate(-22, -22)">
        <rect
          width={28}
          height={12}
          rx={3}
          fill={formulaColor}
          fillOpacity={0.2}
          stroke={formulaColor}
          strokeWidth={0.2}
          strokeOpacity={0.4}
        />
        <text
          x={14}
          y={9}
          textAnchor="middle"
          fill={formulaColor}
          fontSize="7"
          fontWeight="700"
          style={{ pointerEvents: 'none' }}
        >
          {agent.formula}
        </text>
      </g>

      {/* Status indicator */}
      <g transform="translate(20, -24)">
        <motion.circle
          r={4}
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
          r={4}
          fill="none"
          stroke={statusColor}
          strokeWidth={0.2}
          strokeOpacity={0.2}
        />
      </g>

      {/* Expand/collapse button for agents with children */}
      {hasChildren && (
        <g
          transform="translate(0, -36)"
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse() }}
        >
          <circle
            r={5}
            fill="rgba(10, 14, 26, 0.9)"
            stroke={config.color}
            strokeWidth={0.4}
            strokeOpacity={0.4}
          />
          <foreignObject x={-4} y={-4} width={8} height={8} style={{ pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isCollapsed
                ? React.createElement(ChevronRight, { size: 7, color: config.color })
                : React.createElement(ChevronDown, { size: 7, color: config.color })
              }
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  )
}

// ─── Hover Tooltip ───────────────────────────────────────────────────────────

function AgentTooltip({
  agent,
  x,
  y,
}: {
  agent: Agent
  x: number
  y: number
}) {
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435']
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []

  return (
    <g transform={`translate(${x - 75}, ${y - 80})`}>
      <rect
        width={150}
        height={52}
        rx={8}
        fill="rgba(10, 14, 26, 0.95)"
        stroke={config.color}
        strokeWidth={0.3}
        strokeOpacity={0.2}
      />
      {/* Agent name */}
      <text
        x={12}
        y={16}
        fill="#e2e8f0"
        fontSize="10"
        fontWeight="700"
        style={{ pointerEvents: 'none' }}
      >
        {agent.name}
      </text>
      {/* Role */}
      <text
        x={12}
        y={28}
        fill={config.color}
        fontSize="8"
        style={{ pointerEvents: 'none' }}
      >
        {agent.role}
      </text>
      {/* Status dot + label */}
      <circle cx={120} cy={12} r={4} fill={statusColor} />
      <text
        x={128}
        y={15}
        fill="#94a3b8"
        fontSize="7"
        style={{ pointerEvents: 'none' }}
      >
        {agent.status}
      </text>
      {/* Skills count */}
      <text
        x={12}
        y={42}
        fill="#64748b"
        fontSize="7"
        style={{ pointerEvents: 'none' }}
      >
        {skills.length} skills | {agent.formula}
      </text>
    </g>
  )
}

// ─── Agent Icon Helper (for HTML context) ────────────────────────────────────

function AgentAvatarIcon({ avatar, size = 20, color }: { avatar: string; size?: number; color: string }) {
  const IconComponent = getAvatarIcon(avatar)
  return React.createElement(IconComponent, { size, color, strokeWidth: 2 })
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
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435']
  const formulaColor = FORMULA_COLORS[agent.formula] || '#888'
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []

  const parent = agent.parentId ? allAgents.find(a => a.id === agent.parentId) : null
  const twin = agent.twinId ? allAgents.find(a => a.id === agent.twinId) : null
  const children = allAgents.filter(a => a.parentId === agent.id)
  const siblings = allAgents.filter(a => a.roleGroup === agent.roleGroup && a.id !== agent.id && a.parentId === agent.parentId)

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
        {/* Top colored stripe */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
            opacity: 0.7,
          }}
        />
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `rgba(${config.colorRgb}, 0.15)`,
                  border: `1px solid rgba(${config.colorRgb}, 0.3)`,
                }}
              >
                <AgentAvatarIcon avatar={agent.avatar} size={24} color={config.color} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">{agent.name}</h3>
                <p className="text-xs" style={{ color: config.color }}>{agent.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: `rgba(${config.colorRgb}, 0.15)`,
                border: `1px solid rgba(${config.colorRgb}, 0.3)`,
                color: config.color,
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
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
                {agent.formula === 'ToT' && 'Tree of Thoughts -- explores multiple reasoning paths'}
                {agent.formula === 'CoVe' && 'Chain of Verification -- validates outputs with self-checks'}
                {agent.formula === 'ReWOO' && 'Research without Observation -- plans then executes'}
                {agent.formula === 'Reflexion' && 'Self-reflection -- learns from past mistakes'}
                {agent.formula === 'ReAct' && 'Reasoning + Action -- interleaves thought and action'}
                {agent.formula === 'MoA' && 'Mixture of Agents -- combines multiple agent outputs'}
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
                  <AgentAvatarIcon avatar={parent.avatar} size={14} color={ROLE_CONFIG[parent.roleGroup]?.color || '#888'} />
                  <span className="text-slate-200">{parent.name}</span>
                </div>
              )}
              {twin && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 w-16">Twin</span>
                  <AgentAvatarIcon avatar={twin.avatar} size={14} color={ROLE_CONFIG[twin.roleGroup]?.color || '#888'} />
                  <span className="text-slate-200">{twin.name}</span>
                </div>
              )}
              {children.length > 0 && (
                <div>
                  <span className="text-slate-500 text-xs">Children</span>
                  <div className="ml-2 mt-1 space-y-1">
                    {children.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <AgentAvatarIcon avatar={c.avatar} size={14} color={ROLE_CONFIG[c.roleGroup]?.color || '#888'} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {siblings.length > 0 && (
                <div>
                  <span className="text-slate-500 text-xs">Sync peers</span>
                  <div className="ml-2 mt-1 space-y-1">
                    {siblings.map(s => (
                      <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <AgentAvatarIcon avatar={s.avatar} size={14} color={ROLE_CONFIG[s.roleGroup]?.color || '#888'} />
                        <span>{s.name}</span>
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

// ─── Legend Panel ─────────────────────────────────────────────────────────────

function LegendPanel() {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        width: 180,
      }}
    >
      <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-2">Legend</h4>

      {/* Edge types */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-amber-500" style={{ borderTop: '2px solid #f59e0b' }} />
          <span className="text-[9px] text-slate-300">Command (solid)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5" style={{ borderTop: '2px dotted #64748b' }} />
          <span className="text-[9px] text-slate-300">Sync (dotted)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5" style={{ borderTop: '2px dashed #06b6d4' }} />
          <span className="text-[9px] text-slate-300">Twin (dashed)</span>
        </div>
      </div>

      {/* Status colors */}
      <div className="space-y-1">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] text-slate-300 capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Node symbols */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2">
          {React.createElement(Hash, { size: 9, color: '#94a3b8' })}
          <span className="text-[9px] text-slate-300">Connection count</span>
        </div>
        <div className="flex items-center gap-2">
          {React.createElement(ListChecks, { size: 9, color: '#94a3b8' })}
          <span className="text-[9px] text-slate-300">Task count / Skill count</span>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Dashboard ─────────────────────────────────────────────────────────

function StatsDashboard({ stats }: { stats: { total: number; active: number; idle: number; error: number; offline: number; tasks: number } }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        width: 180,
      }}
    >
      <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-2">Stats</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-white font-bold text-lg">{stats.total}</span>
          <p className="text-[9px] text-slate-500">Total</p>
        </div>
        <div>
          <span className="text-green-400 font-bold text-lg">{stats.active}</span>
          <p className="text-[9px] text-slate-500">Active</p>
        </div>
        <div>
          <span className="text-yellow-400 font-bold text-lg">{stats.idle}</span>
          <p className="text-[9px] text-slate-500">Idle</p>
        </div>
        <div>
          <span className="text-slate-400 font-bold text-lg">{stats.tasks}</span>
          <p className="text-[9px] text-slate-500">Tasks</p>
        </div>
      </div>
    </div>
  )
}

// ─── Mini-Map ────────────────────────────────────────────────────────────────

function MiniMap({
  agents,
  positions,
  connections,
  dimensions,
  pan,
  zoom,
  onClickMap,
}: {
  agents: Agent[]
  positions: Record<string, { x: number; y: number }>
  connections: Connection[]
  dimensions: { width: number; height: number }
  pan: { x: number; y: number }
  zoom: number
  onClickMap: (ratioX: number, ratioY: number) => void
}) {
  const scale = 140 / Math.max(dimensions.width, dimensions.height)
  const mapW = dimensions.width * scale
  const mapH = dimensions.height * scale

  // Viewport indicator
  const vpW = (dimensions.width / zoom) * scale
  const vpH = (dimensions.height / zoom) * scale
  const vpX = (-pan.x / zoom) * scale
  const vpY = (-pan.y / zoom) * scale

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        width: 160,
        padding: 10,
      }}
    >
      <svg
        width={mapW}
        height={mapH}
        className="cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const rx = (e.clientX - rect.left) / mapW
          const ry = (e.clientY - rect.top) / mapH
          onClickMap(rx, ry)
        }}
      >
        {/* Cluster rings */}
        {ROLE_ORDER.map((group, gi) => {
          const cfg = ROLE_CONFIG[group]
          const minDim = Math.min(dimensions.width, dimensions.height)
          const baseRadius = minDim * 0.12
          const ringSpacing = minDim * 0.12
          const radius = (baseRadius + ringSpacing * gi) * scale
          const cx = dimensions.width * scale / 2
          const cy = dimensions.height * scale / 2
          return (
            <circle
              key={group}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={cfg.color}
              strokeWidth={0.3}
              strokeOpacity={0.15}
              strokeDasharray="2 4"
            />
          )
        })}

        {/* Connection lines */}
        {connections.map(conn => {
          const from = positions[conn.from]
          const to = positions[conn.to]
          if (!from || !to) return null
          return (
            <line
              key={conn.id}
              x1={from.x * scale}
              y1={from.y * scale}
              x2={to.x * scale}
              y2={to.y * scale}
              stroke={conn.type === 'sync' ? '#64748b' : conn.type === 'twin' ? '#06b6d4' : '#f59e0b'}
              strokeWidth={0.3}
              strokeOpacity={0.2}
              strokeDasharray={conn.type === 'sync' ? '1 2' : conn.type === 'twin' ? '2 1' : undefined}
            />
          )
        })}

        {/* Agent dots */}
        {agents.map(agent => {
          const pos = positions[agent.id]
          if (!pos) return null
          const cfg = ROLE_CONFIG[agent.roleGroup]
          return (
            <circle
              key={agent.id}
              cx={pos.x * scale}
              cy={pos.y * scale}
              r={2}
              fill={cfg.color}
              opacity={0.8}
            />
          )
        })}

        {/* Viewport indicator */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW}
          height={vpH}
          fill="none"
          stroke="#fff"
          strokeWidth={0.4}
          strokeOpacity={0.3}
          rx={1}
        />
      </svg>
    </div>
  )
}

// ─── Agent Creation Dialog ───────────────────────────────────────────────────

function AgentCreationDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [roleGroup, setRoleGroupVal] = useState(ROLE_ORDER[0])
  const [status, setStatusVal] = useState('active')
  const [formula, setFormula] = useState('ReAct')
  const [skills, setSkillsStr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !role.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          roleGroup,
          status,
          formula,
          skills: skills.trim(),
          description: `${role.trim()} agent`,
          avatar: 'brain',
        }),
      })
      setName('')
      setRole('')
      setSkillsStr('')
      setOpen(false)
      onCreated()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }, [name, role, roleGroup, status, formula, skills, onCreated])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        style={{
          background: 'rgba(15, 20, 35, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Create Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Agent name"
              className="bg-white/5 border-white/10 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Role</label>
            <Input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Agent role"
              className="bg-white/5 border-white/10 text-white text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Group</label>
              <Select value={roleGroup} onValueChange={setRoleGroupVal}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15, 20, 35, 0.95)' }}>
                  {ROLE_ORDER.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Status</label>
              <Select value={status} onValueChange={setStatusVal}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15, 20, 35, 0.95)' }}>
                  {['active', 'idle', 'error', 'offline'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Formula</label>
              <Select value={formula} onValueChange={setFormula}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(15, 20, 35, 0.95)' }}>
                  {['ToT', 'CoVe', 'ReWOO', 'Reflexion', 'ReAct', 'MoA'].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Skills (comma-separated)</label>
            <Input
              value={skills}
              onChange={e => setSkillsStr(e.target.value)}
              placeholder="skill1,skill2,skill3"
              className="bg-white/5 border-white/10 text-white text-xs"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !role.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {submitting ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentHierarchy() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('radial')
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const svgRef = useRef<SVGSVGElement>(null)

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

  const handleSeed = useCallback(async () => {
    setLoading(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      await fetchAgents()
    } catch {
      // ignore
    }
  }, [fetchAgents])

  useEffect(() => {
    const update = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Search matching
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    for (const agent of agents) {
      const skills = agent.skills ? agent.skills.toLowerCase() : ''
      if (
        agent.name.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q) ||
        skills.includes(q)
      ) {
        matches.add(agent.id)
      }
    }
    return matches
  }, [agents, searchQuery])

  const { positions, connections, groupCentroids } = useMemo(() => {
    const cx = dimensions.width / 2
    const cy = dimensions.height / 2
    const minDim = Math.min(dimensions.width, dimensions.height)
    const baseRadius = minDim * 0.12
    const ringSpacing = minDim * 0.12

    const groupRadii: Record<string, number> = {
      '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f': baseRadius,
      '\u0422\u0430\u043a\u0442\u0438\u043a\u0430': baseRadius + ringSpacing,
      '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c': baseRadius + ringSpacing * 2,
      '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435': baseRadius + ringSpacing * 3,
    }

    const pos: Record<string, { x: number; y: number }> = {}
    const centroids: Record<string, { x: number; y: number }> = {}

    if (viewMode === 'radial') {
      for (const group of ROLE_ORDER) {
        const groupAgents = agents.filter(a => a.roleGroup === group)
        const radius = groupRadii[group] || baseRadius
        const count = groupAgents.length

        let sumX = 0
        let sumY = 0

        groupAgents.forEach((agent, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2
          const ax = cx + Math.cos(angle) * radius
          const ay = cy + Math.sin(angle) * radius
          pos[agent.id] = { x: ax, y: ay }
          sumX += ax
          sumY += ay
        })

        centroids[group] = {
          x: count > 0 ? sumX / count : cx,
          y: count > 0 ? sumY / count : cy,
        }
      }
    } else {
      // Grid layout
      const cols = 4
      const cellW = minDim * 0.2
      const cellH = minDim * 0.18
      const startX = cx - (cols * cellW) / 2
      const startY = cy - (Math.ceil(agents.length / cols) * cellH) / 2

      agents.forEach((agent, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        pos[agent.id] = {
          x: startX + col * cellW + cellW / 2,
          y: startY + row * cellH + cellH / 2,
        }
      })

      // Compute centroids per group
      for (const group of ROLE_ORDER) {
        const groupAgents = agents.filter(a => a.roleGroup === group)
        let sumX = 0
        let sumY = 0
        for (const a of groupAgents) {
          const p = pos[a.id]
          if (p) { sumX += p.x; sumY += p.y }
        }
        centroids[group] = groupAgents.length > 0
          ? { x: sumX / groupAgents.length, y: sumY / groupAgents.length }
          : { x: cx, y: cy }
      }
    }

    // Build connections from hierarchy API data (now includes typed connections)
    // For now compute locally:
    const conns: Connection[] = []

    // Command edges: parent -> child
    for (const agent of agents) {
      if (agent.parentId && pos[agent.id] && pos[agent.parentId]) {
        conns.push({
          id: `cmd-${agent.id}-${agent.parentId}`,
          from: agent.parentId,
          to: agent.id,
          type: 'command',
          strength: 1,
        })
      }
    }

    // Sync edges: between same-group siblings (agents in same roleGroup with same parent)
    const syncSeen = new Set<string>()
    for (const group of ROLE_ORDER) {
      const groupAgents = agents.filter(a => a.roleGroup === group)
      // Create sync edges between pairs in same group
      for (let i = 0; i < groupAgents.length; i++) {
        for (let j = i + 1; j < groupAgents.length; j++) {
          const a1 = groupAgents[i]
          const a2 = groupAgents[j]
          // Only sync between siblings (same parent) or root agents in same group
          if (a1.parentId === a2.parentId && pos[a1.id] && pos[a2.id]) {
            const key = [a1.id, a2.id].sort().join('-')
            if (!syncSeen.has(key)) {
              syncSeen.add(key)
              conns.push({
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

    // Twin edges
    const twinSeen = new Set<string>()
    for (const agent of agents) {
      if (agent.twinId && pos[agent.id] && pos[agent.twinId]) {
        const key = [agent.id, agent.twinId].sort().join('-')
        if (!twinSeen.has(key)) {
          twinSeen.add(key)
          conns.push({
            id: `twin-${key}`,
            from: agent.id,
            to: agent.twinId,
            type: 'twin',
            strength: 1,
          })
        }
      }
    }

    return { positions: pos, connections: conns, groupCentroids: centroids }
  }, [agents, dimensions, viewMode])

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

  const isAgentDimmed = useCallback((agent: Agent) => {
    if (searchQuery.trim() && !searchMatches.has(agent.id)) return true
    if (activeFilter && agent.roleGroup !== activeFilter) return true
    return false
  }, [activeFilter, searchQuery, searchMatches])

  const toggleCollapseNode = useCallback((agentId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(agentId)) next.delete(agentId)
      else next.add(agentId)
      return next
    })
  }, [])

  const toggleCollapseGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }, [])

  const handleMiniMapClick = useCallback((ratioX: number, ratioY: number) => {
    setPan({
      x: -(ratioX * dimensions.width - dimensions.width / 2) * zoom,
      y: -(ratioY * dimensions.height - dimensions.height / 2) * zoom,
    })
  }, [dimensions, zoom])

  // Compute per-agent metrics
  const agentMetrics = useMemo(() => {
    const metrics: Record<string, { skillCount: number }> = {}
    for (const agent of agents) {
      const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []
      metrics[agent.id] = {
        skillCount: skills.length,
      }
    }
    return metrics
  }, [agents, connections])

  const stats = useMemo(() => {
    const byGroup: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let totalTasks = 0
    for (const a of agents) {
      byGroup[a.roleGroup] = (byGroup[a.roleGroup] || 0) + 1
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
      totalTasks += Array.isArray(a.tasks) ? a.tasks.length : 0
    }
    return {
      byGroup,
      byStatus,
      total: agents.length,
      active: byStatus.active || 0,
      idle: byStatus.idle || 0,
      error: byStatus.error || 0,
      offline: byStatus.offline || 0,
      tasks: totalTasks,
    }
  }, [agents])

  // Get visible agents (hiding collapsed children)
  const visibleAgents = useMemo(() => {
    const collapsedChildren = new Set<string>()
    for (const collapsedId of collapsedNodes) {
      const collectChildren = (id: string) => {
        const children = agents.filter(a => a.parentId === id)
        for (const child of children) {
          collapsedChildren.add(child.id)
          collectChildren(child.id)
        }
      }
      collectChildren(collapsedId)
    }
    for (const group of collapsedGroups) {
      const groupAgents = agents.filter(a => a.roleGroup === group)
      for (const ga of groupAgents) {
        collapsedChildren.add(ga.id)
      }
    }
    return agents.filter(a => !collapsedChildren.has(a.id))
  }, [agents, collapsedNodes, collapsedGroups])

  // Visible connections
  const visibleConnections = useMemo(() => {
    const visibleIds = new Set(visibleAgents.map(a => a.id))
    return connections.filter(c => visibleIds.has(c.from) && visibleIds.has(c.to))
  }, [connections, visibleAgents])

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
          <filter id="twinGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Arrow markers */}
          <marker id="arrowCommand" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" opacity="0.6" />
          </marker>
          <marker id="arrowSync" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#64748b" opacity="0.5" />
          </marker>
          <marker id="diamondTwin" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <polygon points="4 0, 8 4, 4 8, 0 4" fill="#06b6d4" opacity="0.6" />
          </marker>
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
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-wide">P-MAS</span>
              <span className="text-slate-500 text-[10px] ml-2">Agent Hierarchy</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="w-48 pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
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
                  <span className="hidden lg:inline">{group}</span>
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
            {/* View mode toggle */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${viewMode === 'radial' ? 'text-white' : 'text-slate-500'}`}
                onClick={() => setViewMode('radial')}
              >
                <Circle className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${viewMode === 'grid' ? 'text-white' : 'text-slate-500'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Status counts */}
            <div className="hidden lg:flex items-center gap-2 text-[10px]">
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
              <AgentCreationDialog onCreated={fetchAgents} />
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
        ref={svgRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseMove={(e) => {
          // Edge hover detection
          const target = e.target as SVGElement
          const edgeGroup = target.closest('[data-edge-id]')
          if (edgeGroup) {
            const id = edgeGroup.getAttribute('data-edge-id')
            setHoveredEdge(id)
          } else if (hoveredEdge) {
            setHoveredEdge(null)
          }
        }}
      >
        <g
          transform={`translate(${dimensions.width / 2 + pan.x}, ${dimensions.height / 2 + pan.y}) scale(${zoom}) translate(${-dimensions.width / 2}, ${-dimensions.height / 2})`}
        >
          {/* Background grid */}
          <BackgroundGrid width={dimensions.width} height={dimensions.height} />

          {/* Cluster backgrounds (subtle filled area) */}
          {ROLE_ORDER.map((group, gi) => {
            const cfg = ROLE_CONFIG[group]
            const minDim = Math.min(dimensions.width, dimensions.height)
            const baseRadius = minDim * 0.12
            const ringSpacing = minDim * 0.12
            const radius = baseRadius + ringSpacing * gi
            const isHighlighted = hoveredGroup === group || activeFilter === group
            const isCollapsedGroup = collapsedGroups.has(group)

            return (
              <g key={`cluster-${group}`}>
                {/* Filled cluster background */}
                <circle
                  cx={dimensions.width / 2}
                  cy={dimensions.height / 2}
                  r={radius}
                  fill={`rgba(${cfg.colorRgb}, ${isHighlighted ? 0.04 : 0.015})`}
                  stroke={cfg.color}
                  strokeWidth={isHighlighted ? 0.75 : 0.25}
                  strokeOpacity={isHighlighted ? 0.2 : 0.06}
                  strokeDasharray="4 8"
                />

                {/* Cluster header badge on ring */}
                {viewMode === 'radial' && !isCollapsedGroup && (
                  <g
                    transform={`translate(${dimensions.width / 2 + radius + 12}, ${dimensions.height / 2 - 14})`}
                    className="cursor-pointer"
                    onDoubleClick={() => toggleCollapseGroup(group)}
                  >
                    <rect
                      x={-4}
                      y={-10}
                      width={group.length * 7 + 32}
                      height={20}
                      rx={6}
                      fill="rgba(10, 14, 26, 0.9)"
                      stroke={cfg.color}
                      strokeWidth={0.3}
                      strokeOpacity={0.2}
                    />
                    <foreignObject x={0} y={-7} width={12} height={12} style={{ pointerEvents: 'none' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {React.createElement(cfg.icon, { size: 9, color: cfg.color })}
                      </div>
                    </foreignObject>
                    <text
                      x={16}
                      y={3}
                      fill={cfg.color}
                      fontSize="9"
                      fontWeight="600"
                      opacity={isHighlighted ? 0.9 : 0.5}
                      style={{ pointerEvents: 'none' }}
                    >
                      {group}
                    </text>
                    <text
                      x={16 + group.length * 7 + 4}
                      y={3}
                      fill={cfg.color}
                      fontSize="8"
                      opacity={0.6}
                      style={{ pointerEvents: 'none' }}
                    >
                      ({stats.byGroup[group] || 0})
                    </text>
                  </g>
                )}

                {/* Cluster stats inside ring */}
                {viewMode === 'radial' && !isCollapsedGroup && (
                  <g transform={`translate(${dimensions.width / 2 + radius - 50}, ${dimensions.height / 2 + 8})`}>
                    <text
                      fill={cfg.color}
                      fontSize="7"
                      opacity={0.3}
                      style={{ pointerEvents: 'none' }}
                    >
                      {agents.filter(a => a.roleGroup === group && a.status === 'active').length} active / {agents.filter(a => a.roleGroup === group && a.status === 'idle').length} idle
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Inter-cluster connections (faint lines between centroids) */}
          {viewMode === 'radial' && ROLE_ORDER.map((group, i) => {
            const nextGroup = ROLE_ORDER[(i + 1) % ROLE_ORDER.length]
            const c1 = groupCentroids[group]
            const c2 = groupCentroids[nextGroup]
            if (!c1 || !c2) return null
            return (
              <line
                key={`inter-${group}-${nextGroup}`}
                x1={c1.x}
                y1={c1.y}
                x2={c2.x}
                y2={c2.y}
                stroke="#334155"
                strokeWidth={0.3}
                strokeOpacity={0.1}
                strokeDasharray="4 8"
              />
            )
          })}

          {/* Connection lines */}
          {visibleConnections.map(conn => {
            const fromPos = positions[conn.from]
            const toPos = positions[conn.to]
            if (!fromPos || !toPos) return null
            const fromAgent = agents.find(a => a.id === conn.from)
            const toAgent = agents.find(a => a.id === conn.to)
            const cfg = ROLE_CONFIG[fromAgent?.roleGroup || '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435']
            return (
              <ConnectionLine
                key={conn.id}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                color={cfg.color}
                colorRgb={cfg.colorRgb}
                type={conn.type}
                strength={conn.strength}
                hoveredEdge={hoveredEdge}
                fromName={fromAgent?.name || ''}
                toName={toAgent?.name || ''}
              />
            )
          })}

          {/* Agent nodes */}
          {visibleAgents.map(agent => {
            const pos = positions[agent.id]
            if (!pos) return null
            const metrics = agentMetrics[agent.id] || { skillCount: 0 }
            const isHighlighted = searchQuery.trim() ? searchMatches.has(agent.id) : hoveredGroup === agent.roleGroup || activeFilter === agent.roleGroup
            const isCollapsed = collapsedNodes.has(agent.id)
            return (
              <React.Fragment key={agent.id}>
                <AgentNode
                  agent={agent}
                  x={pos.x}
                  y={pos.y}
                  isSelected={selectedAgent?.id === agent.id}
                  isHighlighted={!!isHighlighted}
                  isDimmed={isAgentDimmed(agent)}
                  isCollapsed={isCollapsed}
                  skillCount={metrics.skillCount}
                  onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                  onToggleCollapse={() => toggleCollapseNode(agent.id)}
                  onHover={setHoveredAgent}
                />
                {/* Hover tooltip */}
                {hoveredAgent === agent.id && (
                  <AgentTooltip agent={agent} x={pos.x} y={pos.y} />
                )}
              </React.Fragment>
            )
          })}
        </g>
      </svg>

      {/* Bottom-left panels: Stats + Legend */}
      <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2">
        <StatsDashboard stats={stats} />
        <LegendPanel />
      </div>

      {/* Bottom-right: Mini-map */}
      <div className="fixed bottom-4 right-4 z-40">
        <MiniMap
          agents={agents}
          positions={positions}
          connections={connections}
          dimensions={dimensions}
          pan={pan}
          zoom={zoom}
          onClickMap={handleMiniMapClick}
        />
      </div>

      {/* Agent detail panel */}
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
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10, 14, 26, 0.8)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-3"
            />
            <p className="text-slate-400 text-sm">Loading hierarchy...</p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
