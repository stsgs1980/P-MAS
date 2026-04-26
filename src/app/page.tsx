'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Brain, Target, Shield, Zap, Database, Activity, Network, Sparkles, ArrowRight, ArrowLeftRight, Diamond, Eye, Megaphone, Workflow, ChevronRight, ChevronDown, TrendingUp, TrendingDown, Cpu, HardDrive, Wifi, ArrowUp, Grid3X3, BarChart3, Clock, CheckCircle2, ListChecks, RotateCcw, BookOpen, Download, X, Bell, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'

const AgentHierarchy = dynamic(
  () => import('@/components/agent-hierarchy'),
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
  { name: 'Стратегия', label: 'Strategy', color: '#67E8F9', colorRgb: '103,232,249', icon: Brain, agents: 3, activeAgents: 3, formulas: 'ToT, CoVe, GoT', desc: 'Strategic planning, analysis, vision', statusSummary: [{ color: '#06B6D4', label: '3 active' }] },
  { name: 'Тактика', label: 'Tactics', color: '#22D3EE', colorRgb: '34,211,238', icon: Target, agents: 3, activeAgents: 2, formulas: 'ReWOO, ReAct, SelfConsistency', desc: 'Coordination, planning, communication', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 idle' }] },
  { name: 'Контроль', label: 'Control', color: '#06B6D4', colorRgb: '6,182,212', icon: Shield, agents: 3, activeAgents: 3, formulas: 'Reflexion, CoVe, ReAct', desc: 'Quality, evaluation, safety', statusSummary: [{ color: '#06B6D4', label: '3 active' }] },
  { name: 'Исполнение', label: 'Execution', color: '#06B6D4', colorRgb: '6,182,212', icon: Zap, agents: 5, activeAgents: 4, formulas: 'ReAct, MoA, SelfRefine, PoT', desc: 'Task execution, coding, testing', statusSummary: [{ color: '#06B6D4', label: '4 active' }, { color: '#6B7280', label: '1 idle' }] },
  { name: 'Память', label: 'Memory / Knowledge', color: '#0891B2', colorRgb: '8,145,178', icon: Database, agents: 3, activeAgents: 2, formulas: 'CoT, AoT, SoT', desc: 'Knowledge base, RAG, context management', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#8B5CF6', label: '1 standby' }] },
  { name: 'Мониторинг', label: 'Monitoring', color: '#0E7490', colorRgb: '14,116,144', icon: Activity, agents: 3, activeAgents: 2, formulas: 'CoT, LATS, GoT', desc: 'Observation, alerting, diagnostics', statusSummary: [{ color: '#22D3EE', label: '2 active' }, { color: '#F59E0B', label: '1 paused' }] },
  { name: 'Коммуникация', label: 'Communication', color: '#155E75', colorRgb: '21,94,117', icon: Network, agents: 3, activeAgents: 2, formulas: 'PromptChaining, StepBack, PlanAndSolve', desc: 'Inter-agent messaging, routing, protocol translation', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 idle' }] },
  { name: 'Обучение', label: 'Learning / Training', color: '#164E63', colorRgb: '22,78,99', icon: Sparkles, agents: 3, activeAgents: 2, formulas: 'DSPy, MetaCoT, LeastToMost', desc: 'Fine-tuning, feedback loops, skill acquisition', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 idle' }] },
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
  { label: 'Active', count: 16, color: '#22D3EE' },
  { label: 'Idle', count: 4, color: '#6B7280' },
  { label: 'Paused', count: 1, color: '#F59E0B' },
  { label: 'Standby', count: 1, color: '#8B5CF6' },
  { label: 'Error', count: 0, color: '#EF4444' },
  { label: 'Offline', count: 4, color: '#4B5563' },
]

// ─── Network Activity Data ──────────────────────────────────────────────────

const NETWORK_ACTIVITY_DATA = [12, 18, 15, 22, 28, 35, 42, 38, 45, 52, 48, 55, 50, 47, 42, 38, 44, 50, 53, 48, 35, 28, 20, 15]

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

function RecentActivityTimeline() {
  return (
    <div
      className="rounded-xl p-4 sm:p-6 flex flex-col flex-1"
      style={{
        background: 'rgba(45, 45, 45, 0.3)',
        border: '1px solid rgba(51, 51, 51, 0.5)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        Recent Activity
      </h3>
      <div
        className="flex-1 overflow-y-auto space-y-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        <div className="activity-scroll overflow-y-auto space-y-0">
          {ACTIVITY_EVENTS.map((event, i) => {
            const groupConfig = ROLE_GROUPS.find(g => g.name === event.group)
            const dotColor = groupConfig?.color || '#94a3b8'
            return (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-b-0 rounded-lg px-2 transition-colors duration-150 hover:bg-white/[0.02]">
                <div className="flex flex-col items-center mt-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                  {i < ACTIVITY_EVENTS.length - 1 && (
                    <span className="w-px flex-1 mt-1" style={{ background: `linear-gradient(to bottom, ${dotColor}, transparent)`, minHeight: '16px', opacity: 0.4 }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{event.time}</span>
                    <span className="text-[10px] font-bold" style={{ color: dotColor }}>{event.agent}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">{event.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
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

function ConnectionHeatmap() {
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
        {CONNECTION_HEATMAP_DATA.map((row, rowIdx) => (
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

function AgentPerformance() {
  const [barWidths, setBarWidths] = useState<number[]>(TOP_PERFORMERS.map(() => 0))

  useEffect(() => {
    const timers = TOP_PERFORMERS.map((_, i) =>
      setTimeout(() => {
        setBarWidths(prev => {
          const next = [...prev]
          next[i] = TOP_PERFORMERS[i].score
          return next
        })
      }, 100 + i * 80)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const getGroupColor = (groupName: string): string => {
    const group = ROLE_GROUPS.find(g => g.name === groupName)
    return group?.color || '#94a3b8'
  }

  const donutRadius = 50
  const donutStroke = 10
  const donutCircumference = 2 * Math.PI * donutRadius
  const totalAgents = STATUS_DISTRIBUTION.reduce((sum, s) => sum + s.count, 0)

  const donutSegments = STATUS_DISTRIBUTION.filter(s => s.count > 0).reduce<Array<{
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
            {TOP_PERFORMERS.map((agent, i) => {
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
            {STATUS_DISTRIBUTION.map((status) => (
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

function NetworkActivityChart() {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  const data = NETWORK_ACTIVITY_DATA
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
      const res = await fetch('/api/seed', { method: 'POST' })
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
      const res = await fetch('/api/hierarchy')
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

// ─── Dashboard Panel ──────────────────────────────────────────────────────────

function DashboardPanel({ onOpenHierarchy }: { onOpenHierarchy: () => void }) {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [showNotifications, setShowNotifications] = useState(false)

  // Live clock - only on client to avoid hydration mismatch
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(formatTime(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [formatTime])

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      setShowScrollTop(window.scrollY > scrollHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setLastUpdated(formatTime(new Date()))
      setRefreshing(false)
      toast.success('Dashboard data refreshed')
    }, 1200)
  }, [])

  // Filter function for search
  const matchesSearch = (text: string): boolean => {
    if (!searchQuery.trim()) return true
    return text.toLowerCase().includes(searchQuery.toLowerCase())
  }

  // Filtered role groups
  const filteredRoleGroups = ROLE_GROUPS.filter(g =>
    matchesSearch(g.name) || matchesSearch(g.label) || matchesSearch(g.desc) || matchesSearch(g.formulas)
  )

  // Filtered formulas
  const filteredFormulaTaxonomy = FORMULA_TAXONOMY.map(cat => ({
    ...cat,
    formulas: cat.formulas.filter(f => matchesSearch(f.name) || matchesSearch(f.full) || matchesSearch(cat.category)),
  })).filter(cat => cat.formulas.length > 0)

  // Filtered edge types
  const filteredEdgeTypes = EDGE_TYPES.filter(e => matchesSearch(e.name) || matchesSearch(e.desc))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000000', scrollBehavior: 'smooth' }}>
      <style>{`
        html { scroll-behavior: smooth; }
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
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease forwards;
        }
        .animate-spin-slow {
          animation: spin 1s linear infinite;
        }
        .pulse-ring {
          animation: pulseRing 2s ease-out infinite;
        }
      `}</style>

      {/* Header */}
      <header
        className="px-4 sm:px-6 py-4 border-b border-white/5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(103,232,249,0.05), rgba(6,182,212,0.04), rgba(14,116,144,0.03))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 12s ease infinite',
        }}
      >
        <div className="max-w-[1280px] mx-auto">
          {/* Top row: Logo + actions */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
                <Brain className="w-5 h-5" style={{ color: '#06B6D4' }} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-white font-bold text-lg tracking-wide">P-MAS</h1>
                  {/* System Status badge */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#06B6D4' }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#06B6D4' }} />
                    </span>
                    <span className="text-[9px] font-bold tracking-wider" style={{ color: '#06B6D4' }}>ONLINE</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs hidden sm:block">Prompt-based Multi-Agent System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                <input
                  type="text"
                  placeholder="Filter dashboard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-lg text-xs w-40 lg:w-52 focus:outline-none focus:ring-1 transition-all duration-200"
                  style={{
                    background: 'rgba(45, 45, 45, 0.5)',
                    border: '1px solid rgba(51, 51, 51, 0.5)',
                    color: '#FFFFFF',
                    focusRingColor: 'rgba(6, 182, 212, 0.4)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(6,182,212,0.1)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(51,51,51,0.5)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
                style={{
                  background: 'rgba(45, 45, 45, 0.5)',
                  border: '1px solid rgba(51, 51, 51, 0.5)',
                  color: '#B0B0B0',
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin-slow' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center p-2 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(45, 45, 45, 0.5)',
                    border: '1px solid rgba(51, 51, 51, 0.5)',
                    color: '#B0B0B0',
                  }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: '#06B6D4', color: '#000000' }}>3</span>
                </button>
                {showNotifications && (
                  <div
                    className="absolute right-0 top-10 w-64 rounded-xl p-3 z-50 animate-fade-in-up"
                    style={{
                      background: 'rgba(26,26,26,0.98)',
                      border: '1px solid rgba(51,51,51,0.5)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-xs font-semibold">Alerts</span>
                      <button onClick={() => setShowNotifications(false)} className="text-[#B0B0B0] hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { text: 'Memory threshold warning detected', time: '25s ago', color: '#FFC107' },
                        { text: 'Escalation protocol triggered', time: '1m ago', color: '#06B6D4' },
                        { text: 'Agent latency spike traced', time: '2m ago', color: '#0891B2' },
                      ].map((alert, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.03]" style={{ background: 'rgba(13,13,13,0.6)' }}>
                          <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: alert.color }} />
                          <div>
                            <p className="text-[10px] text-[#B0B0B0]">{alert.text}</p>
                            <p className="text-[8px] text-slate-600 mt-0.5">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Open Hierarchy */}
              <button
                onClick={onOpenHierarchy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#06B6D4',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="12" y1="2" x2="12" y2="6"/>
                  <line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="6" y2="12"/>
                  <line x1="18" y1="12" x2="22" y2="12"/>
                </svg>
                <span>Open Hierarchy</span>
              </button>
            </div>
          </div>
          {/* Bottom row: Last Updated */}
          <div className="flex items-center justify-between mt-2 relative z-10">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" style={{ color: '#6B7280' }} />
              <span className="text-[10px] text-slate-500">Last Updated: {lastUpdated || '--:--:--'}</span>
            </div>
            {/* Mobile search */}
            <div className="relative sm:hidden">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1.5 rounded-lg text-[10px] w-32 focus:outline-none transition-all duration-200"
                style={{ background: 'rgba(45,45,45,0.5)', border: '1px solid rgba(51,51,51,0.5)', color: '#FFFFFF' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-[1280px] mx-auto w-full">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {QUICK_STATS.map((stat, index) => {
            const isActiveAgents = stat.label === 'Active Agents'
            return (
              <div
                key={stat.label}
                className={`rounded-xl p-3 sm:p-4 transition-all duration-300 relative overflow-hidden animate-fade-in-up ${isActiveAgents ? 'pulse-ring' : ''}`}
                style={{
                  background: `rgba(${stat.colorRgb}, 0.06)`,
                  border: `1px solid rgba(${stat.colorRgb}, 0.15)`,
                  boxShadow: `0 0 0 rgba(${stat.colorRgb}, 0)`,
                  animationDelay: `${index * 60}ms`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 20px rgba(${stat.colorRgb}, 0.15)`; e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = isActiveAgents ? '' : `0 0 0 rgba(${stat.colorRgb}, 0)`; e.currentTarget.style.transform = 'scale(1)' }}
              >
                {/* Pulsing glow for Active Agents */}
                {isActiveAgents && (
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, rgba(${stat.colorRgb}, 0.08), transparent 70%)`,
                      animation: 'pulseGlow 2s ease-in-out infinite',
                    }}
                  />
                )}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-l-xl"
                  style={{ width: 3, background: stat.color, opacity: 0.6 }}
                />
                <div className="relative z-10">
                  <p className="text-xl sm:text-2xl font-bold ml-2" style={{ color: stat.color }}>
                    <AnimatedCounter target={stat.numericValue} suffix={stat.value.includes('%') ? '%' : ''} />
                  </p>
                  <p className="text-slate-400 text-[10px] sm:text-xs mt-1 ml-2">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Role Groups Grid */}
        <CollapsibleSection
          title="Role Groups"
          icon={<Grid3X3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          count={filteredRoleGroups.length}
          accentColor="#06B6D4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRoleGroups.map((group) => {
              const GroupIcon = group.icon
              const activeRatio = group.activeAgents / group.agents
              return (
                <div
                  key={group.name}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03]"
                  style={{
                    background: `rgba(${group.colorRgb}, 0.04)`,
                    border: `1px solid rgba(${group.colorRgb}, 0.18)`,
                    transform: 'translateY(0px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = `0 8px 25px rgba(${group.colorRgb}, 0.15), 0 0 0 1px rgba(${group.colorRgb}, 0.3)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    className="h-1"
                    style={{
                      background: `linear-gradient(90deg, ${group.color}, transparent)`,
                      opacity: 0.7,
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: `rgba(${group.colorRgb}, 0.15)`,
                            border: `1px solid rgba(${group.colorRgb}, 0.25)`,
                            boxShadow: `inset 0 0 8px rgba(${group.colorRgb}, 0.1)`,
                          }}
                        >
                          <GroupIcon size={14} style={{ color: group.color }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs" style={{ color: group.color }}>{group.name}</h3>
                          <p className="text-[9px] text-slate-500">{group.label}</p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-semibold"
                        style={{
                          background: `rgba(${group.colorRgb}, 0.15)`,
                          color: group.color,
                        }}
                      >
                        {group.agents}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] mb-2 leading-relaxed">{group.desc}</p>
                    {/* Active agents progress bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] text-slate-500">Active / Total</span>
                        <span className="text-[8px] font-bold" style={{ color: group.color }}>{group.activeAgents}/{group.agents}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${activeRatio * 100}%`,
                            background: `linear-gradient(90deg, ${group.color}66, ${group.color})`,
                            boxShadow: `0 0 6px ${group.color}33`,
                          }}
                        />
                      </div>
                    </div>
                    {/* Status summary */}
                    <div className="flex items-center gap-3 mb-2">
                      {group.statusSummary.map((s, si) => (
                        <div key={si} className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-[9px] text-slate-400">{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.formulas.split(', ').map((f) => (
                        <span
                          key={f}
                          className="text-[8px] px-1.5 py-0.5 rounded transition-colors duration-200 hover:bg-white/[0.05]"
                          style={{
                            background: `rgba(${group.colorRgb}, 0.1)`,
                            color: group.color,
                            border: `1px solid rgba(${group.colorRgb}, 0.15)`,
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>

        {/* Prompting Formulas Taxonomy */}
        <CollapsibleSection
          title="Prompting Formulas Taxonomy"
          icon={<BookOpen className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />}
          count={filteredFormulaTaxonomy.reduce((sum, cat) => sum + cat.formulas.length, 0)}
          accentColor="#6B7280"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFormulaTaxonomy.map((category) => (
              <div
                key={category.category}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(45, 45, 45, 0.3)',
                  border: '1px solid rgba(51, 51, 51, 0.5)',
                }}
              >
                <h3 className="text-slate-300 text-xs font-bold mb-3 uppercase tracking-wider">{category.category}</h3>
                <div className="space-y-2">
                  {category.formulas.map((formula) => (
                    <div
                      key={formula.name}
                      className="rounded-lg p-2 flex items-center gap-2 transition-colors duration-200 hover:bg-white/[0.03]"
                      style={{
                        background: `${formula.color}08`,
                        borderLeft: `3px solid ${formula.color}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[10px]" style={{ color: formula.color }}>{formula.name}</p>
                        <p className="text-slate-500 text-[8px] leading-tight truncate">{formula.full}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Formula Flow Diagram */}
        <CollapsibleSection
          title="Formula Flow Diagram"
          icon={<Workflow className="w-3.5 h-3.5 text-cyan-400" />}
          accentColor="#22D3EE"
          defaultOpen={false}
        >
          <FormulaFlowDiagram />
        </CollapsibleSection>

        {/* Edge Types */}
        <CollapsibleSection
          title="Edge Types"
          icon={<ArrowLeftRight className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          count={filteredEdgeTypes.length}
          accentColor="#06B6D4"
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {filteredEdgeTypes.map((edge) => {
              const EdgeIcon = edge.icon
              return (
                <div
                  key={edge.name}
                  className="rounded-xl p-4 text-center transition-all duration-200 hover:scale-[1.03] hover:bg-white/[0.02]"
                  style={{
                    background: `rgba(${hexToRgb(edge.color)}, 0.06)`,
                    border: `1px solid rgba(${hexToRgb(edge.color)}, 0.18)`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                    style={{ background: `rgba(${hexToRgb(edge.color)}, 0.12)` }}
                  >
                    <EdgeIcon size={14} style={{ color: edge.color }} />
                  </div>
                  <div className="w-full mb-2" style={{ borderTop: `2px ${edge.style === 'solid' ? 'solid' : edge.style === 'dotted' ? 'dotted' : 'dashed'} ${edge.color}` }} />
                  <p className="font-bold text-[10px]" style={{ color: edge.color }}>{edge.name}</p>
                  <p className="text-slate-500 text-[8px] mt-0.5">{edge.desc}</p>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>

        {/* Connection Heatmap */}
        <CollapsibleSection
          title="Connection Heatmap"
          icon={<Grid3X3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          accentColor="#06B6D4"
          defaultOpen={false}
        >
          <ConnectionHeatmap />
        </CollapsibleSection>

        {/* Architecture Overview */}
        <CollapsibleSection
          title="Architecture Overview"
          icon={<Network className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          accentColor="#06B6D4"
          defaultOpen={false}
        >
          <ArchitectureDiagram />
        </CollapsibleSection>

        {/* System Health Monitor */}
        <CollapsibleSection
          title="System Health"
          icon={<Activity className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          accentColor="#06B6D4"
        >
          <SystemHealthMonitor />
        </CollapsibleSection>

        {/* Agent Performance */}
        <CollapsibleSection
          title="Agent Performance"
          icon={<BarChart3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          accentColor="#06B6D4"
        >
          <AgentPerformance />
        </CollapsibleSection>

        {/* Network Activity Chart */}
        <CollapsibleSection
          title="Network Activity"
          icon={<Activity className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          accentColor="#06B6D4"
        >
          <NetworkActivityChart />
        </CollapsibleSection>

        {/* Recent Activity Timeline + Formula-Agent Mapping side by side */}
        <CollapsibleSection
          title="Activity & Mapping"
          icon={<Clock className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />}
          accentColor="#06B6D4"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentActivityTimeline />
            <FormulaAgentMappingGrid />
          </div>
        </CollapsibleSection>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActionsPanel />
        </div>

        {/* Open Hierarchy button */}
        <div className="flex gap-3">
          <button
            onClick={onOpenHierarchy}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.04))',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#06B6D4',
            }}
          >
            <ChevronRight className="w-4 h-4" />
            Open Hierarchy Visualization
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="mt-auto px-4 sm:px-6 py-6 relative"
        style={{ background: '#0D0D0D' }}
      >
        {/* Gradient top border */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #06B6D4, transparent)' }}
        />
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left: Logo + version + status */}
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Brain size={14} style={{ color: '#06B6D4' }} />
              <span className="text-[11px] font-bold" style={{ color: '#FFFFFF' }}>P-MAS Dashboard v5.1</span>
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>-- Monochrome Cyan</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#06B6D4', animation: 'pulseGlow 2s ease-in-out infinite' }} />
                <span className="text-[8px] font-bold" style={{ color: '#06B6D4' }}>ONLINE</span>
              </span>
            </div>

            {/* Center: Key stats + timestamp */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="text-[10px]" style={{ color: '#B0B0B0' }}>26 Agents</span>
                <span style={{ color: '#333333' }}>|</span>
                <span className="text-[10px]" style={{ color: '#B0B0B0' }}>8 Groups</span>
                <span style={{ color: '#333333' }}>|</span>
                <span className="text-[10px]" style={{ color: '#B0B0B0' }}>20 Formulas</span>
                <span style={{ color: '#333333' }}>|</span>
                <span className="text-[10px]" style={{ color: '#B0B0B0' }}>6 Edges</span>
              </div>
              <span className="text-[9px] text-slate-600">Last refreshed: {lastUpdated || '--:--:--'}</span>
            </div>

            {/* Right: Tech stack */}
            <div className="text-center md:text-right">
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>Powered by Next.js 16 + Prisma + TypeScript</span>
              <br />
              <span className="text-[9px] text-slate-600">Build 2024.03.07 -- Task #6</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#06B6D4',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
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
