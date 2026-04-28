'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { io as socketIO, Socket } from 'socket.io-client'
import { Brain, Target, Shield, Zap, Database, Activity, Network, Sparkles, ArrowRight, ArrowLeftRight, Diamond, Eye, Megaphone, Workflow, ChevronRight, ChevronDown, TrendingUp, TrendingDown, Cpu, HardDrive, Wifi, ArrowUp, Grid3X3, BarChart3, Clock, CheckCircle2, ListChecks, RotateCcw, BookOpen, Download, X, Bell, RefreshCw, Search, Menu, Pencil, Trash2, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithRetry } from '@/lib/client-fetch'

const AgentHierarchy = dynamic(
  () => import('@/components/hierarchy/agent-hierarchy-v2'),
  { ssr: false }
)

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'hierarchy'>('dashboard')

  if (activeView === 'hierarchy') {
    return <AgentHierarchy onBack={() => setActiveView('dashboard')} />
  }

  return <DashboardPanel onOpenHierarchy={() => setActiveView('hierarchy')} />
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLE_GROUPS = [
  { name: 'Стратегия', label: 'Strategy', color: '#67E8F9', colorRgb: '103,232,249', icon: Brain, agents: 3, activeAgents: 3, formulas: 'ToT, CoVe, GoT', desc: 'Strategic planning, analysis, vision', statusSummary: [{ color: '#22D3EE', label: '3 active' }] },
  { name: 'Тактика', label: 'Tactics', color: '#22D3EE', colorRgb: '34,211,238', icon: Target, agents: 3, activeAgents: 2, formulas: 'ReWOO, ReAct, SelfConsistency', desc: 'Coordination, planning, communication', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#64748B', label: '1 idle' }] },
  { name: 'Контроль', label: 'Control', color: '#06B6D4', colorRgb: '6,182,212', icon: Shield, agents: 3, activeAgents: 3, formulas: 'Reflexion, CoVe, ReAct', desc: 'Quality, evaluation, safety', statusSummary: [{ color: '#22D3EE', label: '3 active' }] },
  { name: 'Исполнение', label: 'Execution', color: '#06B6D4', colorRgb: '6,182,212', icon: Zap, agents: 5, activeAgents: 4, formulas: 'ReAct, MoA, SelfRefine, PoT', desc: 'Task execution, coding, testing', statusSummary: [{ color: '#22D3EE', label: '4 active' }, { color: '#64748B', label: '1 idle' }] },
  { name: 'Память', label: 'Memory / Knowledge', color: '#0891B2', colorRgb: '8,145,178', icon: Database, agents: 3, activeAgents: 2, formulas: 'CoT, AoT, SoT', desc: 'Knowledge base, RAG, context management', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#818CF8', label: '1 standby' }] },
  { name: 'Мониторинг', label: 'Monitoring', color: '#0E7490', colorRgb: '14,116,144', icon: Activity, agents: 3, activeAgents: 2, formulas: 'CoT, LATS, GoT', desc: 'Observation, alerting, diagnostics', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#EAB308', label: '1 paused' }] },
  { name: 'Коммуникация', label: 'Communication', color: '#155E75', colorRgb: '21,94,117', icon: Network, agents: 3, activeAgents: 2, formulas: 'PromptChaining, StepBack, PlanAndSolve', desc: 'Inter-agent messaging, routing, protocol translation', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#64748B', label: '1 idle' }] },
  { name: 'Обучение', label: 'Learning / Training', color: '#164E63', colorRgb: '22,78,99', icon: Sparkles, agents: 3, activeAgents: 2, formulas: 'DSPy, MetaCoT, LeastToMost', desc: 'Fine-tuning, feedback loops, skill acquisition', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#64748B', label: '1 idle' }] },
]

const FORMULA_TAXONOMY = [
  {
    category: 'Foundational',
    formulas: [
      { name: 'CoT', full: 'Chain of Thought', color: '#999999' },
      { name: 'ToT', full: 'Tree of Thoughts', color: '#999999' },
      { name: 'GoT', full: 'Graph of Thoughts', color: '#999999' },
      { name: 'AoT', full: 'Algorithm of Thoughts', color: '#999999' },
      { name: 'SoT', full: 'Skeleton of Thought', color: '#999999' },
    ],
  },
  {
    category: 'Verification',
    formulas: [
      { name: 'CoVe', full: 'Chain of Verification', color: '#888888' },
      { name: 'Reflexion', full: 'Self-Reflection', color: '#888888' },
      { name: 'SelfConsistency', full: 'Self-Consistency', color: '#888888' },
      { name: 'SelfRefine', full: 'Self-Refine', color: '#888888' },
    ],
  },
  {
    category: 'Planning',
    formulas: [
      { name: 'ReWOO', full: 'Research w/o Observation', color: '#777777' },
      { name: 'ReAct', full: 'Reasoning + Action', color: '#777777' },
      { name: 'PromptChaining', full: 'Prompt Chaining', color: '#777777' },
      { name: 'PlanAndSolve', full: 'Plan-and-Solve', color: '#777777' },
      { name: 'StepBack', full: 'Step-Back Prompting', color: '#777777' },
      { name: 'LeastToMost', full: 'Least-to-Most', color: '#777777' },
    ],
  },
  {
    category: 'Advanced',
    formulas: [
      { name: 'MoA', full: 'Mixture of Agents', color: '#666666' },
      { name: 'LATS', full: 'Lang Agent Tree Search', color: '#666666' },
      { name: 'PoT', full: 'Program of Thought', color: '#666666' },
      { name: 'DSPy', full: 'Declarative Self-Improving', color: '#666666' },
      { name: 'MetaCoT', full: 'Meta Chain of Thought', color: '#666666' },
    ],
  },
]

const EDGE_TYPES = [
  { name: 'Command', desc: 'Parent to child directive', color: '#06B6D4', style: 'solid', icon: ArrowRight },
  { name: 'Sync', desc: 'Peer synchronization', color: '#64748B', style: 'dotted', icon: ArrowLeftRight },
  { name: 'Twin', desc: 'Mirror agent link', color: '#22D3EE', style: 'dashed', icon: Diamond },
  { name: 'Delegate', desc: 'Task delegation', color: '#0891B2', style: 'dash-dot', icon: Workflow },
  { name: 'Supervise', desc: 'Oversight feedback', color: '#475569', style: 'fine dot', icon: Eye },
  { name: 'Broadcast', desc: 'One-to-many signal', color: '#0E7490', style: 'long dash', icon: Megaphone },
]

const QUICK_STATS = [
  { label: 'Total Agents', value: '26', numericValue: 26, color: '#06B6D4', colorRgb: '6,182,212' },
  { label: 'Role Groups', value: '8', numericValue: 8, color: '#0891B2', colorRgb: '8,145,178' },
  { label: 'Cognitive Formulas', value: '20', numericValue: 20, color: '#6B7280', colorRgb: '107,114,128' },
  { label: 'Edge Types', value: '6', numericValue: 6, color: '#475569', colorRgb: '71,85,105' },
  { label: 'Active Agents', value: '16', numericValue: 16, color: '#06B6D4', colorRgb: '6,182,212' },
  { label: 'Idle Agents', value: '4', numericValue: 4, color: '#6B7280', colorRgb: '107,114,128' },
  { label: 'Tasks', value: '26', numericValue: 26, color: '#22D3EE', colorRgb: '34,211,238' },
  { label: 'Formulas Coverage', value: '100%', numericValue: 100, color: '#0891B2', colorRgb: '8,145,178' },
]

// ─── Activity Timeline Data ────────────────────────────────────────────────────

const ACTIVITY_EVENTS = [
  { time: '2s ago', agent: 'Shlyuz', group: 'Коммуникация', desc: 'routed task to Ispolnitel-A' },
  { time: '5s ago', agent: 'Revizor', group: 'Контроль', desc: 'completed quality check on Module X' },
  { time: '12s ago', agent: 'Arkhitektor', group: 'Стратегия', desc: 'broadcast strategy update' },
  { time: '18s ago', agent: 'Trener', group: 'Обучение', desc: 'updated DSPy parameters' },
  { time: '25s ago', agent: 'Nablyudatel', group: 'Мониторинг', desc: 'detected memory threshold warning' },
  { time: '31s ago', agent: 'Koordinator', group: 'Тактика', desc: 'delegated 3 tasks to execution group' },
  { time: '45s ago', agent: 'RAG-Specialist', group: 'Память', desc: 'retrieved context for prompt #847' },
  { time: '52s ago', agent: 'Otladchik', group: 'Исполнение', desc: 'fixed 2 issues via SelfRefine' },
  { time: '1m ago', agent: 'Diagnost', group: 'Мониторинг', desc: 'traced latency root cause' },
  { time: '1m ago', agent: 'Alert-Operator', group: 'Мониторинг', desc: 'triggered escalation protocol' },
]

// ─── Formula-Agent Mapping Data ────────────────────────────────────────────────

const GROUP_ABBREVIATIONS = ['Стр', 'Ткт', 'Кнт', 'Исп', 'Пмт', 'Мнц', 'Кмн', 'Обч']
const GROUP_COLORS = ['#67E8F9', '#22D3EE', '#06B6D4', '#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63']

const FORMULA_AGENT_MAP: { formula: string; groups: number[] }[] = [
  { formula: 'CoT', groups: [4, 5] },
  { formula: 'ToT', groups: [0] },
  { formula: 'GoT', groups: [0, 5] },
  { formula: 'AoT', groups: [4] },
  { formula: 'SoT', groups: [4] },
  { formula: 'CoVe', groups: [0, 2] },
  { formula: 'ReWOO', groups: [1] },
  { formula: 'Reflexion', groups: [2] },
  { formula: 'ReAct', groups: [1, 2, 3] },
  { formula: 'MoA', groups: [3] },
  { formula: 'SelfRefine', groups: [3] },
  { formula: 'LATS', groups: [5] },
  { formula: 'SelfConsistency', groups: [1] },
  { formula: 'PoT', groups: [3] },
  { formula: 'DSPy', groups: [7] },
  { formula: 'PromptChaining', groups: [6] },
  { formula: 'LeastToMost', groups: [7] },
  { formula: 'StepBack', groups: [6] },
  { formula: 'PlanAndSolve', groups: [6] },
  { formula: 'MetaCoT', groups: [7] },
]

// ─── Connection Heatmap Data ────────────────────────────────────────────────────

const CONNECTION_HEATMAP_DATA: number[][] = [
  [  2,   3,   2,   1,   0,   2,   0,   0],
  [  0,   2,   1,   5,   0,   0,   0,   0],
  [  0,   0,   2,   3,   0,   0,   0,   0],
  [  0,   0,   0,   3,   0,   0,   0,   0],
  [  0,   0,   0,   1,   1,   2,   0,   0],
  [  0,   0,   0,   0,   0,   2,   0,   0],
  [  0,   1,   0,   2,   1,   0,   2,   0],
  [  0,   0,   0,   1,   2,   0,   0,   2],
]

// ─── Agent Performance Data ────────────────────────────────────────────────────

const TOP_PERFORMERS = [
  { name: 'Arkhitektor', group: 'Стратегия', score: 96 },
  { name: 'Koordinator', group: 'Тактика', score: 94 },
  { name: 'Revizor', group: 'Контроль', score: 91 },
  { name: 'Koder', group: 'Исполнение', score: 89 },
  { name: 'RAG-Specialist', group: 'Память', score: 87 },
  { name: 'Nablyudatel', group: 'Мониторинг', score: 85 },
  { name: 'Shlyuz', group: 'Коммуникация', score: 83 },
  { name: 'Trener', group: 'Обучение', score: 81 },
]

const SPARKLINE_DATA: Record<string, number[]> = {
  'Avg Response Time': [12, 10, 14, 8, 11, 9, 13, 7, 10, 8, 12, 9],
  'Success Rate': [90, 92, 91, 93, 94, 93, 95, 94, 94, 95, 94, 95],
  'Tasks Completed': [120, 135, 142, 150, 158, 165, 172, 180, 183, 185, 187, 187],
  'Active Workflows': [8, 9, 10, 11, 10, 12, 11, 13, 12, 11, 12, 12],
  'Error Recovery': [95, 96, 97, 96, 98, 97, 98, 99, 98, 98, 98, 98],
  'Knowledge Utilization': [68, 70, 72, 71, 73, 74, 75, 74, 76, 75, 76, 76],
}

const PERFORMANCE_METRICS = [
  { label: 'Avg Response Time', value: '1.2s', color: '#06B6D4', icon: Clock },
  { label: 'Success Rate', value: '94.7%', color: '#22D3EE', icon: CheckCircle2 },
  { label: 'Tasks Completed', value: '187', color: '#06B6D4', icon: ListChecks, trendUp: true },
  { label: 'Active Workflows', value: '12', color: '#06B6D4', icon: Workflow },
  { label: 'Error Recovery', value: '98.2%', color: '#22D3EE', icon: RotateCcw },
  { label: 'Knowledge Utilization', value: '76.3%', color: '#6B7280', icon: BookOpen },
]

const STATUS_DISTRIBUTION = [
  { label: 'Active', count: 16, color: '#22D3EE' },    // Bright Cyan - running, fully operational
  { label: 'Idle', count: 4, color: '#64748B' },        // Slate - waiting, available but not active
  { label: 'Paused', count: 1, color: '#EAB308' },      // Yellow/Amber - temporarily suspended
  { label: 'Standby', count: 1, color: '#818CF8' },     // Indigo/Lavender - ready to activate on demand
  { label: 'Error', count: 0, color: '#F43F5E' },       // Rose/Red - malfunction, needs attention
  { label: 'Offline', count: 4, color: '#3F3F46' },     // Zinc-700 - disconnected, not available
]

// ─── Network Activity Data ──────────────────────────────────────────────────

const NETWORK_ACTIVITY_DATA = [12, 18, 15, 22, 28, 35, 42, 38, 45, 52, 48, 55, 50, 47, 42, 38, 44, 50, 53, 48, 35, 28, 20, 15]

// ─── Agent List for Sidebar ──────────────────────────────────────────────────

const AGENT_LIST = [
  { name: 'Arkhitektor', group: 'Стратегия', status: 'active' as const, role: 'lead' as const },
  { name: 'Strateg', group: 'Стратегия', status: 'active' as const, role: 'active' as const },
  { name: 'Vizioner', group: 'Стратегия', status: 'active' as const, role: 'active' as const },
  { name: 'Koordinator', group: 'Тактика', status: 'active' as const, role: 'lead' as const },
  { name: 'Planirorshchik', group: 'Тактика', status: 'active' as const, role: 'active' as const },
  { name: 'Dispetcher', group: 'Тактика', status: 'idle' as const, role: 'idle' as const },
  { name: 'Revizor', group: 'Контроль', status: 'active' as const, role: 'lead' as const },
  { name: 'Tsenzor', group: 'Контроль', status: 'active' as const, role: 'active' as const },
  { name: 'Advokat', group: 'Контроль', status: 'active' as const, role: 'active' as const },
  { name: 'Ispolnitel-A', group: 'Исполнение', status: 'active' as const, role: 'lead' as const },
  { name: 'Koder', group: 'Исполнение', status: 'active' as const, role: 'active' as const },
  { name: 'Otladchik', group: 'Исполнение', status: 'active' as const, role: 'active' as const },
  { name: 'Testirovshchik', group: 'Исполнение', status: 'active' as const, role: 'active' as const },
  { name: 'Dokumentator', group: 'Исполнение', status: 'idle' as const, role: 'idle' as const },
  { name: 'Arkhivarius', group: 'Память', status: 'active' as const, role: 'lead' as const },
  { name: 'RAG-Specialist', group: 'Память', status: 'active' as const, role: 'active' as const },
  { name: 'Indekser', group: 'Память', status: 'standby' as const, role: 'standby' as const },
  { name: 'Nablyudatel', group: 'Мониторинг', status: 'active' as const, role: 'lead' as const },
  { name: 'Diagnost', group: 'Мониторинг', status: 'active' as const, role: 'active' as const },
  { name: 'Alert-Operator', group: 'Мониторинг', status: 'paused' as const, role: 'paused' as const },
  { name: 'Shlyuz', group: 'Коммуникация', status: 'active' as const, role: 'lead' as const },
  { name: 'Protokol', group: 'Коммуникация', status: 'active' as const, role: 'active' as const },
  { name: 'Perevodchik', group: 'Коммуникация', status: 'idle' as const, role: 'idle' as const },
  { name: 'Trener', group: 'Обучение', status: 'active' as const, role: 'lead' as const },
  { name: 'Kritik', group: 'Обучение', status: 'active' as const, role: 'active' as const },
  { name: 'Analitik', group: 'Обучение', status: 'idle' as const, role: 'idle' as const },
]

const STATUS_DOT_COLORS: Record<string, string> = {
  active: '#22D3EE',
  idle: '#64748B',
  paused: '#EAB308',
  standby: '#818CF8',
  offline: '#3F3F46',
}

const ROLE_GROUP_ICONS: Record<string, any> = {
  'Стратегия': Brain,
  'Тактика': Target,
  'Контроль': Shield,
  'Исполнение': Zap,
  'Память': Database,
  'Мониторинг': Activity,
  'Коммуникация': Network,
  'Обучение': Sparkles,
}

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, duration = 1200, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return <>{count}{suffix}</>
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({ data, color, width = 48, height = 16 }: { data: number[]; color: string; width?: number; height?: number }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padY = 2
  const plotH = height - padY * 2

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = padY + plotH - ((v - min) / range) * plotH
    return `${x},${y}`
  }).join(' ')

  const areaPath = `M0,${height} ` +
    data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = padY + plotH - ((v - min) / range) * plotH
      return `L${x},${y}`
    }).join(' ') +
    ` L${width},${height} Z`

  return (
    <svg width={width} height={height} className="flex-shrink-0" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#spark-grad-${color.replace('#', '')})`}
        style={{
          opacity: animated ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity={animated ? 0.7 : 0}
        style={{
          transition: 'opacity 0.5s ease',
        }}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function CollapsibleSection({ title, icon, count, accentColor, children, defaultOpen = true }: {
  title: string
  icon: React.ReactNode
  count?: number
  accentColor: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group"
      >
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: accentColor }} />
          {icon}
          {title}
          {count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: `${accentColor}15`, color: accentColor }}>
              {count}
            </span>
          )}
        </h2>
        <ChevronDown
          size={16}
          style={{ color: accentColor }}
          className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? '5000px' : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── System Health Monitor ─────────────────────────────────────────────────────

function SystemHealthMonitor() {
  const [cpuWidth, setCpuWidth] = useState(0)
  const [memWidth, setMemWidth] = useState(0)
  const [netWidth, setNetWidth] = useState(0)

  useEffect(() => {
    const timer1 = setTimeout(() => setCpuWidth(34), 100)
    const timer2 = setTimeout(() => setMemWidth(67), 200)
    const timer3 = setTimeout(() => setNetWidth(23), 300)
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3) }
  }, [])

  const metrics = [
    { label: 'CPU Usage', value: 34, color: '#06B6D4', width: cpuWidth, icon: Cpu },
    { label: 'Memory Usage', value: 67, color: '#0891B2', width: memWidth, icon: HardDrive },
    { label: 'Network I/O', value: 23, color: '#0E7490', width: netWidth, icon: Wifi },
  ]

  return (
    <div
      className="rounded-xl p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(103,232,249,0.04), rgba(6,182,212,0.03), rgba(14,116,144,0.03))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />

      <div className="relative z-10">
        <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
          System Health Monitor
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {metrics.map((m) => {
            const MetricIcon = m.icon
            return (
              <div key={m.label} className="rounded-lg p-3 transition-colors duration-200 hover:bg-white/[0.02]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MetricIcon size={12} style={{ color: m.color }} />
                    <span className="text-slate-400 text-[10px]">{m.label}</span>
                  </div>
                  <span className="font-bold text-xs" style={{ color: m.color }}>{m.value}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${m.width}%`, background: `linear-gradient(90deg, ${m.color}88, ${m.color})` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s ease infinite',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/[0.03]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-slate-400 text-[10px]">Agent Uptime</span>
            <span className="text-cyan-400 font-bold text-xs" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.4)', animation: 'pulseGlow 2s ease-in-out infinite' }}>99.7%</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/[0.03]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
            <Activity className="w-3 h-3" style={{ color: '#06B6D4' }} />
            <span className="text-slate-400 text-[10px]">Active Connections</span>
            <span className="font-bold text-xs" style={{ color: '#06B6D4' }}>55</span>
            <svg width="32" height="12" className="ml-1">
              <polyline
                points="0,8 4,6 8,9 12,4 16,7 20,3 24,5 28,2 32,6"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="1"
                opacity="0.6"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/[0.03]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
            <TrendingDown className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400 text-[10px]">Error Rate</span>
            <span className="text-cyan-400 font-bold text-xs">0.3%</span>
            <TrendingDown className="w-2.5 h-2.5 text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Recent Activity Timeline ──────────────────────────────────────────────────

function RecentActivityTimeline({ events }: { events?: typeof ACTIVITY_EVENTS }) {
  const displayEvents = events || ACTIVITY_EVENTS
  return (
    <div
      className="rounded-xl p-4 sm:p-6 flex flex-col"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
        minHeight: '380px',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        Recent Activity
      </h3>
      <div
        className="flex-1 overflow-y-auto space-y-0 activity-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          maxHeight: '400px',
        }}
      >
        {displayEvents.map((event, i) => {
          const groupConfig = ROLE_GROUPS.find(g => g.name === event.group)
          const dotColor = groupConfig?.color || '#94a3b8'
          return (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/[0.03] last:border-b-0 rounded-lg px-2 transition-colors duration-150 hover:bg-white/[0.02]">
              <div className="flex flex-col items-center mt-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}44` }} />
                {i < displayEvents.length - 1 && (
                  <span className="w-px flex-1 mt-1" style={{ background: `linear-gradient(to bottom, ${dotColor}, transparent)`, minHeight: '20px', opacity: 0.4 }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{event.time}</span>
                  <span className="text-[10px] font-bold" style={{ color: dotColor }}>{event.agent}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${dotColor}15`, color: dotColor }}>{event.group}</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">{event.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Formula-to-Agent Mapping Grid ─────────────────────────────────────────────

function FormulaAgentMappingGrid() {
  return (
    <div
      className="rounded-xl p-4 sm:p-6 overflow-x-auto"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Network className="w-3.5 h-3.5 text-gray-400" />
        Formula-to-Agent Mapping
      </h3>
      <div className="min-w-[480px]">
        <div className="grid gap-0" style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}>
          <div />
          {GROUP_ABBREVIATIONS.map((abbr, i) => (
            <div key={abbr} className="text-center py-1.5">
              <span className="text-[8px] font-bold" style={{ color: GROUP_COLORS[i] }}>{abbr}</span>
            </div>
          ))}
        </div>
        {FORMULA_AGENT_MAP.map((row) => {
          const formulaInfo = FORMULA_TAXONOMY.flatMap(c => c.formulas).find(f => f.name === row.formula)
          const formulaColor = formulaInfo?.color || '#94a3b8'
          return (
            <div
              key={row.formula}
              className="grid gap-0 border-b border-white/[0.03]"
              style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}
            >
              <div className="flex items-center py-1.5 pr-2">
                <span className="text-[9px] font-bold truncate" style={{ color: formulaColor }}>{row.formula}</span>
              </div>
              {Array.from({ length: 8 }, (_, colIdx) => {
                const isMapped = row.groups.includes(colIdx)
                return (
                  <div key={colIdx} className="flex items-center justify-center py-1.5">
                    {isMapped && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: GROUP_COLORS[colIdx],
                          boxShadow: `0 0 6px ${GROUP_COLORS[colIdx]}44`,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {GROUP_ABBREVIATIONS.map((abbr, i) => (
          <div key={abbr} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GROUP_COLORS[i] }} />
            <span className="text-[8px] text-slate-500">{abbr} = {ROLE_GROUPS[i].name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Formula Flow Diagram ──────────────────────────────────────────────────────

function FormulaFlowDiagram() {
  const nodes = [
    { id: 'CoT', x: 60, y: 30, color: '#999999' },
    { id: 'ToT', x: 170, y: 30, color: '#999999' },
    { id: 'GoT', x: 280, y: 30, color: '#999999' },
    { id: 'MetaCoT', x: 60, y: 90, color: '#666666' },
    { id: 'AoT', x: 280, y: 90, color: '#999999' },
    { id: 'SoT', x: 390, y: 90, color: '#999999' },
    { id: 'CoVe', x: 60, y: 150, color: '#888888' },
    { id: 'Reflexion', x: 170, y: 150, color: '#888888' },
    { id: 'SelfConsistency', x: 280, y: 150, color: '#888888' },
    { id: 'SelfRefine', x: 390, y: 150, color: '#888888' },
    { id: 'ReAct', x: 60, y: 210, color: '#777777' },
    { id: 'ReWOO', x: 170, y: 210, color: '#777777' },
    { id: 'PromptChaining', x: 280, y: 210, color: '#777777' },
    { id: 'PlanAndSolve', x: 390, y: 210, color: '#777777' },
    { id: 'PoT', x: 60, y: 270, color: '#666666' },
    { id: 'StepBack', x: 170, y: 270, color: '#777777' },
    { id: 'LeastToMost', x: 280, y: 270, color: '#777777' },
    { id: 'DSPy', x: 60, y: 330, color: '#666666' },
    { id: 'MoA', x: 170, y: 330, color: '#666666' },
    { id: 'LATS', x: 280, y: 330, color: '#666666' },
  ]

  const edges = [
    { from: 'CoT', to: 'ToT' },
    { from: 'ToT', to: 'GoT' },
    { from: 'CoT', to: 'MetaCoT' },
    { from: 'GoT', to: 'AoT' },
    { from: 'AoT', to: 'SoT' },
    { from: 'MetaCoT', to: 'CoVe' },
    { from: 'CoVe', to: 'Reflexion' },
    { from: 'Reflexion', to: 'SelfConsistency' },
    { from: 'SelfConsistency', to: 'SelfRefine' },
    { from: 'Reflexion', to: 'ReAct' },
    { from: 'ReAct', to: 'ReWOO' },
    { from: 'ReWOO', to: 'PromptChaining' },
    { from: 'PromptChaining', to: 'PlanAndSolve' },
    { from: 'ReAct', to: 'PoT' },
    { from: 'ReWOO', to: 'StepBack' },
    { from: 'PromptChaining', to: 'LeastToMost' },
    { from: 'PoT', to: 'DSPy' },
    { from: 'DSPy', to: 'MoA' },
    { from: 'MoA', to: 'LATS' },
  ]

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  const nodeRadius = 14

  return (
    <div
      className="rounded-xl p-4 sm:p-6 overflow-x-auto"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Workflow className="w-3.5 h-3.5 text-cyan-400" />
        Formula Flow Diagram
      </h3>
      <svg
        viewBox="0 0 440 370"
        className="w-full max-w-2xl mx-auto"
        style={{ minHeight: '280px' }}
      >
        {edges.map((edge, i) => {
          const from = nodeMap[edge.from]
          const to = nodeMap[edge.to]
          if (!from || !to) return null
          const dx = to.x - from.x
          const dy = to.y - from.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const startX = from.x + (dx / dist) * nodeRadius
          const startY = from.y + (dy / dist) * nodeRadius
          const endX = to.x - (dx / dist) * nodeRadius
          const endY = to.y - (dy / dist) * nodeRadius

          const arrowLen = 5
          const angle = Math.atan2(dy, dx)
          const ax1 = endX - arrowLen * Math.cos(angle - Math.PI / 6)
          const ay1 = endY - arrowLen * Math.sin(angle - Math.PI / 6)
          const ax2 = endX - arrowLen * Math.cos(angle + Math.PI / 6)
          const ay2 = endY - arrowLen * Math.sin(angle + Math.PI / 6)

          return (
            <g key={i}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="rgba(6, 182, 212, 0.15)"
                strokeWidth="1.5"
              />
              <polygon
                points={`${endX},${endY} ${ax1},${ay1} ${ax2},${ay2}`}
                fill="rgba(6, 182, 212, 0.3)"
              />
            </g>
          )
        })}

        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 3}
              fill={`${node.color}10`}
              stroke={node.color}
              strokeWidth="0.3"
              strokeOpacity="0.2"
            />
            {node.id === 'CoT' && (
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 6}
                fill="none"
                stroke={node.color}
                strokeWidth="0.5"
                strokeOpacity="0.15"
              >
                <animate attributeName="r" from={`${nodeRadius + 6}`} to={`${nodeRadius + 14}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="strokeOpacity" from="0.15" to="0" dur="2s" repeatCount="indefinite" />
                <animate attributeName="strokeWidth" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={`${node.color}18`}
              stroke={node.color}
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={node.color}
              fontSize="6"
              fontWeight="700"
              style={{ pointerEvents: 'none' }}
            >
              {node.id.length > 6 ? node.id.substring(0, 6) : node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Connection Heatmap ────────────────────────────────────────────────────────

function ConnectionHeatmap({ data }: { data?: number[][] }) {
  const heatmapData = data || CONNECTION_HEATMAP_DATA
  const getDotSize = (count: number): number => {
    if (count === 0) return 0
    if (count <= 2) return 6
    if (count <= 5) return 10
    return 14
  }

  const getDotOpacity = (count: number): number => {
    if (count === 0) return 0
    if (count <= 2) return 0.5
    if (count <= 5) return 0.7
    return 0.9
  }

  return (
    <div
      className="rounded-xl p-4 sm:p-6 overflow-x-auto"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Grid3X3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
        Connection Heatmap
      </h3>
      <div className="min-w-[520px]">
        <div className="grid gap-0" style={{ gridTemplateColumns: '64px repeat(8, 1fr)' }}>
          <div />
          {GROUP_ABBREVIATIONS.map((abbr, i) => (
            <div key={abbr} className="text-center py-2">
              <span className="text-[8px] font-bold" style={{ color: GROUP_COLORS[i] }}>{abbr}</span>
            </div>
          ))}
        </div>
        {heatmapData.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-0 border-b border-white/[0.03]"
            style={{ gridTemplateColumns: '64px repeat(8, 1fr)' }}
          >
            <div className="flex items-center pr-2 py-2">
              <span className="text-[8px] font-bold truncate" style={{ color: GROUP_COLORS[rowIdx] }}>
                {GROUP_ABBREVIATIONS[rowIdx]}
              </span>
            </div>
            {row.map((count, colIdx) => {
              const isDiagonal = rowIdx === colIdx
              const dotSize = getDotSize(count)
              const dotOpacity = getDotOpacity(count)
              const cellColor = GROUP_COLORS[colIdx]

              return (
                <div key={colIdx} className="flex items-center justify-center py-2">
                  {count > 0 && (
                    <div className="relative flex items-center justify-center">
                      {isDiagonal ? (
                        <svg width={dotSize + 4} height={dotSize + 4} viewBox={`0 0 ${dotSize + 4} ${dotSize + 4}`}>
                          <rect
                            x={(dotSize + 4) / 2 - dotSize / 2}
                            y={(dotSize + 4) / 2 - dotSize / 2}
                            width={dotSize}
                            height={dotSize}
                            rx={1}
                            fill={cellColor}
                            fillOpacity={dotOpacity}
                            stroke={cellColor}
                            strokeWidth={0.5}
                            strokeOpacity={0.6}
                            transform={`rotate(45 ${(dotSize + 4) / 2} ${(dotSize + 4) / 2})`}
                          />
                        </svg>
                      ) : (
                        <span
                          className="rounded-full"
                          style={{
                            width: dotSize,
                            height: dotSize,
                            background: cellColor,
                            opacity: dotOpacity,
                            boxShadow: `0 0 ${dotSize}px ${cellColor}44`,
                          }}
                        />
                      )}
                      {count > 2 && (
                        <span
                          className="absolute text-[6px] font-bold"
                          style={{ color: '#FFFFFF' }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-slate-500">Connection density:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full" style={{ width: 6, height: 6, background: '#06B6D4', opacity: 0.5 }} />
          <span className="text-[8px] text-slate-500">1-2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full" style={{ width: 10, height: 10, background: '#06B6D4', opacity: 0.7 }} />
          <span className="text-[8px] text-slate-500">3-5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full" style={{ width: 14, height: 14, background: '#06B6D4', opacity: 0.9 }} />
          <span className="text-[8px] text-slate-500">6+</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="2" y="2" width="6" height="6" rx="1" fill="#06B6D4" fillOpacity="0.7" stroke="#06B6D4" strokeWidth="0.5" strokeOpacity="0.6" transform="rotate(45 5 5)" />
          </svg>
          <span className="text-[8px] text-slate-500">Internal sync</span>
        </div>
      </div>
    </div>
  )
}

// ─── Agent Performance ────────────────────────────────────────────────────────

function AgentPerformance({ topPerformers: topPerformersProp, statusDistribution: statusDistributionProp }: { topPerformersProp?: typeof TOP_PERFORMERS; statusDistributionProp?: typeof STATUS_DISTRIBUTION }) {
  const topPerformers = topPerformersProp || TOP_PERFORMERS
  const statusDistribution = statusDistributionProp || STATUS_DISTRIBUTION
  const [barWidths, setBarWidths] = useState<number[]>(topPerformers.map(() => 0))

  useEffect(() => {
    const timers = topPerformers.map((_, i) =>
      setTimeout(() => {
        setBarWidths(prev => {
          const next = [...prev]
          next[i] = topPerformers[i].score
          return next
        })
      }, 100 + i * 80)
    )
    return () => timers.forEach(clearTimeout)
  }, [topPerformers])

  const getGroupColor = (groupName: string): string => {
    const group = ROLE_GROUPS.find(g => g.name === groupName)
    return group?.color || '#94a3b8'
  }

  const donutRadius = 50
  const donutStroke = 10
  const donutCircumference = 2 * Math.PI * donutRadius
  const totalAgents = statusDistribution.reduce((sum, s) => sum + s.count, 0)

  const donutSegments = statusDistribution.filter(s => s.count > 0).reduce<Array<{
    label: string; count: number; color: string; segmentLength: number; offset: number
  }>>((acc, status, _i, arr) => {
    const segmentLength = (status.count / totalAgents) * donutCircumference
    const offset = acc.length > 0
      ? acc[acc.length - 1].offset + acc[acc.length - 1].segmentLength
      : 0
    acc.push({ ...status, segmentLength, offset })
    return acc
  }, [])

  return (
    <div
      className="rounded-xl p-4 sm:p-6"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-5 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
        <BarChart3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
        Agent Performance
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <p className="text-[10px] text-[#B0B0B0] mb-3 font-medium uppercase tracking-wider">Top Performers</p>
          <div className="space-y-2.5">
            {topPerformers.map((agent, i) => {
              const barColor = getGroupColor(agent.group)
              const width = barWidths[i]
              return (
                <div key={agent.name} className="flex items-center gap-3 group">
                  <span
                    className="text-[10px] font-medium w-24 sm:w-28 truncate text-right flex-shrink-0 transition-colors duration-200"
                    style={{ color: barColor }}
                  >
                    {agent.name}
                  </span>
                  <div className="flex-1 h-5 rounded-sm relative overflow-hidden transition-all duration-200 group-hover:h-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div
                      className="h-full rounded-sm transition-all duration-700 ease-out"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${barColor}44, ${barColor}aa)`,
                        boxShadow: `0 0 8px ${barColor}22`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right flex-shrink-0" style={{ color: barColor }}>
                    {width > 0 ? agent.score : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[10px] text-[#B0B0B0] mb-3 font-medium uppercase tracking-wider">Status Distribution</p>
          <div className="relative">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={donutRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={donutStroke} />
              {donutSegments.map((segment, i) => (
                <circle
                  key={i}
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={donutStroke}
                  strokeDasharray={`${segment.segmentLength} ${donutCircumference - segment.segmentLength}`}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="butt"
                  transform="rotate(-90 70 70)"
                  style={{ opacity: 0.8 }}
                />
              ))}
              <text x="70" y="65" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="18" fontWeight="700">{totalAgents}</text>
              <text x="70" y="80" textAnchor="middle" dominantBaseline="middle" fill="#B0B0B0" fontSize="7">agents</text>
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 w-full">
            {statusDistribution.map((status) => (
              <div key={status.label} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: status.color,
                    opacity: status.count > 0 ? 1 : 0.3,
                  }}
                />
                <span className="text-[9px] text-[#B0B0B0] truncate">{status.label}</span>
                <span className="text-[9px] font-bold" style={{ color: status.count > 0 ? status.color : '#555' }}>
                  {status.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid with sparklines */}
      <div className="mt-5">
        <p className="text-[10px] text-[#B0B0B0] mb-3 font-medium uppercase tracking-wider">Performance Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PERFORMANCE_METRICS.map((metric) => {
            const MetricIcon = metric.icon
            const sparkData = SPARKLINE_DATA[metric.label]
            return (
              <div
                key={metric.label}
                className="rounded-lg p-3 relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: `1px solid rgba(51, 51, 51, 0.4)`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${metric.color}44`; e.currentTarget.style.boxShadow = `0 0 12px ${metric.color}15` }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(51, 51, 51, 0.4)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-l-lg"
                  style={{ width: 2, background: metric.color, opacity: 0.6 }}
                />
                <div className="flex items-center gap-2 ml-2 mb-1.5">
                  <MetricIcon size={11} style={{ color: metric.color }} />
                  <span className="text-[9px] text-[#B0B0B0] leading-tight">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-bold" style={{ color: metric.color }}>{metric.value}</span>
                  {sparkData && (
                    <MiniSparkline data={sparkData} color={metric.color} />
                  )}
                  {metric.trendUp && (
                    <TrendingUp size={12} style={{ color: metric.color }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Network Activity Chart ───────────────────────────────────────────────────

function NetworkActivityChart({ data: activityData }: { data?: number[] }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  const data = activityData || NETWORK_ACTIVITY_DATA
  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  const chartW = 500
  const chartH = 140
  const padX = 35
  const padY = 15
  const plotW = chartW - padX - 10
  const plotH = chartH - padY * 2

  const toX = (i: number) => padX + (i / (data.length - 1)) * plotW
  const toY = (v: number) => padY + plotH - ((v - minVal) / range) * plotH

  const linePoints = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaPath = `M${toX(0)},${chartH - padY} ` +
    data.map((v, i) => `L${toX(i)},${toY(v)}`).join(' ') +
    ` L${toX(data.length - 1)},${chartH - padY} Z`

  const indexed = data.map((v, i) => ({ v, i }))
  const peaks = indexed.sort((a, b) => b.v - a.v).slice(0, 3)

  const gridLevels = [0, 0.25, 0.5, 0.75, 1]
  const xLabels = [0, 4, 8, 12, 16, 20, 23]

  return (
    <div
      className="rounded-xl p-4 sm:p-6"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
        Network Activity
      </h3>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full"
        style={{ minHeight: '110px' }}
      >
        <defs>
          <linearGradient id="areaGradientAnimated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(6,182,212,0.25)">
              <animate attributeName="stop-color" values="rgba(6,182,212,0.25);rgba(6,182,212,0.15);rgba(6,182,212,0.25)" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgba(6,182,212,0.02)" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLevels.map((level, i) => {
          const y = padY + plotH * (1 - level)
          return (
            <g key={i}>
              <line
                x1={padX}
                y1={y}
                x2={chartW - 10}
                y2={y}
                stroke="#333333"
                strokeWidth="0.5"
                strokeOpacity="0.3"
                strokeDasharray={level === 0 || level === 1 ? 'none' : '2,3'}
              />
              {/* Y-axis labels */}
              <text
                x={padX - 4}
                y={y + 2}
                textAnchor="end"
                fill="#B0B0B0"
                fontSize="6"
                opacity="0.5"
              >
                {Math.round(minVal + level * range)}
              </text>
            </g>
          )
        })}

        {/* Animated area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradientAnimated)"
          style={{
            opacity: animated ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Line stroke */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
          style={{
            strokeDasharray: animated ? 'none' : '1000',
            strokeDashoffset: animated ? '0' : '1000',
            transition: 'stroke-dashoffset 1.5s ease',
          }}
        />

        {/* X-axis labels */}
        {xLabels.map((hour) => (
          <text
            key={hour}
            x={toX(hour)}
            y={chartH - 2}
            textAnchor="middle"
            fill="#B0B0B0"
            fontSize="6"
            opacity="0.5"
          >
            {hour}h
          </text>
        ))}

        {/* Peak dots with pulse */}
        {peaks.map((peak, i) => (
          <g key={i}>
            <circle cx={toX(peak.i)} cy={toY(peak.v)} r="4" fill="none" stroke="#06B6D4" strokeWidth="0.5" strokeOpacity="0.4">
              <animate attributeName="r" from="4" to="10" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="strokeOpacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={toX(peak.i)} cy={toY(peak.v)} r="2.5" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.5">
              <title>{`${peak.i}h: ${peak.v} activities`}</title>
            </circle>
          </g>
        ))}

        {/* Tooltip areas */}
        {data.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="8" fill="transparent" stroke="none">
            <title>{`${i}h: ${v} activities`}</title>
          </circle>
        ))}
      </svg>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-4 mt-3">
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors duration-200 hover:bg-white/[0.03]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
          <TrendingUp size={11} style={{ color: '#06B6D4' }} />
          <span className="text-[9px] text-[#B0B0B0]">Peak</span>
          <span className="text-[10px] font-bold" style={{ color: '#06B6D4' }}>55 at 11h</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors duration-200 hover:bg-white/[0.03]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
          <BarChart3 size={11} style={{ color: '#06B6D4' }} />
          <span className="text-[9px] text-[#B0B0B0]">Average</span>
          <span className="text-[10px] font-bold" style={{ color: '#06B6D4' }}>36.5</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors duration-200 hover:bg-white/[0.03]" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
          <Activity size={11} style={{ color: '#06B6D4' }} />
          <span className="text-[9px] text-[#B0B0B0]">Current</span>
          <span className="text-[10px] font-bold" style={{ color: '#06B6D4' }}>15</span>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Actions Panel ──────────────────────────────────────────────────────

function QuickActionsPanel() {
  const [reseeding, setReseeding] = useState(false)

  const handleReseed = async () => {
    setReseeding(true)
    try {
      const res = await fetchWithRetry('/api/seed', { method: 'POST' })
      if (res.ok) {
        toast.success('Database reseeded successfully')
      } else {
        toast.error('Failed to reseed database')
      }
    } catch {
      toast.error('Failed to reseed database')
    } finally {
      setReseeding(false)
    }
  }

  const handleExportConfig = async () => {
    try {
      const res = await fetchWithRetry('/api/hierarchy')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'p-mas-hierarchy.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Config exported successfully')
    } catch {
      toast.error('Failed to export config')
    }
  }

  const handleResetView = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleTheme = () => {
    toast.info('Theme toggle coming soon')
  }

  const actions = [
    { label: 'Reseed Data', icon: Database, onClick: handleReseed, loading: reseeding },
    { label: 'Export Config', icon: Download, onClick: handleExportConfig },
    { label: 'Reset View', icon: ArrowUp, onClick: handleResetView },
    { label: 'Toggle Theme', icon: Activity, onClick: handleToggleTheme },
  ]

  return (
    <div
      className="rounded-xl p-4 sm:p-6"
      style={{
        background: 'rgba(26,26,26,0.92)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
        Quick Actions
      </h3>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => {
          const ActionIcon = action.icon
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(45, 45, 45, 0.5)',
                border: '1px solid rgba(51, 51, 51, 0.5)',
                color: '#06B6D4',
              }}
              onMouseEnter={(e) => {
                if (!action.loading) {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(51, 51, 51, 0.5)'
              }}
            >
              <ActionIcon size={14} />
              <span>{action.loading ? 'Seeding...' : action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Architecture Overview Diagram ────────────────────────────────────────────

function ArchitectureDiagram() {
  const groups = [
    { name: 'Стратегия', x: 200, y: 30, color: '#67E8F9' },
    { name: 'Тактика', x: 400, y: 30, color: '#22D3EE' },
    { name: 'Исполнение', x: 600, y: 30, color: '#06B6D4' },
    { name: 'Контроль', x: 200, y: 110, color: '#06B6D4' },
    { name: 'Мониторинг', x: 600, y: 110, color: '#0E7490' },
    { name: 'Память', x: 200, y: 190, color: '#0891B2' },
    { name: 'Коммуникация', x: 400, y: 190, color: '#155E75' },
    { name: 'Обучение', x: 600, y: 190, color: '#164E63' },
  ]

  const connections = [
    { from: 0, to: 1, label: 'delegate', color: '#0891B2' },
    { from: 1, to: 2, label: 'command', color: '#06B6D4' },
    { from: 3, to: 2, label: 'supervise', color: '#475569' },
    { from: 4, to: 2, label: 'supervise', color: '#475569' },
    { from: 5, to: 6, label: 'sync', color: '#64748B' },
    { from: 6, to: 2, label: 'delegate', color: '#0891B2' },
    { from: 7, to: 2, label: 'delegate', color: '#0891B2' },
    { from: 7, to: 5, label: 'sync', color: '#64748B' },
    { from: 0, to: 4, label: 'broadcast', color: '#0E7490' },
  ]

  const boxW = 140
  const boxH = 36

  return (
    <div
      className="rounded-xl p-4 sm:p-6 overflow-x-auto"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Network className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
        Architecture Overview
      </h3>
      <svg viewBox="0 0 800 250" className="w-full" style={{ minHeight: '200px' }}>
        {/* Connections */}
        {connections.map((conn, i) => {
          const from = groups[conn.from]
          const to = groups[conn.to]
          const fx = from.x + boxW / 2
          const fy = from.y + boxH / 2
          const tx = to.x + boxW / 2
          const ty = to.y + boxH / 2
          const mx = (fx + tx) / 2
          const my = (fy + ty) / 2
          return (
            <g key={i}>
              <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={conn.color} strokeWidth="1" strokeOpacity="0.4" strokeDasharray={conn.label === 'sync' ? '4 3' : conn.label === 'broadcast' ? '8 3 2 3' : 'none'} />
              <text x={mx} y={my - 4} textAnchor="middle" fill={conn.color} fontSize="7" fontWeight="600" style={{ pointerEvents: 'none' }}>{conn.label}</text>
            </g>
          )
        })}
        {/* Group boxes */}
        {groups.map((g, i) => (
          <g key={i}>
            <rect
              x={g.x}
              y={g.y}
              width={boxW}
              height={boxH}
              rx={6}
              fill={`${g.color}12`}
              stroke={g.color}
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
            <text
              x={g.x + boxW / 2}
              y={g.y + boxH / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={g.color}
              fontSize="10"
              fontWeight="600"
              style={{ pointerEvents: 'none' }}
            >
              {g.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Status Distribution Card ─────────────────────────────────────────────────

function StatusDistributionCard({ statusDistribution }: { statusDistribution?: typeof STATUS_DISTRIBUTION }) {
  const distributionData = statusDistribution || STATUS_DISTRIBUTION
  const donutRadius = 50
  const donutStroke = 12
  const donutCircumference = 2 * Math.PI * donutRadius
  const totalAgents = distributionData.reduce((sum, s) => sum + s.count, 0)

  const donutSegments = distributionData.filter(s => s.count > 0).reduce<Array<{
    label: string; count: number; color: string; segmentLength: number; offset: number
  }>>((acc, status) => {
    const segmentLength = (status.count / totalAgents) * donutCircumference
    const offset = acc.length > 0
      ? acc[acc.length - 1].offset + acc[acc.length - 1].segmentLength
      : 0
    acc.push({ ...status, segmentLength, offset })
    return acc
  }, [])

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: 'rgba(26,26,26,0.6)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: '#06B6D4', opacity: 0.5 }} />
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-1.5">
        <BarChart3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
        Status Distribution
      </h3>
      <div className="flex items-center justify-center h-[160px]">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={donutRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={donutStroke} />
          {donutSegments.map((segment, i) => (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={donutRadius}
              fill="none"
              stroke={segment.color}
              strokeWidth={donutStroke}
              strokeDasharray={`${segment.segmentLength} ${donutCircumference - segment.segmentLength}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
              transform="rotate(-90 80 80)"
              style={{ opacity: 0.8 }}
            />
          ))}
          <text x="80" y="75" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="22" fontWeight="700">{totalAgents}</text>
          <text x="80" y="90" textAnchor="middle" dominantBaseline="middle" fill="#B0B0B0" fontSize="8">agents</text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
        {distributionData.map((status) => (
          <div key={status.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status.color, opacity: status.count > 0 ? 1 : 0.3 }} />
            <span className="text-[9px] text-[#B0B0B0]">{status.label}</span>
            <span className="text-[9px] font-bold" style={{ color: status.count > 0 ? status.color : '#555' }}>{status.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top Performers Card ─────────────────────────────────────────────────────

function TopPerformersCard({ topPerformers: topPerformersProp, roleGroups: roleGroupsProp }: { topPerformersProp?: typeof TOP_PERFORMERS; roleGroupsProp?: typeof ROLE_GROUPS }) {
  const topPerformers = topPerformersProp || TOP_PERFORMERS
  const roleGroupsData = roleGroupsProp || ROLE_GROUPS
  const [barWidths, setBarWidths] = useState<number[]>(topPerformers.map(() => 0))
  useEffect(() => {
    const timers = topPerformers.map((_, i) =>
      setTimeout(() => {
        setBarWidths(prev => {
          const next = [...prev]
          next[i] = topPerformers[i].score
          return next
        })
      }, 100 + i * 80)
    )
    return () => timers.forEach(clearTimeout)
  }, [topPerformers])

  const getGroupColor = (groupName: string): string => {
    const group = roleGroupsData.find(g => g.name === groupName)
    return group?.color || '#94a3b8'
  }

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: 'rgba(26,26,26,0.6)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: '#0891B2', opacity: 0.5 }} />
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-1.5">
        <BarChart3 className="w-3.5 h-3.5" style={{ color: '#0891B2' }} />
        Top Performers
      </h3>
      <div className="flex flex-col gap-2">
        {topPerformers.map((agent, i) => {
          const barColor = getGroupColor(agent.group)
          const width = barWidths[i]
          return (
            <div key={agent.name} className="flex items-center gap-2">
              <span className="text-[10px] font-medium w-[80px] truncate text-right flex-shrink-0" style={{ color: barColor }}>{agent.name}</span>
              <div className="flex-1 h-[6px] rounded-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{ width: `${width}%`, background: `linear-gradient(90deg, ${barColor}44, ${barColor}aa)` }}
                />
              </div>
              <span className="text-[9px] font-bold w-7 text-right flex-shrink-0" style={{ color: barColor }}>{width > 0 ? agent.score : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── System Health Card ──────────────────────────────────────────────────────

function SystemHealthCard() {
  const [cpuWidth, setCpuWidth] = useState(0)
  const [memWidth, setMemWidth] = useState(0)
  const [netWidth, setNetWidth] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setCpuWidth(34), 100)
    const t2 = setTimeout(() => setMemWidth(67), 200)
    const t3 = setTimeout(() => setNetWidth(23), 300)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const bars = [
    { label: 'CPU Usage', value: 34, color: '#06B6D4', width: cpuWidth },
    { label: 'Memory', value: 67, color: '#0891B2', width: memWidth },
    { label: 'Network I/O', value: 23, color: '#0E7490', width: netWidth },
  ]

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: 'rgba(26,26,26,0.6)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: '#0891B2', opacity: 0.5 }} />
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" style={{ color: '#0891B2' }} />
        System Health
      </h3>
      <div className="flex flex-col gap-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[#B0B0B0]">{bar.label}</span>
              <span className="text-[10px] font-bold" style={{ color: bar.color }}>{bar.value}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${bar.width}%`, background: `linear-gradient(90deg, ${bar.color}88, ${bar.color})` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(13,13,13,0.8)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22D3EE' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#22D3EE' }} />
          </span>
          <span className="text-[9px] text-[#64748B]">Uptime</span>
          <span className="text-[9px] font-bold" style={{ color: '#22D3EE' }}>99.7%</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(13,13,13,0.8)' }}>
          <span className="text-[9px] text-[#64748B]">Connections</span>
          <span className="text-[9px] font-bold" style={{ color: '#06B6D4' }}>55</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(13,13,13,0.8)' }}>
          <span className="text-[9px] text-[#64748B]">Error Rate</span>
          <span className="text-[9px] font-bold" style={{ color: '#22D3EE' }}>0.3%</span>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Strip ───────────────────────────────────────────────────────────────

function KPIStrip({ quickStats }: { quickStats?: typeof QUICK_STATS }) {
  const stats = quickStats || QUICK_STATS
  const kpis = [
    { label: 'Total Agents', value: String(stats[0]?.numericValue ?? '26'), color: '#06B6D4', change: '+2 this week', changeColor: '#22D3EE', sparkData: [22, 23, 24, 24, 25, 26] },
    { label: 'Active Now', value: String(stats[4]?.numericValue ?? '16'), color: '#22D3EE', change: `${stats[5]?.numericValue ?? 4} idle / ${stats[2] ? '' : '1 paused'}`, changeColor: '#64748B' },
    { label: 'Tasks Running', value: String(stats[6]?.numericValue ?? '12'), color: '#0891B2', change: '187 completed', changeColor: '#22D3EE' },
    { label: 'Success Rate', value: '94.7%', color: '#22D3EE', change: '+0.3%', changeColor: '#22D3EE', sparkData: [90, 92, 91, 93, 94, 95] },
    { label: 'Avg Response', value: '1.2s', color: '#B0B0B0', change: '-0.3s', changeColor: '#22D3EE' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-lg p-3.5 relative overflow-hidden"
          style={{
            background: 'rgba(26,26,26,0.4)',
            border: '1px solid rgba(51,51,51,0.3)',
          }}
        >
          <div className="text-[10px] text-[#64748B] mb-1">{kpi.label}</div>
          <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          <div className="text-[10px] mt-1" style={{ color: kpi.changeColor }}>{kpi.change}</div>
          {kpi.sparkData && (
            <div className="absolute right-2.5 bottom-2.5">
              <MiniSparkline data={kpi.sparkData} color={kpi.color} width={48} height={16} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Dashboard Header ────────────────────────────────────────────────────────

function DashboardHeader({ onOpenHierarchy, onToggleSidebar, onRefresh, wsConnected }: { onOpenHierarchy: () => void; onToggleSidebar: () => void; onRefresh?: () => void; wsConnected?: boolean }) {
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [])

  useEffect(() => {
    const updateTime = () => setLastUpdated(formatTime(new Date()))
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [formatTime])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    onRefresh?.()
    setTimeout(() => {
      setLastUpdated(formatTime(new Date()))
      setRefreshing(false)
      toast.success('Dashboard data refreshed')
    }, 1200)
  }, [formatTime, onRefresh])

  return (
    <header
      className="px-4 sm:px-6 py-2.5 border-b relative flex-shrink-0"
      style={{
        background: '#0D0D0D',
        borderBottom: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)' }} />
      <div className="flex items-center justify-between gap-3">
        {/* Left: Menu + Logo + Title + Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={onToggleSidebar} className="p-1.5 rounded-md transition-colors hover:bg-white/5 lg:hidden" style={{ color: '#64748B' }}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <Brain className="w-4 h-4" style={{ color: '#06B6D4' }} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-sm tracking-wide">P-MAS</h1>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: wsConnected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: wsConnected ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: wsConnected ? '#22C55E' : '#EF4444' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: wsConnected ? '#22C55E' : '#EF4444' }} />
              </span>
              <span className="text-[8px] font-bold tracking-wider" style={{ color: wsConnected ? '#22C55E' : '#EF4444' }}>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <span className="text-slate-600 text-[10px] hidden md:inline">Multi-Agent System</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="relative flex-1 max-w-[280px] hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#64748B' }} />
          <div className="w-full pl-7 pr-3 py-1.5 rounded-md text-[11px]" style={{ background: 'rgba(30,30,30,0.8)', border: '1px solid rgba(51,51,51,0.4)', color: '#64748B' }}>
            Search agents, formulas, tasks...
          </div>
        </div>

        {/* Right: Clock + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] text-[#64748B] font-mono hidden sm:inline" suppressHydrationWarning>{lastUpdated || '--:--:--'}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-2.5 py-1 rounded-md text-[11px] transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{ background: 'rgba(30,30,30,0.8)', border: '1px solid rgba(51,51,51,0.4)', color: '#64748B' }}
          >
            <RefreshCw className={`w-3 h-3 inline mr-1 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="px-2.5 py-1 rounded-md text-[11px] transition-all duration-200 hover:scale-105 relative"
              style={{ background: 'rgba(30,30,30,0.8)', border: '1px solid rgba(51,51,51,0.4)', color: '#64748B' }}
            >
              <Bell className="w-3 h-3 inline mr-1" />Alerts
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: '#EAB308', color: '#000' }}>3</span>
            </button>
            {showNotifications && (
              <div
                className="absolute right-0 top-9 w-56 rounded-lg p-2.5 z-50"
                style={{ background: 'rgba(20,20,20,0.98)', border: '1px solid rgba(51,51,51,0.5)', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-[10px] font-semibold uppercase tracking-wider">Alerts</span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                </div>
                {[
                  { text: 'Memory threshold warning', time: '25s ago', color: '#EAB308' },
                  { text: 'Escalation protocol triggered', time: '1m ago', color: '#06B6D4' },
                  { text: 'Agent latency spike traced', time: '2m ago', color: '#0891B2' },
                ].map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 p-1.5 rounded-md mb-1" style={{ background: 'rgba(13,13,13,0.6)' }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: alert.color }} />
                    <div>
                      <p className="text-[9px] text-[#B0B0B0]">{alert.text}</p>
                      <p className="text-[7px] text-slate-600">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onOpenHierarchy}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}
          >
            Hierarchy View
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Dashboard Sidebar ───────────────────────────────────────────────────────

function DashboardSidebar({ open, onClose, agentList: agentListProp, roleGroups: roleGroupsProp, onAgentClick }: { open: boolean; onClose: () => void; agentListProp?: typeof AGENT_LIST; roleGroupsProp?: typeof ROLE_GROUPS; onAgentClick?: (agent: any) => void }) {
  const roleGroupsData = roleGroupsProp || ROLE_GROUPS
  const agentsList = agentListProp || AGENT_LIST
  const agentsByGroup = roleGroupsData.map(group => ({
    ...group,
    agents: agentsList.filter(a => a.group === group.name),
  }))

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed lg:relative z-40 top-0 left-0 h-full
          w-[260px] flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: '#0D0D0D',
          borderRight: '1px solid rgba(51,51,51,0.5)',
        }}
      >
        <div className="p-4 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#64748B] mb-3 px-2">Agent Navigation</div>
          <div className="flex flex-col gap-1">
            {agentsByGroup.map((group) => (
              <div key={group.name}>
                <div
                  className="text-[10px] font-semibold px-2 py-1.5 rounded mt-2 mb-0.5"
                  style={{ color: group.color, background: `${group.color}12` }}
                >
                  {group.name} ({group.agents.length})
                </div>
                {group.agents.map((agent) => {
                  const dotColor = STATUS_DOT_COLORS[agent.status] || '#3F3F46'
                  return (
                    <div
                      key={agent.name}
                      onClick={() => onAgentClick?.(agent)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-white/[0.05] group"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: dotColor,
                          boxShadow: agent.status === 'active' ? `0 0 4px ${dotColor}` : 'none',
                        }}
                      />
                      <span className="text-[11px] text-[#B0B0B0] flex-1 truncate group-hover:text-white transition-colors">{agent.name}</span>
                      <span className="text-[8px] text-[#64748B] group-hover:text-[#B0B0B0] transition-colors">{agent.role}</span>
                      <Pencil size={8} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Dashboard Panel ──────────────────────────────────────────────────────────

function DashboardPanel({ onOpenHierarchy }: { onOpenHierarchy: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [editingAgent, setEditingAgent] = useState<any>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editDeleting, setEditDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', role: '', roleGroup: '', status: '', formula: '', skills: '', description: '' })
  const [wsConnected, setWsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const fetchStatsRef = useRef<() => Promise<void>>(async () => {})

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStatsData(data)
      }
    } catch {
      // fallback to hardcoded constants — they remain as defaults
    } finally {
      setLoading(false)
    }
  }, [])

  // Keep ref in sync
  fetchStatsRef.current = fetchStats

  useEffect(() => {
    fetchStats()
    const now = new Date()
    setLastUpdated(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
  }, [fetchStats])

  // ── WebSocket Connection for Real-Time Updates ────────────────────────────
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
      console.log('[ws:dashboard] connected')
      setWsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[ws:dashboard] disconnected')
      setWsConnected(false)
    })

    socket.on('agent:status', () => {
      fetchStatsRef.current()
    })

    socket.on('agent:created', () => {
      fetchStatsRef.current()
    })

    socket.on('agent:updated', () => {
      fetchStatsRef.current()
    })

    socket.on('agent:deleted', () => {
      fetchStatsRef.current()
    })

    socket.on('agents:snapshot', () => {
      fetchStatsRef.current()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // ── Computed Values from API Data (with fallbacks) ─────────────────────────
  const quickStats = statsData ? [
    { label: 'Total Agents', value: String(statsData.quickStats.totalAgents), numericValue: statsData.quickStats.totalAgents, color: '#06B6D4', colorRgb: '6,182,212' },
    { label: 'Role Groups', value: String(statsData.quickStats.roleGroups), numericValue: statsData.quickStats.roleGroups, color: '#0891B2', colorRgb: '8,145,178' },
    { label: 'Cognitive Formulas', value: String(statsData.quickStats.cognitiveFormulas), numericValue: statsData.quickStats.cognitiveFormulas, color: '#6B7280', colorRgb: '107,114,128' },
    { label: 'Edge Types', value: String(statsData.quickStats.edgeTypes), numericValue: statsData.quickStats.edgeTypes, color: '#475569', colorRgb: '71,85,105' },
    { label: 'Active Agents', value: String(statsData.quickStats.activeAgents), numericValue: statsData.quickStats.activeAgents, color: '#06B6D4', colorRgb: '6,182,212' },
    { label: 'Idle Agents', value: String(statsData.quickStats.idleAgents), numericValue: statsData.quickStats.idleAgents, color: '#6B7280', colorRgb: '107,114,128' },
    { label: 'Tasks', value: String(statsData.quickStats.totalTasks), numericValue: statsData.quickStats.totalTasks, color: '#22D3EE', colorRgb: '34,211,238' },
    { label: 'Formulas Coverage', value: statsData.quickStats.formulasCoverage + '%', numericValue: statsData.quickStats.formulasCoverage, color: '#0891B2', colorRgb: '8,145,178' },
  ] : QUICK_STATS

  const statusDistribution = statsData ? statsData.statusDistribution : STATUS_DISTRIBUTION

  const roleGroups = statsData ? statsData.roleGroups.map((rg: any) => ({
    ...rg,
    icon: ROLE_GROUP_ICONS[rg.name] || Brain,
    desc: rg.description || rg.desc,
    statusSummary: rg.statusSummary || [],
  })) : ROLE_GROUPS

  const agentList = statsData ? statsData.agents.map((a: any) => ({
    name: a.name,
    group: a.roleGroup,
    status: a.status === 'active' ? 'active' as const : a.status === 'idle' ? 'idle' as const : a.status === 'paused' ? 'paused' as const : a.status === 'standby' ? 'standby' as const : a.status === 'error' ? 'offline' as const : 'offline' as const,
    role: a.status === 'active' ? 'active' as const : a.status === 'idle' ? 'idle' as const : a.status === 'paused' ? 'paused' as const : a.status === 'standby' ? 'standby' as const : a.status === 'error' ? 'offline' as const : 'offline' as const,
  })) : AGENT_LIST

  const activityEvents = statsData ? statsData.activityEvents : ACTIVITY_EVENTS

  const topPerformers = statsData ? statsData.topPerformers : TOP_PERFORMERS

  const connectionHeatmapData = statsData ? statsData.connectionHeatmap : CONNECTION_HEATMAP_DATA

  const networkActivityData = statsData ? statsData.networkActivity : NETWORK_ACTIVITY_DATA

  // ── Refresh Handler ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    fetchStats()
    const now = new Date()
    setLastUpdated(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
  }, [fetchStats])

  // ── Agent Edit Handler ────────────────────────────────────────────────────
  const handleAgentClick = useCallback(async (agent: any) => {
    // Try to find the agent from the API data (which has full info including ID)
    try {
      // agentList from statsData includes id field
      const fullAgent = statsData?.agents?.find((a: any) => a.name === agent.name) || agent
      if (fullAgent.id) {
        setEditingAgent(fullAgent)
        setEditForm({
          name: fullAgent.name || '',
          role: fullAgent.role || '',
          roleGroup: fullAgent.roleGroup || fullAgent.group || '',
          status: fullAgent.status || 'active',
          formula: fullAgent.formula || '',
          skills: fullAgent.skills || '',
          description: fullAgent.description || '',
        })
        setShowDeleteConfirm(false)
      } else {
        toast.info('Switch to Hierarchy view to edit agents')
      }
    } catch {
      toast.info('Switch to Hierarchy view to edit agents')
    }
  }, [statsData])

  const handleEditSave = useCallback(async () => {
    if (!editingAgent?.id) return
    setEditSaving(true)
    try {
      const res = await fetchWithRetry(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast.success(`Agent "${editForm.name}" updated`)
        setEditingAgent(null)
        handleRefresh()
      } else {
        toast.error('Failed to update agent')
      }
    } catch {
      toast.error('Failed to update agent')
    } finally {
      setEditSaving(false)
    }
  }, [editingAgent, editForm, handleRefresh])

  const handleEditDelete = useCallback(async () => {
    if (!editingAgent?.id) return
    setEditDeleting(true)
    try {
      const res = await fetchWithRetry(`/api/agents/${editingAgent.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(`Agent "${editingAgent.name}" deleted`)
        setEditingAgent(null)
        handleRefresh()
      } else {
        toast.error('Failed to delete agent')
      }
    } catch {
      toast.error('Failed to delete agent')
    } finally {
      setEditDeleting(false)
    }
  }, [editingAgent, handleRefresh])

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ background: '#000000' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-transparent" style={{ borderTopColor: '#06B6D4', borderRightColor: '#06B6D4', animation: 'spin 1s linear infinite' }} />
          </div>
          <div className="text-[#64748B] text-sm font-medium">Loading dashboard data...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#000000' }}>
      <style>{`
        .activity-scroll::-webkit-scrollbar { width: 4px; }
        .activity-scroll::-webkit-scrollbar-track { background: transparent; }
        .activity-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .activity-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(6, 182, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
      `}</style>

      <DashboardHeader
        onOpenHierarchy={onOpenHierarchy}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onRefresh={handleRefresh}
        wsConnected={wsConnected}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          agentListProp={agentList}
          roleGroupsProp={roleGroups}
          onAgentClick={handleAgentClick}
        />

        <main className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {/* Data source indicator */}
          {statsData && (
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22D3EE' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#22D3EE' }} />
              </span>
              <span className="text-[9px] text-[#64748B]">Live data</span>
              <span className="text-[9px] text-[#4B5563]">•</span>
              <span className="text-[9px] text-[#64748B]" suppressHydrationWarning>Updated {lastUpdated || '—'}</span>
            </div>
          )}

          {/* Row 1: KPI Strip */}
          <KPIStrip quickStats={quickStats} />

          {/* Row 2-4: Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            {/* Row 2 */}
            <StatusDistributionCard statusDistribution={statusDistribution} />
            <TopPerformersCard topPerformersProp={topPerformers} roleGroupsProp={roleGroups} />
            <SystemHealthCard />

            {/* Row 3 */}
            <div className="lg:col-span-2">
              <NetworkActivityChart data={networkActivityData} />
            </div>
            <RecentActivityTimeline events={activityEvents} />

            {/* Row 4 */}
            <ConnectionHeatmap data={connectionHeatmapData} />
            <div className="lg:col-span-2">
              <FormulaAgentMappingGrid />
            </div>
          </div>
        </main>
      </div>

      {/* ─── Agent Edit Modal ─────────────────────────────────────────────── */}
      {editingAgent && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingAgent(null) }}
        >
          <div
            style={{
              background: '#0A0A0A', border: '1px solid rgba(51,51,51,0.5)',
              borderRadius: 12, width: 420, maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(51,51,51,0.3)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#06B6D4' }}>Edit Agent</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Update agent properties</div>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
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
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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
                  value={editForm.role}
                  onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
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
                  value={editForm.roleGroup}
                  onChange={e => setEditForm(prev => ({ ...prev, roleGroup: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                >
                  {ROLE_GROUPS.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                >
                  {['active', 'idle', 'paused', 'standby', 'error', 'offline'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Formula */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Cognitive Formula
                </label>
                <select
                  value={editForm.formula}
                  onChange={e => setEditForm(prev => ({ ...prev, formula: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                >
                  {FORMULA_TAXONOMY.flatMap(c => c.formulas).map(f => (
                    <option key={f.name} value={f.name}>{f.name} — {f.full}</option>
                  ))}
                </select>
              </div>

              {/* Skills */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Skills (comma-separated)
                </label>
                <input
                  value={editForm.skills}
                  onChange={e => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g. analysis,reporting,optimization"
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 12px', background: '#111',
                    border: '1px solid rgba(51,51,51,0.4)', color: '#fff', fontSize: 12,
                    borderRadius: 6, outline: 'none', resize: 'vertical' as const, minHeight: 60,
                  }}
                />
              </div>
            </div>

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div style={{
                padding: '10px 20px',
                background: 'rgba(239,68,68,0.06)',
                borderTop: '1px solid rgba(239,68,68,0.2)',
                borderBottom: '1px solid rgba(239,68,68,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <AlertTriangle size={12} color="#EF4444" />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444' }}>
                    Delete &quot;{editingAgent.name}&quot;?
                  </span>
                </div>
                <div style={{ fontSize: 9, color: '#B0B0B0', marginBottom: 8 }}>
                  This action cannot be undone. The agent and its tasks will be permanently removed.
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleEditDelete}
                    disabled={editDeleting}
                    style={{
                      flex: 1, padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#EF4444', cursor: editDeleting ? 'wait' : 'pointer',
                      opacity: editDeleting ? 0.6 : 1,
                    }}
                  >
                    {editDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                      background: '#1A1A1A', border: '1px solid rgba(51,51,51,0.4)',
                      color: '#B0B0B0', cursor: 'pointer',
                    }}
                  >
                    Keep
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid rgba(51,51,51,0.3)',
              display: 'flex', justifyContent: 'flex-end', gap: 8,
            }}>
              {!showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444', cursor: 'pointer', fontSize: 11,
                    display: 'flex', alignItems: 'center', gap: 4, marginRight: 'auto',
                  }}
                >
                  <Trash2 size={10} />
                  Delete
                </button>
              )}
              <button
                onClick={() => setEditingAgent(null)}
                style={{
                  padding: '6px 16px', borderRadius: 6, background: '#1A1A1A',
                  border: '1px solid rgba(51,51,51,0.4)', color: '#B0B0B0',
                  cursor: 'pointer', fontSize: 11,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.name.trim()}
                style={{
                  padding: '6px 16px', borderRadius: 6,
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  color: '#06B6D4', cursor: editSaving ? 'wait' : 'pointer', fontSize: 11,
                  opacity: !editForm.name.trim() || editSaving ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Save size={10} />
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255,255,255'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}
