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
  ArrowLeft,
  LayoutDashboard,
  BookOpen,
  HardDrive,
  FileSearch,
  Monitor,
  Bell,
  Gauge,
  Network,
  Megaphone,
  EyeOff,
  Workflow,
  GitBranch,
  RefreshCcw,
  Binary,
  Keyboard,
  Maximize2,
  Filter,
  Home,
  Crosshair,
  Link2,
  Unlink,
  XCircle,
  Focus,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

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

type EdgeType = 'command' | 'sync' | 'twin' | 'delegate' | 'supervise' | 'broadcast'

interface Connection {
  id: string
  from: string
  to: string
  type: EdgeType
  strength?: number
}

type ViewMode = 'radial' | 'grid'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  agentId: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { color: string; colorRgb: string; icon: LucideIcon; label: string }> = {
  '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f': { color: '#67E8F9', colorRgb: '103,232,249', icon: Brain, label: 'Strategy' },
  '\u0422\u0430\u043a\u0442\u0438\u043a\u0430': { color: '#22D3EE', colorRgb: '34,211,238', icon: Target, label: 'Tactics' },
  '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c': { color: '#06B6D4', colorRgb: '6,182,212', icon: Shield, label: 'Control' },
  '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435': { color: '#06B6D4', colorRgb: '6,182,212', icon: Zap, label: 'Execution' },
  '\u041f\u0430\u043c\u044f\u0442\u044c': { color: '#0891B2', colorRgb: '8,145,178', icon: Database, label: 'Memory' },
  '\u041c\u043e\u043d\u0438\u0442\u043e\u0440\u0438\u043d\u0433': { color: '#0E7490', colorRgb: '14,116,144', icon: Activity, label: 'Monitoring' },
  '\u041a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u044f': { color: '#155E75', colorRgb: '21,94,117', icon: Network, label: 'Communication' },
  '\u041e\u0431\u0443\u0447\u0435\u043d\u0438\u0435': { color: '#164E63', colorRgb: '22,78,99', icon: Sparkles, label: 'Learning' },
}

const ROLE_ORDER = ['\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f', '\u0422\u0430\u043a\u0442\u0438\u043a\u0430', '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c', '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435', '\u041f\u0430\u043c\u044f\u0442\u044c', '\u041c\u043e\u043d\u0438\u0442\u043e\u0440\u0438\u043d\u0433', '\u041a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u044f', '\u041e\u0431\u0443\u0447\u0435\u043d\u0438\u0435']

const STATUS_COLORS: Record<string, string> = {
  active: '#22D3EE',
  idle: '#6B7280',
  error: '#EF4444',
  offline: '#4B5563',
  paused: '#F59E0B',
  standby: '#8B5CF6',
}

const FORMULA_COLORS: Record<string, string> = {
  CoT: '#999999', ToT: '#999999', GoT: '#999999', AoT: '#999999', SoT: '#999999',
  CoVe: '#888888', Reflexion: '#888888', SelfConsistency: '#888888', SelfRefine: '#888888',
  ReWOO: '#777777', ReAct: '#777777', PromptChaining: '#777777', PlanAndSolve: '#777777', StepBack: '#777777', LeastToMost: '#777777',
  MoA: '#666666', LATS: '#666666', PoT: '#666666', DSPy: '#666666', MetaCoT: '#666666',
}

const EDGE_CONFIG: Record<EdgeType, { strokeDasharray: string | undefined; label: string; icon: LucideIcon; color: string }> = {
  command: { strokeDasharray: undefined, label: 'Command', icon: ArrowRight, color: '#67E8F9' },
  sync: { strokeDasharray: '3 5', label: 'Sync', icon: ArrowLeftRight, color: '#64748B' },
  twin: { strokeDasharray: '8 4', label: 'Twin', icon: Diamond, color: '#22D3EE' },
  delegate: { strokeDasharray: '6 3', label: 'Delegate', icon: Workflow, color: '#0891B2' },
  supervise: { strokeDasharray: '2 4', label: 'Supervise', icon: Eye, color: '#475569' },
  broadcast: { strokeDasharray: '12 4 2 4', label: 'Broadcast', icon: Megaphone, color: '#0E7490' },
}

const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  'building-2': Building2, 'bar-chart-3': BarChart3, 'sparkles': Sparkles,
  'target': Target, 'clipboard-list': ClipboardList, 'radio': Radio,
  'search': Search, 'trending-up': TrendingUp, 'shield-check': ShieldCheck,
  'zap': Zap, 'flame': Flame, 'bug': Bug, 'check-circle': CheckCircle,
  'brain': Brain, 'shield': Shield, 'activity': Activity, 'book-open': BookOpen,
  'hard-drive': HardDrive, 'file-search': FileSearch, 'monitor': Monitor,
  'bell': Bell, 'gauge': Gauge, 'network': Network, 'megaphone': Megaphone,
  'workflow': Workflow, 'git-branch': GitBranch, 'refresh-ccw': RefreshCcw,
  'binary': Binary,
}

function getAvatarIcon(avatarName: string): LucideIcon {
  return AVATAR_ICON_MAP[avatarName] || Brain
}

// ─── Background Terrain Contour Lines ─────────────────────────────────────────

function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const contoursRef = useRef<Array<{
    cx: number; cy: number; rings: number[]; opacity: number; pulse: number; pulseDir: number
  }>>([])
  const markersRef = useRef<Array<{ x: number; y: number }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      contoursRef.current = []
      markersRef.current = []
    }
    resize()
    window.addEventListener('resize', resize)

    if (contoursRef.current.length === 0) {
      for (let i = 0; i < 5; i++) {
        const ringCount = 4 + Math.floor(Math.random() * 3)
        const baseSize = 40 + Math.random() * 60
        const rings: number[] = []
        for (let r = 0; r < ringCount; r++) {
          rings.push(baseSize + r * (15 + Math.random() * 10))
        }
        contoursRef.current.push({
          cx: Math.random() * canvas.width,
          cy: Math.random() * canvas.height,
          rings,
          opacity: 0.08 + Math.random() * 0.12,
          pulse: 0,
          pulseDir: Math.random() > 0.5 ? 1 : -1,
        })
      }
      for (let i = 0; i < 25; i++) {
        markersRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const m of markersRef.current) {
        ctx.strokeStyle = 'rgba(51, 51, 51, 0.3)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(m.x - 3, m.y)
        ctx.lineTo(m.x + 3, m.y)
        ctx.moveTo(m.x, m.y - 3)
        ctx.lineTo(m.x, m.y + 3)
        ctx.stroke()
      }
      for (const c of contoursRef.current) {
        c.pulse += 0.003 * c.pulseDir
        if (c.pulse > 1 || c.pulse < -1) c.pulseDir *= -1
        const currentOpacity = c.opacity + c.pulse * 0.06
        for (let ri = 0; ri < c.rings.length; ri++) {
          const baseR = c.rings[ri]
          ctx.beginPath()
          const segments = 48
          for (let s = 0; s <= segments; s++) {
            const angle = (2 * Math.PI * s) / segments
            const irregularity =
              Math.sin(angle * 3 + ri * 0.5) * baseR * 0.08 +
              Math.sin(angle * 5 + ri * 1.2) * baseR * 0.04 +
              Math.cos(angle * 2 + ri * 0.8) * baseR * 0.06
            const r = baseR + irregularity
            const px = c.cx + Math.cos(angle) * r
            const py = c.cy + Math.sin(angle) * r * 0.85
            if (s === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.strokeStyle = `rgba(6, 182, 212, ${currentOpacity * (1 - ri * 0.12)})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
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

// ─── Background Grid (zoom-aware) ────────────────────────────────────────────

function BackgroundGrid({ width, height, zoom: zoomLevel }: { width: number; height: number; zoom: number }) {
  const baseSpacing = 60
  // Scale grid spacing with zoom to keep visual density consistent
  const spacing = baseSpacing * Math.max(0.5, Math.min(2, 1 / zoomLevel))
  return (
    <g opacity={0.06}>
      {Array.from({ length: Math.ceil(width / spacing) + 1 }, (_, i) => (
        <line
          key={`vg-${i}`}
          x1={i * spacing}
          y1={0}
          x2={i * spacing}
          y2={height}
          stroke="#333333"
          strokeWidth={0.15 * Math.max(0.5, zoomLevel)}
        />
      ))}
      {Array.from({ length: Math.ceil(height / spacing) + 1 }, (_, i) => (
        <line
          key={`hg-${i}`}
          x1={0}
          y1={i * spacing}
          x2={width}
          y2={i * spacing}
          stroke="#333333"
          strokeWidth={0.15 * Math.max(0.5, zoomLevel)}
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
  x1, y1, x2, y2, color, colorRgb, type, strength = 1, hoveredEdge, fromName, toName, isPulsing = false,
}: {
  x1: number; y1: number; x2: number; y2: number
  color: string; colorRgb: string; type: EdgeType; strength?: number
  hoveredEdge: string | null; fromName: string; toName: string
  isPulsing?: boolean
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

  const arrowLen = 8
  const endAngle = Math.atan2(y2 - cy1, x2 - cx1)
  const arrowX1 = x2 - arrowLen * Math.cos(endAngle - Math.PI / 6)
  const arrowY1 = y2 - arrowLen * Math.sin(endAngle - Math.PI / 6)
  const arrowX2 = x2 - arrowLen * Math.cos(endAngle + Math.PI / 6)
  const arrowY2 = y2 - arrowLen * Math.sin(endAngle + Math.PI / 6)

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
            r={isPulsing ? 5 : 3}
            fill={color}
            opacity={isPulsing ? 1.0 : 0.8}
          >
            <animate
              attributeName="opacity"
              values={isPulsing ? "0.6;1;0.6" : "0.4;1;0.4"}
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </>
    )
  }

  // ─── Enhanced Connection Strength Visualization ───
  // Stronger connections = thicker + brighter lines
  const strengthFactor = 0.5 + strength * 0.5 // maps [0,1] → [0.5, 1.0]
  const baseStrokeWidth = type === 'command' ? 0.2
    : type === 'twin' ? 0.2
    : type === 'delegate' ? 0.18
    : type === 'supervise' ? 0.12
    : type === 'broadcast' ? 0.15
    : 0.15
  const strokeWidth = baseStrokeWidth * strengthFactor

  const strokeColor = EDGE_CONFIG[type].color
  const strokeOpacity = isPulsing ? 0.4 * strengthFactor : isHovered ? 0.4 * strengthFactor : 0.18 * strengthFactor

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
        strokeOpacity={strokeOpacity}
        strokeDasharray={EDGE_CONFIG[type].strokeDasharray}
      />
      {/* Glow path - stronger for stronger connections */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 0.5}
        strokeOpacity={isPulsing ? 0.5 * strengthFactor : isHovered ? 0.5 * strengthFactor : 0.25 * strengthFactor}
        strokeDasharray={EDGE_CONFIG[type].strokeDasharray}
      />

      {/* Twin pulsing glow */}
      {type === 'twin' && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={0.2}
          strokeOpacity={0.08}
          strokeDasharray="8 4"
        >
          <animate
            attributeName="strokeOpacity"
            values="0.03;0.1;0.03"
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
          fill={EDGE_CONFIG.sync.color}
          opacity={isHovered ? 0.8 : 0.5}
        />
      )}

      {/* Diamond markers for twin */}
      {type === 'twin' && (
        <polygon
          points={`${midX},${midY - 5} ${midX + 5},${midY} ${midX},${midY + 5} ${midX - 5},${midY}`}
          fill={color}
          opacity={0.6}
        />
      )}

      {/* Diamond icon at midpoint for delegate edges */}
      {type === 'delegate' && (
        <polygon
          points={`${midX},${midY - 4} ${midX + 4},${midY} ${midX},${midY + 4} ${midX - 4},${midY}`}
          fill={EDGE_CONFIG.delegate.color}
          opacity={0.7}
        />
      )}

      {/* Megaphone icon at midpoint for broadcast edges */}
      {type === 'broadcast' && (
        <g transform={`translate(${midX}, ${midY})`} opacity={0.7}>
          <polygon points="-3,-3 2,-1 2,1 -3,3" fill={EDGE_CONFIG.broadcast.color} />
          <rect x={2} y={-2} width={2} height={4} rx={0.5} fill={EDGE_CONFIG.broadcast.color} />
          <line x1={5} y1={-3} x2={6} y2={-4} stroke={EDGE_CONFIG.broadcast.color} strokeWidth={0.5} />
          <line x1={5} y1={0} x2={7} y2={0} stroke={EDGE_CONFIG.broadcast.color} strokeWidth={0.5} />
          <line x1={5} y1={3} x2={6} y2={4} stroke={EDGE_CONFIG.broadcast.color} strokeWidth={0.5} />
        </g>
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
            fill="rgba(26, 26, 26, 0.92)"
            stroke={strokeColor}
            strokeWidth={0.15}
            strokeOpacity={0.2}
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
            fill="rgba(13, 13, 13, 0.95)"
            stroke="rgba(51,51,51,0.5)"
            strokeWidth={0.15}
          />
          <text
            x={midX}
            y={midY + 20}
            textAnchor="middle"
            fill="#FFFFFF"
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

// ─── Agent Node (Enhanced with search glow) ──────────────────────────────────

function AgentNode({
  agent,
  x,
  y,
  isSelected,
  isHighlighted,
  isDimmed,
  isCollapsed,
  skillCount,
  taskCount = 0,
  statusTransition = null,
  onClick,
  onToggleCollapse,
  onHover,
  onContextMenu,
}: {
  agent: Agent
  x: number
  y: number
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  isCollapsed: boolean
  skillCount: number
  taskCount?: number
  statusTransition: { status: string; timestamp: number } | null
  onClick: () => void
  onToggleCollapse: () => void
  onHover: (id: string | null) => void
  onContextMenu: (e: React.MouseEvent, agentId: string) => void
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
      onContextMenu={(e) => onContextMenu(e, agent.id)}
      onMouseEnter={() => onHover(agent.id)}
      onMouseLeave={() => onHover(null)}
      style={{ opacity: isDimmed ? 0.2 : isCollapsed ? 0.4 : 1, transition: 'opacity 0.4s ease' }}
    >
      {/* Search match glow effect - enhanced with filter */}
      {isHighlighted && (
        <>
          <motion.circle
            r={50}
            fill="none"
            stroke={config.color}
            strokeWidth={0.2}
            strokeOpacity={0.06}
            filter="url(#searchGlow)"
            animate={{
              r: [50, 54, 50],
              strokeOpacity: [0.06, 0.02, 0.06],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            r={44}
            fill="none"
            stroke={config.color}
            strokeWidth={0.3}
            strokeOpacity={0.2}
            animate={{
              r: [44, 48, 44],
              strokeOpacity: [0.2, 0.08, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            r={38}
            fill={`rgba(${config.colorRgb}, 0.04)`}
            animate={{
              r: [38, 40, 38],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Selection ping animation (expanding ring that fades) */}
      {isSelected && (
        <circle r={28} fill="none" stroke={config.color} strokeWidth={0.4} strokeOpacity={0.5}>
          <animate attributeName="r" from="28" to="55" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="strokeOpacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="strokeWidth" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Activity indicator ring - spins when active */}
      {agent.status === 'active' && (
        <motion.circle
          r={38}
          fill="none"
          stroke={config.color}
          strokeWidth={0.1}
          strokeOpacity={0.12}
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
        strokeWidth={0.12}
        strokeOpacity={0.06}
        animate={{
          r: [35, 38, 35],
          strokeOpacity: [0.07, 0.12, 0.07],
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
          strokeWidth={0.25}
          strokeOpacity={0.3}
          animate={{
            r: [40, 43, 40],
            strokeOpacity: [0.3, 0.15, 0.3],
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
        strokeWidth={isHighlighted ? 0.3 : 0.2}
        strokeOpacity={isHighlighted ? 0.4 : 0.2}
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
        y={40}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="9"
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {agent.name}
      </text>

      {/* Task count indicator */}
      <text
        y={48}
        textAnchor="middle"
        fill="#B0B0B0"
        fontSize="6"
        opacity={0.5}
        style={{ pointerEvents: 'none' }}
      >
        {taskCount} tasks
      </text>

      {/* Status transition pulse ring */}
      {statusTransition && (
        <circle
          r={3}
          fill="none"
          stroke={STATUS_COLORS[statusTransition.status] || STATUS_COLORS.offline}
          strokeWidth={0.8}
          transform="translate(18, -20)"
        >
          <animate attributeName="r" from="3" to="14" dur="1s" fill="freeze" />
          <animate attributeName="strokeOpacity" from="0.8" to="0" dur="1s" fill="freeze" />
          <animate attributeName="strokeWidth" from="0.8" to="0" dur="1s" fill="freeze" />
        </circle>
      )}

      {/* Status transition floating label */}
      {statusTransition && (
        <g transform="translate(18, -32)">
          <text
            textAnchor="middle"
            fill={STATUS_COLORS[statusTransition.status] || STATUS_COLORS.offline}
            fontSize="6"
            fontWeight="700"
            style={{ pointerEvents: 'none' }}
          >
            STATUS: {statusTransition.status.toUpperCase()}
            <animate attributeName="opacity" from="1" to="0" dur="2s" fill="freeze" />
          </text>
        </g>
      )}

      {/* Formula badge */}
      <g transform="translate(-15, -19)">
        <rect
          width={30}
          height={12}
          rx={3}
          fill={formulaColor}
          fillOpacity={0.15}
          stroke={formulaColor}
          strokeWidth={0.1}
          strokeOpacity={0.3}
        />
        <text
          x={15}
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

      {/* Status indicator dot */}
      <g transform="translate(18, -20)">
        <motion.circle
          r={3}
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
            fill="rgba(26, 26, 26, 0.92)"
            stroke={config.color}
            strokeWidth={0.2}
            strokeOpacity={0.3}
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
        fill="rgba(13, 13, 13, 0.95)"
        stroke={config.color}
        strokeWidth={0.15}
        strokeOpacity={0.15}
      />
      <text
        x={12}
        y={16}
        fill="#FFFFFF"
        fontSize="10"
        fontWeight="700"
        style={{ pointerEvents: 'none' }}
      >
        {agent.name}
      </text>
      <text
        x={12}
        y={28}
        fill={config.color}
        fontSize="8"
        style={{ pointerEvents: 'none' }}
      >
        {agent.role}
      </text>
      <circle cx={120} cy={12} r={4} fill={statusColor} />
      <text
        x={128}
        y={15}
        fill="#B0B0B0"
        fontSize="7"
        style={{ pointerEvents: 'none' }}
      >
        {agent.status}
      </text>
      <text
        x={12}
        y={42}
        fill="#B0B0B0"
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

// ─── Agent Detail Panel (Improved) ───────────────────────────────────────────

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
        background: 'rgba(26, 26, 26, 0.92)',
        backdropFilter: 'blur(24px)',
        border: `1px solid rgba(${config.colorRgb}, 0.3)`,
        boxShadow: `0 0 40px rgba(${config.colorRgb}, 0.1), 0 8px 32px rgba(0,0,0,0.5)`,
      }}
    >
      <ScrollArea className="h-full">
        {/* Top colored stripe with animation */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
            opacity: 0.7,
            transformOrigin: 'center',
          }}
        />
        <div className="p-5">
          {/* Header with close button */}
          <div className="flex items-start justify-between mb-5">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center gap-3"
            >
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
            </motion.div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:scale-110"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(51,51,51,0.5)',
                color: '#B0B0B0',
              }}
              title="Close panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Status & Formula row */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center gap-2 mb-4"
          >
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
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mb-5"
          >
            <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1.5">Description</h4>
            <p className="text-[#B0B0B0] text-xs leading-relaxed">{agent.description}</p>
          </motion.div>

          {/* Cognitive Formula */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="mb-5"
          >
            <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1.5">Cognitive Formula</h4>
            <div
              className="rounded-lg p-3"
              style={{
                background: `rgba(${config.colorRgb}, 0.08)`,
                border: `1px solid rgba(${config.colorRgb}, 0.2)`,
              }}
            >
              <span className="font-bold text-sm" style={{ color: formulaColor }}>{agent.formula}</span>
              <p className="text-[#B0B0B0] text-[10px] mt-1">
                {agent.formula === 'CoT' && 'Chain of Thought -- step-by-step reasoning decomposition'}
                {agent.formula === 'ToT' && 'Tree of Thoughts -- explores multiple reasoning paths'}
                {agent.formula === 'GoT' && 'Graph of Thoughts -- models reasoning as a directed graph'}
                {agent.formula === 'AoT' && 'Algorithm of Thoughts -- algorithmic reasoning via LLM'}
                {agent.formula === 'SoT' && 'Skeleton of Thought -- outline first, then fill details'}
                {agent.formula === 'CoVe' && 'Chain of Verification -- validates outputs with self-checks'}
                {agent.formula === 'ReWOO' && 'Research without Observation -- plans then executes'}
                {agent.formula === 'Reflexion' && 'Self-reflection -- learns from past mistakes'}
                {agent.formula === 'ReAct' && 'Reasoning + Action -- interleaves thought and action'}
                {agent.formula === 'MoA' && 'Mixture of Agents -- combines multiple agent outputs'}
                {agent.formula === 'SelfRefine' && 'Self-Refine -- iteratively improves its own output'}
                {agent.formula === 'LATS' && 'Language Agent Tree Search -- MCTS + LLM reasoning'}
                {agent.formula === 'SelfConsistency' && 'Self-Consistency -- multiple paths + majority vote'}
                {agent.formula === 'PoT' && 'Program of Thought -- reasons via code execution'}
                {agent.formula === 'DSPy' && 'DSPy -- Declarative Self-Improving Prompt Optimization'}
                {agent.formula === 'PromptChaining' && 'Prompt Chaining -- Sequential task decomposition via chained prompts'}
                {agent.formula === 'LeastToMost' && 'Least-to-Most -- Progressive complexity reasoning from simple to hard'}
                {agent.formula === 'StepBack' && 'Step-Back -- Abstract before solving for deeper reasoning'}
                {agent.formula === 'PlanAndSolve' && 'Plan-and-Solve -- Two-phase: plan first, then execute'}
                {agent.formula === 'MetaCoT' && 'Meta-Co-T -- Meta-reasoning over Chain of Thought decomposition'}
              </p>
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mb-5"
          >
            <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-2">Skills</h4>
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
          </motion.div>

          {/* Connections */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="mb-5"
          >
            <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-2">Connections</h4>
            <div className="space-y-1.5">
              {parent && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#B0B0B0] w-16">Parent</span>
                  <AgentAvatarIcon avatar={parent.avatar} size={14} color={ROLE_CONFIG[parent.roleGroup]?.color || '#888'} />
                  <span className="text-white">{parent.name}</span>
                </div>
              )}
              {twin && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#B0B0B0] w-16">Twin</span>
                  <AgentAvatarIcon avatar={twin.avatar} size={14} color={ROLE_CONFIG[twin.roleGroup]?.color || '#888'} />
                  <span className="text-white">{twin.name}</span>
                </div>
              )}
              {children.length > 0 && (
                <div>
                  <span className="text-[#B0B0B0] text-xs">Children</span>
                  <div className="ml-2 mt-1 space-y-1">
                    {children.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5 text-xs text-[#B0B0B0]">
                        <AgentAvatarIcon avatar={c.avatar} size={14} color={ROLE_CONFIG[c.roleGroup]?.color || '#888'} />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {siblings.length > 0 && (
                <div>
                  <span className="text-[#B0B0B0] text-xs">Sync peers</span>
                  <div className="ml-2 mt-1 space-y-1">
                    {siblings.map(s => (
                      <div key={s.id} className="flex items-center gap-1.5 text-xs text-[#B0B0B0]">
                        <AgentAvatarIcon avatar={s.avatar} size={14} color={ROLE_CONFIG[s.roleGroup]?.color || '#888'} />
                        <span>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Task Count */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1.5">Tasks</h4>
            <div
              className="rounded-lg px-3 py-2 inline-flex items-center gap-2"
              style={{
                background: `rgba(${config.colorRgb}, 0.08)`,
                border: `1px solid rgba(${config.colorRgb}, 0.2)`,
              }}
            >
              <Activity className="h-3.5 w-3.5" style={{ color: config.color }} />
              <span className="text-white font-bold text-sm">{agent.tasks?.length ?? 0}</span>
              <span className="text-[#B0B0B0] text-[10px]">assigned</span>
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}

// ─── Legend Panel (Compact with icons) ────────────────────────────────────────

function LegendPanel() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: 'rgba(26, 26, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(51,51,51,0.5)',
        width: 180,
      }}
    >
      {/* Gradient border overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(26,26,26,0.92), rgba(26,26,26,0.92)), linear-gradient(135deg, rgba(6,182,212,0.25), transparent, rgba(6,182,212,0.25))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          border: '1px solid transparent',
          borderRadius: '12px',
        }}
      />
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-2.5 pb-0"
      >
        <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold">Legend</h4>
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-[#555]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[#555]" />
        )}
      </button>

      {!collapsed && (
        <div className="px-2.5 pb-2.5">
          {/* Edge types with icons */}
          <div className="space-y-1 mb-2 mt-1.5">
            {(Object.entries(EDGE_CONFIG) as [EdgeType, typeof EDGE_CONFIG[EdgeType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                {React.createElement(cfg.icon, { size: 9, color: cfg.color })}
                <div className="w-5 h-0 flex-shrink-0" style={{ borderTop: `1.5px ${type === 'command' ? 'solid' : type === 'sync' ? 'dotted' : 'dashed'} ${cfg.color}`, opacity: 0.7 }} />
                <span className="text-[8px] text-[#B0B0B0]">{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px w-full my-1.5" style={{ background: 'rgba(51,51,51,0.5)' }} />

          {/* Status colors */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[8px] text-[#B0B0B0] capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stats Dashboard ─────────────────────────────────────────────────────────

function StatsDashboard({ stats }: { stats: { total: number; active: number; idle: number; error: number; offline: number; tasks: number } }) {
  return (
    <div
      className="rounded-xl p-3 relative overflow-hidden"
      style={{
        background: 'rgba(26, 26, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(51,51,51,0.5)',
        width: 180,
      }}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(6,182,212,0.04), rgba(6,182,212,0.04))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(26,26,26,0.92), rgba(26,26,26,0.92)), linear-gradient(135deg, rgba(6,182,212,0.25), transparent, rgba(6,182,212,0.25))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          border: '1px solid transparent',
          borderRadius: '12px',
        }}
      />
      <h4 className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-2">Stats</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-white font-bold text-lg">{stats.total}</span>
          <p className="text-[9px] text-[#B0B0B0]">Total</p>
        </div>
        <div>
          <span className="text-cyan-400 font-bold text-lg">{stats.active}</span>
          <p className="text-[9px] text-[#B0B0B0]">Active</p>
        </div>
        <div>
          <span className="text-gray-400 font-bold text-lg">{stats.idle}</span>
          <p className="text-[9px] text-[#B0B0B0]">Idle</p>
        </div>
        <div>
          <span className="text-[#B0B0B0] font-bold text-lg">{stats.tasks}</span>
          <p className="text-[9px] text-[#B0B0B0]">Tasks</p>
        </div>
      </div>
    </div>
  )
}

// ─── Mini-Map (Improved) ─────────────────────────────────────────────────────

function MiniMap({
  agents,
  positions,
  connections,
  dimensions,
  pan,
  zoom,
  onClickMap,
  selectedAgentId,
}: {
  agents: Agent[]
  positions: Record<string, { x: number; y: number }>
  connections: Connection[]
  dimensions: { width: number; height: number }
  pan: { x: number; y: number }
  zoom: number
  onClickMap: (ratioX: number, ratioY: number) => void
  selectedAgentId: string | null
}) {
  const scale = 160 / Math.max(dimensions.width, dimensions.height)
  const mapW = dimensions.width * scale
  const mapH = dimensions.height * scale

  const vpW = (dimensions.width / zoom) * scale
  const vpH = (dimensions.height / zoom) * scale
  const vpX = (-pan.x / zoom) * scale
  const vpY = (-pan.y / zoom) * scale

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(26, 26, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(51,51,51,0.5)',
        width: 180,
        padding: 10,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] text-[#555] uppercase tracking-wider font-semibold">Overview</span>
        <span className="text-[8px] text-[#555]">{Math.round(zoom * 100)}%</span>
      </div>
      <svg
        width={mapW}
        height={mapH}
        className="cursor-pointer rounded"
        style={{ background: 'rgba(0,0,0,0.3)' }}
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
          const baseRadius = minDim * 0.14
          const ringSpacing = minDim * 0.14
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
              strokeWidth={0.15}
              strokeOpacity={0.12}
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
              stroke={EDGE_CONFIG[conn.type].color}
              strokeWidth={0.15}
              strokeOpacity={0.15}
              strokeDasharray={conn.type === 'sync' ? '1 2' : conn.type === 'twin' ? '2 1' : undefined}
            />
          )
        })}

        {/* Agent dots */}
        {agents.map(agent => {
          const pos = positions[agent.id]
          if (!pos) return null
          const cfg = ROLE_CONFIG[agent.roleGroup]
          const isSelected = agent.id === selectedAgentId
          return (
            <circle
              key={agent.id}
              cx={pos.x * scale}
              cy={pos.y * scale}
              r={isSelected ? 3 : 1.5}
              fill={isSelected ? '#FFFFFF' : cfg.color}
              opacity={isSelected ? 1 : 0.8}
            />
          )
        })}

        {/* Viewport indicator glow */}
        <rect
          x={vpX - 1}
          y={vpY - 1}
          width={vpW + 2}
          height={vpH + 2}
          fill="none"
          stroke="#06B6D4"
          strokeWidth={1}
          strokeOpacity={0.1}
          rx={2}
          filter="url(#orbGlow)"
        />
        {/* Viewport indicator */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW}
          height={vpH}
          fill="rgba(6,182,212,0.04)"
          stroke="#06B6D4"
          strokeWidth={0.3}
          strokeOpacity={0.4}
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
      const res = await fetch('/api/agents', {
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
      if (!res.ok) throw new Error('Failed to create agent')
      toast.success(`Agent ${name.trim()} created successfully`)
      setName('')
      setRole('')
      setSkillsStr('')
      setOpen(false)
      onCreated()
    } catch {
      toast.error('Failed to create agent')
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
          className="h-7 w-7 text-[#B0B0B0] hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        style={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(51,51,51,0.5)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Create Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1 block">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Agent name"
              className="bg-white/5 border-white/10 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1 block">Role</label>
            <Input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Agent role"
              className="bg-white/5 border-white/10 text-white text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1 block">Group</label>
              <Select value={roleGroup} onValueChange={setRoleGroupVal}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(26, 26, 26, 0.95)' }}>
                  {ROLE_ORDER.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1 block">Status</label>
              <Select value={status} onValueChange={setStatusVal}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(26, 26, 26, 0.95)' }}>
                  {['active', 'idle', 'error', 'offline'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1 block">Formula</label>
              <Select value={formula} onValueChange={setFormula}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(26, 26, 26, 0.95)' }}>
                  {['CoT', 'ToT', 'GoT', 'AoT', 'SoT', 'CoVe', 'ReWOO', 'Reflexion', 'ReAct', 'MoA', 'SelfRefine', 'LATS', 'SelfConsistency', 'PoT', 'DSPy', 'PromptChaining', 'LeastToMost', 'StepBack', 'PlanAndSolve', 'MetaCoT'].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[#B0B0B0] text-[10px] uppercase tracking-wider font-semibold mb-1 block">Skills (comma-separated)</label>
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
            className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {submitting ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Keyboard Shortcuts Dialog ────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ['/'], altKeys: ['Ctrl+K'], description: 'Focus search' },
  { keys: ['Esc'], description: 'Close detail panel / Close shortcuts' },
  { keys: ['+', '='], description: 'Zoom in' },
  { keys: ['-'], description: 'Zoom out' },
  { keys: ['0'], description: 'Reset zoom' },
  { keys: ['F'], description: 'Fit to screen' },
  { keys: ['1-8'], description: 'Filter by role group (1=Strategy, 2=Tactics, ...)' },
  { keys: ['9'], description: 'Clear role group filter (show all)' },
  { keys: ['G'], description: 'Toggle grid / radial view' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
]

function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        style={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(51,51,51,0.5)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[#06B6D4]" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded-md"
              style={{
                background: i % 2 === 0 ? 'rgba(45, 45, 45, 0.3)' : 'transparent',
              }}
            >
              <span className="text-[#B0B0B0] text-xs">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {(shortcut.altKeys || []).map((key, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <span className="text-[#555] text-[10px]">or</span>}
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        color: '#06B6D4',
                      }}
                    >
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
                {shortcut.keys.map((key, j) => (
                  <React.Fragment key={`k-${j}`}>
                    {(shortcut.altKeys && shortcut.altKeys.length > 0 || j > 0) && (
                      <span className="text-[#555] text-[10px]">or</span>
                    )}
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold min-w-[24px] text-center"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        color: '#06B6D4',
                      }}
                    >
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#555] pt-1 text-center">
          Shortcuts are disabled when typing in input fields
        </p>
      </DialogContent>
    </Dialog>
  )
}

// ─── Right-Click Context Menu ────────────────────────────────────────────────

function NodeContextMenu({
  contextMenu,
  agent,
  onClose,
  onViewDetails,
  onHighlightConnections,
  onToggleCollapse,
  onFocusNode,
}: {
  contextMenu: ContextMenuState
  agent: Agent | null
  onClose: () => void
  onViewDetails: () => void
  onHighlightConnections: () => void
  onToggleCollapse: () => void
  onFocusNode: () => void
}) {
  if (!contextMenu.visible || !agent) return null
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435']
  const hasChildren = (agent.children && agent.children.length > 0) || false

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[60] rounded-xl overflow-hidden"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(16px)',
        border: `1px solid rgba(${config.colorRgb}, 0.3)`,
        boxShadow: `0 0 20px rgba(${config.colorRgb}, 0.1), 0 8px 24px rgba(0,0,0,0.5)`,
        minWidth: 180,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid rgba(51,51,51,0.5)` }}>
        <AgentAvatarIcon avatar={agent.avatar} size={14} color={config.color} />
        <span className="text-white text-xs font-semibold truncate">{agent.name}</span>
      </div>
      <div className="py-1">
        <button
          onClick={() => { onViewDetails(); onClose() }}
          className="w-full text-left px-3 py-1.5 text-xs text-[#B0B0B0] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
        >
          <Eye className="w-3 h-3" style={{ color: config.color }} />
          View Details
        </button>
        <button
          onClick={() => { onHighlightConnections(); onClose() }}
          className="w-full text-left px-3 py-1.5 text-xs text-[#B0B0B0] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
        >
          <Link2 className="w-3 h-3" style={{ color: config.color }} />
          Highlight Connections
        </button>
        {hasChildren && (
          <button
            onClick={() => { onToggleCollapse(); onClose() }}
            className="w-full text-left px-3 py-1.5 text-xs text-[#B0B0B0] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <Layers className="w-3 h-3" style={{ color: config.color }} />
            Collapse/Expand
          </button>
        )}
        <button
          onClick={() => { onFocusNode(); onClose() }}
          className="w-full text-left px-3 py-1.5 text-xs text-[#B0B0B0] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
        >
          <Focus className="w-3 h-3" style={{ color: config.color }} />
          Focus
        </button>
      </div>
    </motion.div>
  )
}

// ─── Connection Filter Panel ─────────────────────────────────────────────────

function ConnectionFilterPanel({
  hiddenEdgeTypes,
  onToggleEdgeType,
}: {
  hiddenEdgeTypes: Set<EdgeType>
  onToggleEdgeType: (type: EdgeType) => void
}) {
  const [open, setOpen] = useState(false)
  const visibleCount = (Object.keys(EDGE_CONFIG) as EdgeType[]).length - hiddenEdgeTypes.size

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
        style={{
          background: visibleCount < 6 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(45, 45, 45, 0.5)',
          color: visibleCount < 6 ? '#06B6D4' : '#B0B0B0',
          border: `1px solid ${visibleCount < 6 ? 'rgba(6,182,212,0.3)' : 'rgba(51,51,51,0.5)'}`,
        }}
      >
        <Filter className="w-3 h-3" />
        <span className="hidden md:inline">Edges</span>
        <span className="text-[9px] opacity-60">{visibleCount}/{(Object.keys(EDGE_CONFIG) as EdgeType[]).length}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 rounded-xl overflow-hidden z-50"
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(51,51,51,0.5)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              width: 170,
            }}
          >
            <div className="px-2.5 py-1.5" style={{ borderBottom: '1px solid rgba(51,51,51,0.5)' }}>
              <span className="text-[9px] text-[#555] uppercase tracking-wider font-semibold">Connection Types</span>
            </div>
            <div className="py-1">
              {(Object.entries(EDGE_CONFIG) as [EdgeType, typeof EDGE_CONFIG[EdgeType]][]).map(([type, cfg]) => {
                const isHidden = hiddenEdgeTypes.has(type)
                return (
                  <button
                    key={type}
                    onClick={() => onToggleEdgeType(type)}
                    className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-xs transition-colors hover:bg-white/5"
                    style={{ color: isHidden ? '#555' : cfg.color }}
                  >
                    {isHidden ? (
                      <EyeOff className="w-3 h-3" style={{ color: '#555' }} />
                    ) : (
                      <Eye className="w-3 h-3" style={{ color: cfg.color }} />
                    )}
                    {React.createElement(cfg.icon, { size: 10, color: isHidden ? '#555' : cfg.color })}
                    <span className={isHidden ? 'line-through' : ''}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Breadcrumb Trail ────────────────────────────────────────────────────────

function BreadcrumbTrail({
  activeFilter,
  onClearFilter,
  zoom,
  onResetView,
}: {
  activeFilter: string | null
  onClearFilter: () => void
  zoom: number
  onResetView: () => void
}) {
  if (!activeFilter && zoom >= 0.95 && zoom <= 1.05) return null
  const cfg = activeFilter ? ROLE_CONFIG[activeFilter] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{
        background: 'rgba(26, 26, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <button
        onClick={onResetView}
        className="flex items-center gap-1 text-[10px] text-[#B0B0B0] hover:text-white transition-colors"
      >
        <Home className="w-3 h-3" />
        <span>All</span>
      </button>
      {(activeFilter || zoom < 0.95 || zoom > 1.05) && (
        <ChevronRight className="w-3 h-3 text-[#555]" />
      )}
      {zoom < 0.95 || zoom > 1.05 ? (
        <span className="text-[10px] text-[#06B6D4] font-medium">
          {Math.round(zoom * 100)}%
        </span>
      ) : null}
      {activeFilter && cfg && (
        <>
          {(zoom < 0.95 || zoom > 1.05) && (
            <ChevronRight className="w-3 h-3 text-[#555]" />
          )}
          <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: cfg.color }}>
            {React.createElement(cfg.icon, { size: 10, color: cfg.color })}
            {cfg.label}
          </span>
          <button
            onClick={onClearFilter}
            className="ml-1 text-[#555] hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentHierarchy({ onBack }: { onBack?: () => void }) {
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [statusTransitions, setStatusTransitions] = useState<Record<string, { status: string; timestamp: number }>>({})
  const [pulsingConnections, setPulsingConnections] = useState<Set<string>>(new Set())
  const [hiddenEdgeTypes, setHiddenEdgeTypes] = useState<Set<EdgeType>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, agentId: null })
  const [highlightedConnections, setHighlightedConnections] = useState<Set<string>>(new Set())
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
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

  // ─── Fit to Screen ────────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    // Calculate bounding box of all agent positions
    // We'll use the current positions after computing them
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // ─── Focus on a specific node ─────────────────────────────────────────
  const focusOnNode = useCallback((agentId: string, positions: Record<string, { x: number; y: number }>) => {
    const pos = positions[agentId]
    if (!pos) return
    const cx = dimensions.width / 2
    const cy = dimensions.height / 2
    setZoom(1.8)
    setPan({
      x: cx - pos.x * 1.8,
      y: cy - pos.y * 1.8,
    })
  }, [dimensions])

  // ─── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key === 'Escape') {
          ;(target as HTMLInputElement).blur()
          if (selectedAgent) setSelectedAgent(null)
          if (shortcutsOpen) setShortcutsOpen(false)
        }
        return
      }

      if (e.key === 'Escape') {
        if (contextMenu.visible) { setContextMenu({ visible: false, x: 0, y: 0, agentId: null }); return }
        if (shortcutsOpen) { setShortcutsOpen(false); return }
        if (selectedAgent) { setSelectedAgent(null); return }
        return
      }

      if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(3, z * 1.15))
        return
      }

      if (e.key === '-') {
        setZoom(z => Math.max(0.3, z * 0.85))
        return
      }

      if (e.key === '0') {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        return
      }

      // F: fit to screen
      if (e.key === 'f' || e.key === 'F') {
        fitToScreen()
        return
      }

      if (e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key) - 1
        if (index < ROLE_ORDER.length) {
          const group = ROLE_ORDER[index]
          setActiveFilter(prev => prev === group ? null : group)
        }
        return
      }

      if (e.key === '9') {
        setActiveFilter(null)
        return
      }

      if (e.key === 'g' || e.key === 'G') {
        setViewMode(prev => prev === 'radial' ? 'grid' : 'radial')
        return
      }

      if (e.key === '?') {
        setShortcutsOpen(prev => !prev)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAgent, shortcutsOpen, contextMenu.visible, fitToScreen])

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => {
      if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, agentId: null })
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [contextMenu.visible])

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

  // Toast for search with no results
  const prevSearchQuery = useRef('')
  useEffect(() => {
    if (
      searchQuery.trim() &&
      searchQuery !== prevSearchQuery.current &&
      searchMatches.size === 0 &&
      agents.length > 0
    ) {
      toast(`No agents found matching '${searchQuery.trim()}'`, {
        style: {
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(51,51,51,0.5)',
          color: '#B0B0B0',
        },
      })
    }
    prevSearchQuery.current = searchQuery
  }, [searchQuery, searchMatches, agents.length])

  // ─── Simulated Status Transitions (every 15s) ────────────────────────────
  useEffect(() => {
    if (agents.length === 0) return
    const statusCycle = ['active', 'idle', 'paused', 'standby'] as const
    const interval = setInterval(() => {
      const count = 1 + Math.floor(Math.random() * 2)
      const newTransitions: Record<string, { status: string; timestamp: number }> = {}
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * agents.length)
        const agent = agents[idx]
        const currentIdx = statusCycle.indexOf(agent.status as typeof statusCycle[number])
        const nextIdx = (currentIdx + 1 + Math.floor(Math.random() * (statusCycle.length - 1))) % statusCycle.length
        const newStatus = statusCycle[nextIdx]
        newTransitions[agent.id] = { status: newStatus, timestamp: Date.now() }
      }
      setAgents(prev => prev.map(a => {
        const transition = newTransitions[a.id]
        if (transition) return { ...a, status: transition.status }
        return a
      }))
      setStatusTransitions(prev => ({ ...prev, ...newTransitions }))
      setTimeout(() => {
        setStatusTransitions(prev => {
          const next = { ...prev }
          for (const id of Object.keys(newTransitions)) {
            delete next[id]
          }
          return next
        })
      }, 2000)
    }, 15000)
    return () => clearInterval(interval)
  }, [agents])

  const { positions, connections, groupCentroids } = useMemo(() => {
    const cx = dimensions.width / 2
    const cy = dimensions.height / 2
    const minDim = Math.min(dimensions.width, dimensions.height)
    // ─── Improved spacing: wider rings for less overlap ───
    const baseRadius = minDim * 0.14
    const ringSpacing = minDim * 0.14

    const groupRadii: Record<string, number> = {
      '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f': baseRadius,
      '\u0422\u0430\u043a\u0442\u0438\u043a\u0430': baseRadius + ringSpacing,
      '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c': baseRadius + ringSpacing * 2,
      '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435': baseRadius + ringSpacing * 3,
      '\u041f\u0430\u043c\u044f\u0442\u044c': baseRadius + ringSpacing * 4,
      '\u041c\u043e\u043d\u0438\u0442\u043e\u0440\u0438\u043d\u0433': baseRadius + ringSpacing * 5,
      '\u041a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u044f': baseRadius + ringSpacing * 6,
      '\u041e\u0431\u0443\u0447\u0435\u043d\u0438\u0435': baseRadius + ringSpacing * 7,
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
          // Add slight jitter to reduce overlap between groups with same angle
          const jitter = count > 1 ? (i % 2 === 0 ? 8 : -8) : 0
          const ax = cx + Math.cos(angle) * (radius + jitter)
          const ay = cy + Math.sin(angle) * (radius + jitter)
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

    // Build connections from hierarchy API data
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

    // Sync edges
    const syncSeen = new Set<string>()
    for (const group of ROLE_ORDER) {
      const groupAgents = agents.filter(a => a.roleGroup === group)
      for (let i = 0; i < groupAgents.length; i++) {
        for (let j = i + 1; j < groupAgents.length; j++) {
          const a1 = groupAgents[i]
          const a2 = groupAgents[j]
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

    // Delegate edges
    const taktikaAgents = agents.filter(a => a.roleGroup === '\u0422\u0430\u043a\u0442\u0438\u043a\u0430')
    const ispolnenieAgents = agents.filter(a => a.roleGroup === '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435')
    for (const t of taktikaAgents) {
      if (t.role.includes('Coordinator') && pos[t.id]) {
        for (const e of ispolnenieAgents) {
          if (!e.parentId && pos[e.id]) {
            conns.push({
              id: `delegate-${t.id}-${e.id}`,
              from: t.id,
              to: e.id,
              type: 'delegate',
              strength: 0.7,
            })
          }
        }
      }
    }

    // Supervise edges
    const kontrolAgents = agents.filter(a => a.roleGroup === '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c')
    for (const c of kontrolAgents) {
      if (pos[c.id]) {
        for (const e of ispolnenieAgents) {
          if (pos[e.id] && conns.filter(cn => cn.type === 'supervise' && cn.to === e.id).length === 0) {
            conns.push({
              id: `supervise-${c.id}-${e.id}`,
              from: c.id,
              to: e.id,
              type: 'supervise',
              strength: 0.4,
            })
            break
          }
        }
      }
    }

    // Broadcast edges
    const strategyAgents = agents.filter(a => a.roleGroup === '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f' && !a.parentId)
    for (const s of strategyAgents) {
      if (pos[s.id]) {
        const groupLeads = agents.filter(a => !a.parentId && a.roleGroup !== '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f' && pos[a.id])
        for (const lead of groupLeads) {
          conns.push({
            id: `broadcast-${s.id}-${lead.id}`,
            from: s.id,
            to: lead.id,
            type: 'broadcast',
            strength: 0.5,
          })
        }
      }
    }

    return { positions: pos, connections: conns, groupCentroids: centroids }
  }, [agents, dimensions, viewMode])

  // ─── Simulated Connection Pulse (every 8s) ────────────────────────────────
  useEffect(() => {
    if (connections.length === 0) return
    const interval = setInterval(() => {
      const count = 1 + Math.floor(Math.random() * 2)
      const selected = new Set<string>()
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * connections.length)
        selected.add(connections[idx].id)
      }
      setPulsingConnections(selected)
      setTimeout(() => {
        setPulsingConnections(new Set())
      }, 3000)
    }, 8000)
    return () => clearInterval(interval)
  }, [connections])

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
    setActiveFilter(null)
  }, [])

  const isAgentDimmed = useCallback((agent: Agent) => {
    if (searchQuery.trim() && !searchMatches.has(agent.id)) return true
    if (activeFilter && agent.roleGroup !== activeFilter) return true
    // Dim agents not connected to highlighted connections
    if (highlightedConnections.size > 0) {
      const connectedAgentIds = new Set<string>()
      for (const conn of connections) {
        if (highlightedConnections.has(conn.id)) {
          connectedAgentIds.add(conn.from)
          connectedAgentIds.add(conn.to)
        }
      }
      if (!connectedAgentIds.has(agent.id)) return true
    }
    return false
  }, [activeFilter, searchQuery, searchMatches, highlightedConnections, connections])

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

  const handleContextMenu = useCallback((e: React.MouseEvent, agentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      agentId,
    })
  }, [])

  const handleToggleEdgeType = useCallback((type: EdgeType) => {
    setHiddenEdgeTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

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

  // Visible connections (filtered by hidden edge types)
  const visibleConnections = useMemo(() => {
    const visibleIds = new Set(visibleAgents.map(a => a.id))
    return connections.filter(c =>
      visibleIds.has(c.from) &&
      visibleIds.has(c.to) &&
      !hiddenEdgeTypes.has(c.type)
    )
  }, [connections, visibleAgents, hiddenEdgeTypes])

  // Context menu agent
  const contextMenuAgent = useMemo(() => {
    if (!contextMenu.agentId) return null
    return agents.find(a => a.id === contextMenu.agentId) || null
  }, [contextMenu.agentId, agents])

  // Empty state
  if (!loading && agents.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#000000' }}>
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
            <Database className="w-8 h-8 text-[#06B6D4]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Agent Data</h2>
          <p className="text-[#B0B0B0] text-sm mb-6 max-w-xs">
            The agent hierarchy is empty. Seed sample data to explore the visualization.
          </p>
          <Button
            onClick={handleSeed}
            className="bg-[#06B6D4] hover:bg-[#0891B2] text-white gap-2"
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
      style={{ background: '#000000' }}
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
            <feFlood floodColor="#06B6D4" floodOpacity="0.15" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
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
          {/* Search glow filter for highlighted nodes */}
          <filter id="searchGlow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feFlood floodColor="#06B6D4" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Arrow markers */}
          <marker id="arrowCommand" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#67E8F9" opacity="0.6" />
          </marker>
          <marker id="arrowSync" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#64748B" opacity="0.5" />
          </marker>
          <marker id="diamondTwin" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <polygon points="4 0, 8 4, 4 8, 0 4" fill="#06B6D4" opacity="0.6" />
          </marker>
        </defs>
      </svg>

      {/* ─── Improved Navigation bar ─── */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5 relative"
          style={{
            background: 'rgba(26, 26, 26, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(51,51,51,0.5)',
            boxShadow: '0 4px 24px rgba(6, 182, 212, 0.06)',
          }}
        >
          {/* Enhanced bottom gradient border */}
          <div
            className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.25), rgba(6, 182, 212, 0.4), rgba(6, 182, 212, 0.25), transparent)',
            }}
          />
          {/* Logo + Back Button */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#06B6D4',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.08)',
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#06B6D4]/20 border border-[#06B6D4]/30">
              <Brain className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-wide">P-MAS</span>
              <span className="text-[#B0B0B0] text-[10px] ml-2">Agent Hierarchy</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#B0B0B0]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search agents... (/)"
              className="w-52 pl-8 pr-8 py-1.5 rounded-lg text-xs text-white placeholder:text-[#555] outline-none transition-all focus:ring-1 focus:ring-[#06B6D4]/40"
              style={{
                background: 'rgba(45, 45, 45, 0.5)',
                border: '1px solid rgba(51,51,51,0.5)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#B0B0B0] hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {searchQuery && searchMatches.size > 0 && (
              <span className="absolute right-8 text-[9px] text-[#06B6D4] font-medium">
                {searchMatches.size}
              </span>
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: isActive
                      ? `rgba(${cfg.colorRgb}, 0.2)`
                      : 'rgba(45, 45, 45, 0.5)',
                    color: isActive ? cfg.color : '#B0B0B0',
                    border: `1px solid ${isActive ? `rgba(${cfg.colorRgb}, 0.4)` : 'rgba(51,51,51,0.5)'}`,
                    boxShadow: isActive ? `0 0 12px rgba(${cfg.colorRgb}, 0.1)` : 'none',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{group}</span>
                  <span
                    className="text-[10px] px-1 py-0.5 rounded-md"
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
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 transition-all hover:scale-110 ${viewMode === 'radial' ? 'text-white' : 'text-[#B0B0B0]'}`}
                onClick={() => setViewMode('radial')}
              >
                <Circle className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 transition-all hover:scale-110 ${viewMode === 'grid' ? 'text-white' : 'text-[#B0B0B0]'}`}
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
                  <span className="text-[#B0B0B0]">{count}</span>
                </div>
              ))}
              <span className="text-[#333333]">|</span>
              <span className="text-[#B0B0B0] font-semibold">{stats.total} agents</span>
            </div>

            {/* Separator */}
            <div className="hidden md:block w-px h-5" style={{ background: 'rgba(51,51,51,0.5)' }} />

            {/* Zoom controls with improved styling */}
            <div className="flex items-center gap-1">
              <AgentCreationDialog onCreated={fetchAgents} />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#B0B0B0] hover:text-white transition-all hover:scale-110"
                onClick={() => setZoom(z => Math.max(0.3, z * 0.85))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              {/* Zoom level indicator badge */}
              <span
                className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: '#06B6D4',
                  minWidth: '36px',
                  textAlign: 'center',
                }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#B0B0B0] hover:text-white transition-all hover:scale-110"
                onClick={() => setZoom(z => Math.min(3, z * 1.15))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              {/* Fit to Screen button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#B0B0B0] hover:text-white transition-all hover:scale-110"
                onClick={fitToScreen}
                title="Fit to screen (F)"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#B0B0B0] hover:text-white transition-all hover:scale-110"
                onClick={resetView}
                title="Reset view (0)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#B0B0B0] hover:text-white transition-all hover:scale-110"
                onClick={() => setShortcutsOpen(true)}
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb trail */}
      <BreadcrumbTrail
        activeFilter={activeFilter}
        onClearFilter={() => setActiveFilter(null)}
        zoom={zoom}
        onResetView={resetView}
      />

      {/* Mobile filter dropdown */}
      <div className="sm:hidden fixed top-16 left-4 z-40">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="text-[#B0B0B0] border-white/10 bg-[#1A1A1A]/80 backdrop-blur-md text-xs"
            onClick={() => setActiveFilter(activeFilter ? null : ROLE_ORDER[0])}
          >
            <Eye className="w-3 h-3 mr-1" />
            Filter
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          {activeFilter && (
            <div className="absolute top-9 left-0 flex flex-col gap-1 p-1.5 rounded-lg z-50"
              style={{ background: 'rgba(13, 13, 13, 0.95)', border: '1px solid rgba(51,51,51,0.5)' }}
            >
              {ROLE_ORDER.map(group => {
                const cfg = ROLE_CONFIG[group]
                return (
                  <button
                    key={group}
                    onClick={() => setActiveFilter(activeFilter === group ? null : group)}
                    className="text-xs px-3 py-1.5 rounded text-left whitespace-nowrap"
                    style={{
                      color: activeFilter === group ? cfg.color : '#B0B0B0',
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
          {/* Background grid - zoom-aware */}
          <BackgroundGrid width={dimensions.width} height={dimensions.height} zoom={zoom} />

          {/* ─── Cluster backgrounds with group boundary contours ─── */}
          {ROLE_ORDER.map((group, gi) => {
            const cfg = ROLE_CONFIG[group]
            const minDim = Math.min(dimensions.width, dimensions.height)
            const baseRadius = minDim * 0.14
            const ringSpacing = minDim * 0.14
            const radius = baseRadius + ringSpacing * gi
            const isHighlighted = hoveredGroup === group || activeFilter === group
            const isCollapsedGroup = collapsedGroups.has(group)

            // Compute group contour from actual node positions
            const groupAgents = visibleAgents.filter(a => a.roleGroup === group)
            const groupPositions = groupAgents.map(a => positions[a.id]).filter(Boolean)

            return (
              <g key={`cluster-${group}`}>
                {/* Filled cluster background */}
                <circle
                  cx={dimensions.width / 2}
                  cy={dimensions.height / 2}
                  r={radius}
                  fill={`rgba(${cfg.colorRgb}, ${isHighlighted ? 0.04 : 0.015})`}
                  stroke={cfg.color}
                  strokeWidth={isHighlighted ? 0.5 : 0.12}
                  strokeOpacity={isHighlighted ? 0.25 : 0.04}
                  strokeDasharray="4 8"
                />

                {/* ─── Group boundary contour line ─── */}
                {/* Draw a subtle dashed contour around the actual group nodes */}
                {groupPositions.length >= 2 && viewMode === 'radial' && !isCollapsedGroup && (
                  <ellipse
                    cx={groupCentroids[group]?.x || dimensions.width / 2}
                    cy={groupCentroids[group]?.y || dimensions.height / 2}
                    rx={radius * 0.35}
                    ry={radius * 0.3}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth={0.15}
                    strokeOpacity={isHighlighted ? 0.2 : 0.06}
                    strokeDasharray="6 6"
                  />
                )}

                {/* Active filter group: glow + pulse */}
                {activeFilter === group && (
                  <>
                    <circle
                      cx={dimensions.width / 2}
                      cy={dimensions.height / 2}
                      r={radius}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth={0.6}
                      strokeOpacity={0.12}
                      strokeDasharray="4 8"
                      filter="url(#orbGlow)"
                    >
                      <animate
                        attributeName="strokeOpacity"
                        values="0.08;0.18;0.08"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* Orbit dots along cluster ring */}
                {[0, 1, 2, 3].map(dotIdx => {
                  const dotAngleOffset = (2 * Math.PI * dotIdx) / 4
                  return (
                    <circle
                      key={`orbit-${group}-${dotIdx}`}
                      cx={dimensions.width / 2 + Math.cos(dotAngleOffset) * radius}
                      cy={dimensions.height / 2 + Math.sin(dotAngleOffset) * radius}
                      r={1.5}
                      fill={cfg.color}
                      opacity={isHighlighted ? 0.6 : 0.2}
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${dimensions.width / 2} ${dimensions.height / 2}`}
                        to={`${360 / (4 + dotIdx)} ${dimensions.width / 2} ${dimensions.height / 2}`}
                        dur={`${20 + dotIdx * 8}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values={isHighlighted ? '0.4;0.8;0.4' : '0.1;0.3;0.1'}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )
                })}

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
                      fill="rgba(26, 26, 26, 0.92)"
                      stroke={cfg.color}
                      strokeWidth={0.15}
                      strokeOpacity={0.1}
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
                stroke="#333333"
                strokeWidth={0.15}
                strokeOpacity={0.07}
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
            const isHighlightedConn = highlightedConnections.has(conn.id)
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
                isPulsing={pulsingConnections.has(conn.id) || isHighlightedConn}
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
                  taskCount={Array.isArray(agent.tasks) ? agent.tasks.length : 0}
                  statusTransition={statusTransitions[agent.id] || null}
                  onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                  onToggleCollapse={() => toggleCollapseNode(agent.id)}
                  onHover={setHoveredAgent}
                  onContextMenu={handleContextMenu}
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

      {/* Bottom-left panels: Combined Stats + Legend + Connection Filter */}
      <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <LegendPanel />
        <StatsDashboard stats={stats} />
        <ConnectionFilterPanel
          hiddenEdgeTypes={hiddenEdgeTypes}
          onToggleEdgeType={handleToggleEdgeType}
        />
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
          selectedAgentId={selectedAgent?.id || null}
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

      {/* Right-click context menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <NodeContextMenu
            contextMenu={contextMenu}
            agent={contextMenuAgent}
            onClose={() => setContextMenu({ visible: false, x: 0, y: 0, agentId: null })}
            onViewDetails={() => {
              if (contextMenuAgent) setSelectedAgent(contextMenuAgent)
            }}
            onHighlightConnections={() => {
              if (contextMenuAgent) {
                const connIds = new Set(
                  connections
                    .filter(c => c.from === contextMenuAgent.id || c.to === contextMenuAgent.id)
                    .map(c => c.id)
                )
                setHighlightedConnections(connIds)
                // Auto-clear after 5 seconds
                setTimeout(() => setHighlightedConnections(new Set()), 5000)
              }
            }}
            onToggleCollapse={() => {
              if (contextMenuAgent) toggleCollapseNode(contextMenuAgent.id)
            }}
            onFocusNode={() => {
              if (contextMenuAgent) focusOnNode(contextMenuAgent.id, positions)
            }}
          />
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(26, 26, 26, 0.92)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-[#06B6D4] border-t-transparent mx-auto mb-3"
            />
            <p className="text-[#B0B0B0] text-sm">Loading hierarchy...</p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
