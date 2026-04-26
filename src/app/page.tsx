'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Brain, Target, Shield, Zap, Database, Activity, Network, Sparkles, ArrowRight, ArrowLeftRight, Diamond, Eye, Megaphone, Workflow, ChevronRight, TrendingUp, TrendingDown, Cpu, HardDrive, Wifi, ArrowUp, Grid3X3, BarChart3, Clock, CheckCircle2, ListChecks, RotateCcw, BookOpen, Download, Palette, X } from 'lucide-react'
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
  { name: 'Стратегия', label: 'Strategy', color: '#67E8F9', colorRgb: '103,232,249', icon: Brain, agents: 3, formulas: 'ToT, CoVe, GoT', desc: 'Strategic planning, analysis, vision', statusSummary: [{ color: '#06B6D4', label: '3 active' }] },
  { name: 'Тактика', label: 'Tactics', color: '#22D3EE', colorRgb: '34,211,238', icon: Target, agents: 3, formulas: 'ReWOO, ReAct, SelfConsistency', desc: 'Coordination, planning, communication', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 idle' }] },
  { name: 'Контроль', label: 'Control', color: '#06B6D4', colorRgb: '6,182,212', icon: Shield, agents: 3, formulas: 'Reflexion, CoVe, ReAct', desc: 'Quality, evaluation, safety', statusSummary: [{ color: '#06B6D4', label: '3 active' }] },
  { name: 'Исполнение', label: 'Execution', color: '#06B6D4', colorRgb: '6,182,212', icon: Zap, agents: 5, formulas: 'ReAct, MoA, SelfRefine, PoT', desc: 'Task execution, coding, testing', statusSummary: [{ color: '#06B6D4', label: '4 active' }, { color: '#6B7280', label: '1 idle' }] },
  { name: 'Память', label: 'Memory / Knowledge', color: '#0891B2', colorRgb: '8,145,178', icon: Database, agents: 3, formulas: 'CoT, AoT, SoT', desc: 'Knowledge base, RAG, context management', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 standby' }] },
  { name: 'Мониторинг', label: 'Monitoring', color: '#0E7490', colorRgb: '14,116,144', icon: Activity, agents: 3, formulas: 'CoT, LATS, GoT', desc: 'Observation, alerting, diagnostics', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#9CA3AF', label: '1 paused' }] },
  { name: 'Коммуникация', label: 'Communication', color: '#155E75', colorRgb: '21,94,117', icon: Network, agents: 3, formulas: 'PromptChaining, StepBack, PlanAndSolve', desc: 'Inter-agent messaging, routing, protocol translation', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 idle' }] },
  { name: 'Обучение', label: 'Learning / Training', color: '#164E63', colorRgb: '22,78,99', icon: Sparkles, agents: 3, formulas: 'DSPy, MetaCoT, LeastToMost', desc: 'Fine-tuning, feedback loops, skill acquisition', statusSummary: [{ color: '#06B6D4', label: '2 active' }, { color: '#6B7280', label: '1 idle' }] },
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
  { label: 'Total Agents', value: '26', color: '#06B6D4', colorRgb: '6,182,212' },
  { label: 'Role Groups', value: '8', color: '#0891B2', colorRgb: '8,145,178' },
  { label: 'Cognitive Formulas', value: '20', color: '#6B7280', colorRgb: '107,114,128' },
  { label: 'Edge Types', value: '6', color: '#475569', colorRgb: '71,85,105' },
  { label: 'Active Agents', value: '16', color: '#06B6D4', colorRgb: '6,182,212' },
  { label: 'Idle Agents', value: '4', color: '#6B7280', colorRgb: '107,114,128' },
  { label: 'Tasks', value: '26', color: '#22D3EE', colorRgb: '34,211,238' },
  { label: 'Formulas Coverage', value: '100%', color: '#0891B2', colorRgb: '8,145,178' },
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

// 8x8 matrix: heatmap[row][col] = number of connections from row group to col group
// 0 = no direct connection, diagonal = internal sync connections
const CONNECTION_HEATMAP_DATA: number[][] = [
  // Стр  Ткт  Кнт  Исп  Пмт  Мнц  Кмн  Обч
  [  2,   3,   2,   1,   0,   2,   0,   0], // Стратегия
  [  0,   2,   1,   5,   0,   0,   0,   0], // Тактика
  [  0,   0,   2,   3,   0,   0,   0,   0], // Контроль
  [  0,   0,   0,   3,   0,   0,   0,   0], // Исполнение
  [  0,   0,   0,   1,   1,   2,   0,   0], // Память
  [  0,   0,   0,   0,   0,   2,   0,   0], // Мониторинг
  [  0,   1,   0,   2,   1,   0,   2,   0], // Коммуникация
  [  0,   0,   0,   1,   2,   0,   0,   2], // Обучение
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

const PERFORMANCE_METRICS = [
  { label: 'Avg Response Time', value: '1.2s', color: '#06B6D4', icon: Clock, sparkline: true },
  { label: 'Success Rate', value: '94.7%', color: '#22D3EE', icon: CheckCircle2 },
  { label: 'Tasks Completed', value: '187', color: '#06B6D4', icon: ListChecks, trendUp: true },
  { label: 'Active Workflows', value: '12', color: '#06B6D4', icon: Workflow },
  { label: 'Error Recovery', value: '98.2%', color: '#FFC107', icon: RotateCcw },
  { label: 'Knowledge Utilization', value: '76.3%', color: '#6B7280', icon: BookOpen },
]

const STATUS_DISTRIBUTION = [
  { label: 'Active', count: 16, color: '#06B6D4' },
  { label: 'Idle', count: 4, color: '#6B7280' },
  { label: 'Paused', count: 1, color: '#9CA3AF' },
  { label: 'Standby', count: 1, color: '#6B7280' },
  { label: 'Error', count: 0, color: '#FFC107' },
  { label: 'Offline', count: 4, color: '#4B5563' },
]

// ─── Network Activity Data ──────────────────────────────────────────────────

const NETWORK_ACTIVITY_DATA = [12, 18, 15, 22, 28, 35, 42, 38, 45, 52, 48, 55, 50, 47, 42, 38, 44, 50, 53, 48, 35, 28, 20, 15]

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
      {/* Animated gradient border effect */}
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
              <div key={m.label} className="rounded-lg p-3" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
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
                    {/* Shimmer effect */}
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
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-slate-400 text-[10px]">Agent Uptime</span>
            <span className="text-cyan-400 font-bold text-xs" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.4)', animation: 'pulseGlow 2s ease-in-out infinite' }}>99.7%</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
            <Activity className="w-3 h-3" style={{ color: '#06B6D4' }} />
            <span className="text-slate-400 text-[10px]">Active Connections</span>
            <span className="font-bold text-xs" style={{ color: '#06B6D4' }}>55</span>
            {/* Spark line */}
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
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
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
      className="rounded-xl p-4 sm:p-6"
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
        className="max-h-64 overflow-y-auto space-y-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
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
          @keyframes flowDash {
            to { stroke-dashoffset: -20; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
        <div className="activity-scroll max-h-64 overflow-y-auto space-y-0">
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
        {/* Column headers */}
        <div className="grid gap-0" style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}>
          <div />
          {GROUP_ABBREVIATIONS.map((abbr, i) => (
            <div key={abbr} className="text-center py-1.5">
              <span className="text-[8px] font-bold" style={{ color: GROUP_COLORS[i] }}>{abbr}</span>
            </div>
          ))}
        </div>
        {/* Rows */}
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
      {/* Legend */}
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
  // Node positions for the flow diagram
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
        {/* Edges */}
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

          // Arrow
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

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Glow */}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 3}
              fill={`${node.color}10`}
              stroke={node.color}
              strokeWidth="0.3"
              strokeOpacity="0.2"
            />
            {/* CoT root node pulse animation */}
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
            {/* Main circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={`${node.color}18`}
              stroke={node.color}
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            {/* Label */}
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
        {/* Column headers */}
        <div className="grid gap-0" style={{ gridTemplateColumns: '64px repeat(8, 1fr)' }}>
          <div />
          {GROUP_ABBREVIATIONS.map((abbr, i) => (
            <div key={abbr} className="text-center py-2">
              <span className="text-[8px] font-bold" style={{ color: GROUP_COLORS[i] }}>{abbr}</span>
            </div>
          ))}
        </div>
        {/* Rows */}
        {CONNECTION_HEATMAP_DATA.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-0 border-b border-white/[0.03]"
            style={{ gridTemplateColumns: '64px repeat(8, 1fr)' }}
          >
            {/* Row header */}
            <div className="flex items-center pr-2 py-2">
              <span className="text-[8px] font-bold truncate" style={{ color: GROUP_COLORS[rowIdx] }}>
                {GROUP_ABBREVIATIONS[rowIdx]}
              </span>
            </div>
            {/* Cells */}
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
                        // Diagonal: diamond shape for internal sync
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
                        // Off-diagonal: circle dot
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
                      {/* Count label inside larger dots */}
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
      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-slate-500">Connection density:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full"
            style={{ width: 6, height: 6, background: '#06B6D4', opacity: 0.5 }}
          />
          <span className="text-[8px] text-slate-500">1-2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full"
            style={{ width: 10, height: 10, background: '#06B6D4', opacity: 0.7 }}
          />
          <span className="text-[8px] text-slate-500">3-5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full"
            style={{ width: 14, height: 14, background: '#06B6D4', opacity: 0.9 }}
          />
          <span className="text-[8px] text-slate-500">6+</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              x="2"
              y="2"
              width="6"
              height="6"
              rx="1"
              fill="#06B6D4"
              fillOpacity="0.7"
              stroke="#06B6D4"
              strokeWidth="0.5"
              strokeOpacity="0.6"
              transform="rotate(45 5 5)"
            />
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

  // Map group name to color from ROLE_GROUPS
  const getGroupColor = (groupName: string): string => {
    const group = ROLE_GROUPS.find(g => g.name === groupName)
    return group?.color || '#94a3b8'
  }

  // Donut chart calculations
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
      {/* Section header */}
      <h3 className="text-white font-semibold text-xs mb-5 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
        <BarChart3 className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
        Agent Performance
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Top Performers Bar Chart */}
        <div className="lg:col-span-2">
          <p className="text-[10px] text-[#B0B0B0] mb-3 font-medium uppercase tracking-wider">Top Performers</p>
          <div className="space-y-2.5">
            {TOP_PERFORMERS.map((agent, i) => {
              const barColor = getGroupColor(agent.group)
              const width = barWidths[i]
              return (
                <div key={agent.name} className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-medium w-24 sm:w-28 truncate text-right flex-shrink-0"
                    style={{ color: barColor }}
                  >
                    {agent.name}
                  </span>
                  <div className="flex-1 h-5 rounded-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
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

        {/* Right: Donut Chart */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-[#B0B0B0] mb-3 font-medium uppercase tracking-wider">Status Distribution</p>
          <div className="relative">
            <svg width="140" height="140" viewBox="0 0 140 140">
              {/* Background ring */}
              <circle
                cx="70"
                cy="70"
                r={donutRadius}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={donutStroke}
              />
              {/* Segments */}
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
              {/* Center text */}
              <text
                x="70"
                y="65"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontSize="18"
                fontWeight="700"
              >
                {totalAgents}
              </text>
              <text
                x="70"
                y="80"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#B0B0B0"
                fontSize="7"
              >
                agents
              </text>
            </svg>
          </div>
          {/* Legend */}
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

      {/* Performance Metrics Grid */}
      <div className="mt-5">
        <p className="text-[10px] text-[#B0B0B0] mb-3 font-medium uppercase tracking-wider">Performance Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PERFORMANCE_METRICS.map((metric) => {
            const MetricIcon = metric.icon
            return (
              <div
                key={metric.label}
                className="rounded-lg p-3 relative overflow-hidden"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: `1px solid rgba(51, 51, 51, 0.4)`,
                }}
              >
                {/* Colored left accent */}
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
                  {/* Sparkline for Avg Response Time */}
                  {metric.sparkline && (
                    <svg width="40" height="14" className="flex-shrink-0">
                      <polyline
                        points="0,10 5,8 10,11 15,6 20,9 25,4 30,7 35,3 40,5"
                        fill="none"
                        stroke={metric.color}
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    </svg>
                  )}
                  {/* Trend up arrow for Tasks Completed */}
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
  const data = NETWORK_ACTIVITY_DATA
  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  // Chart dimensions
  const chartW = 500
  const chartH = 120
  const padX = 30
  const padY = 10
  const plotW = chartW - padX - 10
  const plotH = chartH - padY * 2

  // Convert data point to SVG coordinates
  const toX = (i: number) => padX + (i / (data.length - 1)) * plotW
  const toY = (v: number) => padY + plotH - ((v - minVal) / range) * plotH

  // Build area path
  const linePoints = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaPath = `M${toX(0)},${chartH - padY} ` +
    data.map((v, i) => `L${toX(i)},${toY(v)}`).join(' ') +
    ` L${toX(data.length - 1)},${chartH - padY} Z`

  // Find peak positions (top 3 values)
  const indexed = data.map((v, i) => ({ v, i }))
  const peaks = indexed.sort((a, b) => b.v - a.v).slice(0, 3)

  // Average (used for display in summary stats: 36.5)
  const _average = data.reduce((sum, v) => sum + v, 0) / data.length

  // Grid lines at 25%, 50%, 75%
  const gridLevels = [0.25, 0.5, 0.75]

  // X-axis labels every 4 hours
  const xLabels = [0, 4, 8, 12, 16, 20]

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
        viewBox="0 0 500 120"
        className="w-full"
        style={{ minHeight: '100px' }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(6,182,212,0.15)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.02)" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLevels.map((level, i) => {
          const y = padY + plotH * (1 - level)
          return (
            <line
              key={i}
              x1={padX}
              y1={y}
              x2={chartW - 10}
              y2={y}
              stroke="#333333"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line stroke */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
        />

        {/* X-axis labels */}
        {xLabels.map((hour) => (
          <text
            key={hour}
            x={toX(hour)}
            y={chartH - 1}
            textAnchor="middle"
            fill="#B0B0B0"
            fontSize="7"
            opacity="0.6"
          >
            {hour}h
          </text>
        ))}

        {/* Peak dots with pulse animation */}
        {peaks.map((peak, i) => (
          <g key={i}>
            {/* Pulse ring */}
            <circle
              cx={toX(peak.i)}
              cy={toY(peak.v)}
              r="4"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            >
              <animate attributeName="r" from="4" to="10" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="strokeOpacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Dot */}
            <circle
              cx={toX(peak.i)}
              cy={toY(peak.v)}
              r="2.5"
              fill="#06B6D4"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            >
              <title>{`${peak.i}h: ${peak.v} activities`}</title>
            </circle>
          </g>
        ))}

        {/* Hover areas with tooltip for all points */}
        {data.map((v, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(v)}
            r="8"
            fill="transparent"
            stroke="none"
          >
            <title>{`${i}h: ${v} activities`}</title>
          </circle>
        ))}
      </svg>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-4 mt-3">
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
          <TrendingUp size={11} style={{ color: '#06B6D4' }} />
          <span className="text-[9px] text-[#B0B0B0]">Peak</span>
          <span className="text-[10px] font-bold" style={{ color: '#06B6D4' }}>55 at 11h</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
          <BarChart3 size={11} style={{ color: '#06B6D4' }} />
          <span className="text-[9px] text-[#B0B0B0]">Average</span>
          <span className="text-[10px] font-bold" style={{ color: '#06B6D4' }}>36.5</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: 'rgba(13, 13, 13, 0.8)' }}>
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
    { label: 'Toggle Theme', icon: Palette, onClick: handleToggleTheme },
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
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

// ─── Color Preview Modal ──────────────────────────────────────────────────────

const COLOR_PREVIEW_SCHEMES = [
  {
    id: 'current-blue',
    name: 'A: Current Blue',
    accent: '#4A90E2',
    light: '#6BB6FF',
    dim: '#3A7BD5',
    muted: '#2A5B9E',
    groups: ['#6BB6FF', '#4A90E2', '#3A7BD5', '#2A5B9E', '#1E3A5F', '#B0B0B0', '#888888', '#666666'],
    statuses: [
      { label: 'Active', color: '#4A90E2' },
      { label: 'Idle', color: '#B0B0B0' },
      { label: 'Error', color: '#FFC107' },
      { label: 'Paused', color: '#888888' },
      { label: 'Standby', color: '#777777' },
      { label: 'Offline', color: '#555555' },
    ],
    edges: [
      { label: 'Command', color: '#4A90E2' },
      { label: 'Sync', color: '#777777' },
      { label: 'Twin', color: '#888888' },
      { label: 'Delegate', color: '#999999' },
    ],
    recommended: false,
  },
  {
    id: 'dark-blue',
    name: 'B: Dark Blue',
    accent: '#2563EB',
    light: '#3B82F6',
    dim: '#1D4ED8',
    muted: '#1E40AF',
    groups: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#172554', '#B0B0B0', '#888888', '#666666'],
    statuses: [
      { label: 'Active', color: '#2563EB' },
      { label: 'Idle', color: '#B0B0B0' },
      { label: 'Error', color: '#FFC107' },
      { label: 'Paused', color: '#888888' },
      { label: 'Standby', color: '#777777' },
      { label: 'Offline', color: '#555555' },
    ],
    edges: [
      { label: 'Command', color: '#2563EB' },
      { label: 'Sync', color: '#777777' },
      { label: 'Twin', color: '#888888' },
      { label: 'Delegate', color: '#999999' },
    ],
    recommended: false,
  },
  {
    id: 'cyan',
    name: 'C: Cyan (Active)',
    accent: '#06B6D4',
    light: '#67E8F9',
    dim: '#0891B2',
    muted: '#0E7490',
    groups: ['#67E8F9', '#22D3EE', '#06B6D4', '#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63'],
    statuses: [
      { label: 'Active', color: '#06B6D4' },
      { label: 'Idle', color: '#6B7280' },
      { label: 'Error', color: '#FFC107' },
      { label: 'Paused', color: '#9CA3AF' },
      { label: 'Standby', color: '#6B7280' },
      { label: 'Offline', color: '#4B5563' },
    ],
    edges: [
      { label: 'Command', color: '#06B6D4' },
      { label: 'Sync', color: '#64748B' },
      { label: 'Twin', color: '#22D3EE' },
      { label: 'Delegate', color: '#0891B2' },
    ],
    recommended: true,
  },
]

const PREVIEW_GROUP_NAMES = ['Стратегия', 'Тактика', 'Контроль', 'Исполнение', 'Память', 'Мониторинг', 'Коммуникация', 'Обучение']
const PREVIEW_FORMULA_NAMES = ['CoT', 'ToT', 'ReAct', 'MoA', 'DSPy', 'Reflexion']
const PREVIEW_FORMULA_COLORS = ['#999999', '#888888', '#999999', '#777777', '#888888', '#999999']

function ColorPreviewModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 min-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5" style={{ color: '#B0B0B0' }} />
            <h2 className="text-white text-lg font-bold tracking-wide">Color Scheme Comparison</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(176,176,176,0.1)', color: '#B0B0B0', border: '1px solid rgba(176,176,176,0.2)' }}>Monochrome Redesign</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#B0B0B0' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COLOR_PREVIEW_SCHEMES.map((scheme) => (
            <div
              key={scheme.id}
              className="rounded-xl p-4 relative"
              style={{
                background: 'rgba(26,26,26,0.92)',
                border: scheme.recommended
                  ? `1.5px solid ${scheme.accent}66`
                  : '1px solid rgba(51,51,51,0.5)',
                boxShadow: scheme.recommended
                  ? `0 0 30px ${scheme.accent}15, inset 0 0 30px ${scheme.accent}08`
                  : 'none',
              }}
            >
              {/* Recommended badge */}
              {scheme.recommended && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
                  style={{
                    background: scheme.accent,
                    color: '#000000',
                    boxShadow: `0 0 12px ${scheme.accent}44`,
                  }}
                >
                  Recommended
                </div>
              )}

              {/* Scheme Name */}
              <div className="text-center mb-4 mt-1">
                <span className="text-sm font-bold" style={{ color: scheme.accent }}>{scheme.name}</span>
              </div>

              {/* a) Header Bar */}
              <div
                className="rounded-lg p-3 mb-3 flex items-center gap-2"
                style={{ background: 'rgba(13,13,13,0.8)', borderLeft: `2px solid ${scheme.accent}` }}
              >
                <Brain className="w-4 h-4" style={{ color: scheme.accent }} />
                <span className="text-white font-bold text-sm">P-MAS</span>
                <span className="text-[9px]" style={{ color: scheme.accent }}>Multi-Agent System</span>
              </div>

              {/* b) Stat Cards Row */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { label: 'Agents', value: '26' },
                  { label: 'Groups', value: '8' },
                  { label: 'Formulas', value: '20' },
                  { label: 'Active', value: '16' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md p-1.5 text-center"
                    style={{ background: 'rgba(13,13,13,0.8)', borderLeft: `2px solid ${scheme.accent}` }}
                  >
                    <div className="text-[10px] font-bold" style={{ color: scheme.accent }}>{stat.value}</div>
                    <div className="text-[7px] text-[#B0B0B0]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* c) Group Labels Row */}
              <div className="mb-3">
                <div className="text-[8px] text-[#B0B0B0] uppercase tracking-wider mb-1.5 font-medium">Groups</div>
                <div className="flex flex-wrap gap-1">
                  {PREVIEW_GROUP_NAMES.map((name, i) => (
                    <div
                      key={name}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5"
                      style={{ background: `${scheme.groups[i]}15`, border: `1px solid ${scheme.groups[i]}33` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: scheme.groups[i] }} />
                      <span className="text-[7px] font-medium" style={{ color: scheme.groups[i] }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* d) Formula Badges Row */}
              <div className="mb-3">
                <div className="text-[8px] text-[#B0B0B0] uppercase tracking-wider mb-1.5 font-medium">Formulas</div>
                <div className="flex flex-wrap gap-1">
                  {PREVIEW_FORMULA_NAMES.map((name, i) => (
                    <span
                      key={name}
                      className="rounded px-1.5 py-0.5 text-[7px] font-medium"
                      style={{
                        background: `${PREVIEW_FORMULA_COLORS[i]}15`,
                        border: `1px solid ${PREVIEW_FORMULA_COLORS[i]}33`,
                        color: PREVIEW_FORMULA_COLORS[i],
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* e) Status Indicators */}
              <div className="mb-3">
                <div className="text-[8px] text-[#B0B0B0] uppercase tracking-wider mb-1.5 font-medium">Statuses</div>
                <div className="flex flex-wrap gap-2">
                  {scheme.statuses.map((status) => (
                    <div key={status.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: status.color }} />
                      <span className="text-[8px]" style={{ color: status.color }}>{status.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* f) Edge Samples */}
              <div className="mb-3">
                <div className="text-[8px] text-[#B0B0B0] uppercase tracking-wider mb-1.5 font-medium">Edges</div>
                <div className="flex flex-wrap gap-2">
                  {scheme.edges.map((edge) => (
                    <div key={edge.label} className="flex items-center gap-1.5">
                      <svg width="24" height="4">
                        <line x1="0" y1="2" x2="24" y2="2" stroke={edge.color} strokeWidth="1.5" />
                      </svg>
                      <span className="text-[8px]" style={{ color: edge.color }}>{edge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* g) Progress Bar */}
              <div className="mb-3">
                <div className="text-[8px] text-[#B0B0B0] uppercase tracking-wider mb-1.5 font-medium">Performance</div>
                <div className="space-y-1">
                  {[
                    { label: 'Arkhitektor', pct: 96 },
                    { label: 'Koordinator', pct: 94 },
                    { label: 'Revizor', pct: 91 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-[7px] w-16 text-right" style={{ color: scheme.accent }}>{item.label}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.pct}%`,
                            background: `linear-gradient(90deg, ${scheme.accent}44, ${scheme.accent}aa)`,
                          }}
                        />
                      </div>
                      <span className="text-[7px] w-5 text-right" style={{ color: scheme.accent }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* h) Accent Swatch Bar */}
              <div>
                <div className="text-[8px] text-[#B0B0B0] uppercase tracking-wider mb-1.5 font-medium">Accent Shades</div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'Light', color: scheme.light },
                    { label: 'Accent', color: scheme.accent },
                    { label: 'Dim', color: scheme.dim },
                    { label: 'Muted', color: scheme.muted },
                  ].map((swatch) => (
                    <div key={swatch.label} className="text-center">
                      <div
                        className="h-8 rounded-md mb-0.5"
                        style={{ background: swatch.color, boxShadow: `0 0 8px ${swatch.color}33` }}
                      />
                      <div className="text-[7px] font-mono" style={{ color: swatch.color }}>{swatch.color}</div>
                      <div className="text-[6px] text-[#666666]">{swatch.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-[#666666]">Compare monochrome schemes side by side. Only the accent color and its shades change; formulas stay gray, statuses use accent for active + warning yellow for errors.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Panel ──────────────────────────────────────────────────────────

function DashboardPanel({ onOpenHierarchy }: { onOpenHierarchy: () => void }) {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showColorPreview, setShowColorPreview] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      setShowScrollTop(window.scrollY > scrollHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000000', scrollBehavior: 'smooth' }}>
      <style>{`html { scroll-behavior: smooth; }`}</style>
      {/* Header */}
      <header
        className="px-4 sm:px-6 py-4 border-b border-white/5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(103,232,249,0.05), rgba(6,182,212,0.04), rgba(14,116,144,0.03))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 12s ease infinite',
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
              <Brain className="w-5 h-5" style={{ color: '#06B6D4' }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <h1 className="text-white font-bold text-lg tracking-wide">P-MAS</h1>
                {/* Glowing green pulse dot */}
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: '#06B6D4' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: '#06B6D4' }}
                  />
                </span>
              </div>
              <p className="text-slate-500 text-xs">Prompt-based Multi-Agent System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPreview(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
              style={{
                background: 'rgba(155, 155, 155, 0.1)',
                border: '1px solid rgba(155, 155, 155, 0.25)',
                color: '#B0B0B0',
              }}
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Preview Colors</span>
            </button>
            <button
              onClick={onOpenHierarchy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
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
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto w-full">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3 sm:p-4 transition-all hover:scale-[1.02] relative overflow-hidden"
              style={{
                background: `rgba(${stat.colorRgb}, 0.06)`,
                border: `1px solid rgba(${stat.colorRgb}, 0.15)`,
                boxShadow: `0 0 0 rgba(${stat.colorRgb}, 0)`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 20px rgba(${stat.colorRgb}, 0.15)` }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 0 rgba(${stat.colorRgb}, 0)` }}
            >
              {/* Colored left bar */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-l-xl"
                style={{ width: 3, background: stat.color, opacity: 0.6 }}
              />
              <p className="text-xl sm:text-2xl font-bold ml-2" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-slate-400 text-[10px] sm:text-xs mt-1 ml-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Role Groups Grid */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-cyan-500" />
          Role Groups (8)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ROLE_GROUPS.map((group) => {
            const GroupIcon = group.icon
            return (
              <div
                key={group.name}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: `rgba(${group.colorRgb}, 0.04)`,
                  border: `1px solid rgba(${group.colorRgb}, 0.18)`,
                  transform: 'translateY(0px)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0px)' }}
              >
                {/* Gradient accent bar */}
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
                        className="text-[8px] px-1.5 py-0.5 rounded"
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

        {/* Prompting Formulas Taxonomy */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gray-500" />
          Prompting Formulas Taxonomy (20)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {FORMULA_TAXONOMY.map((category) => (
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
                    className="rounded-lg p-2 flex items-center gap-2"
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

        {/* Formula Flow Diagram */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-cyan-400" />
          Formula Flow Diagram
        </h2>
        <div className="mb-8">
          <FormulaFlowDiagram />
        </div>

        {/* Edge Types */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-cyan-500" />
          Edge Types (6)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {EDGE_TYPES.map((edge) => {
            const EdgeIcon = edge.icon
            return (
              <div
                key={edge.name}
                className="rounded-xl p-4 text-center"
                style={{
                  background: `rgba(${hexToRgb(edge.color)}, 0.06)`,
                  border: `1px solid rgba(${hexToRgb(edge.color)}, 0.18)`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{
                    background: `rgba(${hexToRgb(edge.color)}, 0.12)`,
                  }}
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

        {/* Connection Heatmap */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
          Connection Heatmap
        </h2>
        <div className="mb-8">
          <ConnectionHeatmap />
        </div>

        {/* Architecture Overview */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-cyan-500" />
          Architecture Overview
        </h2>
        <div
          className="rounded-xl p-6 mb-6 overflow-x-auto"
          style={{
            background: 'rgba(45, 45, 45, 0.3)',
            border: '1px solid rgba(51, 51, 51, 0.5)',
          }}
        >
          <pre
            className="text-[10px] sm:text-xs leading-relaxed font-mono whitespace-pre"
            style={{ color: '#94a3b8' }}
          >
{`[Стратегия] --broadcast--> [Тактика] --delegate--> [Исполнение]
     |                           |                        ^
     v                           v                        |
[Мониторинг] <--supervise-- [Контроль]                   |
     |                           |                        |
     v                           v                        |
[Память] <---sync---- [Коммуникация] ----delegate------->+
     |
     v
[Обучение]`}
          </pre>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="text-[9px] text-slate-500">Connections:</span>
            {[
              { label: '--broadcast-->', color: '#0E7490' },
              { label: '--delegate-->', color: '#0891B2' },
              { label: '<--supervise--', color: '#475569' },
              { label: '<---sync----', color: '#64748B' },
              { label: '----delegate--->', color: '#0891B2' },
            ].map((conn) => (
              <span key={conn.label} className="text-[9px] font-mono" style={{ color: conn.color }}>
                {conn.label}
              </span>
            ))}
          </div>
        </div>

        {/* System Health Monitor */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-cyan-500" />
          System Health
        </h2>
        <div className="mb-6">
          <SystemHealthMonitor />
        </div>

        {/* Agent Performance */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
          Agent Performance
        </h2>
        <div className="mb-6">
          <AgentPerformance />
        </div>

        {/* Network Activity Chart */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
          Network Activity
        </h2>
        <div className="mb-6">
          <NetworkActivityChart />
        </div>

        {/* Recent Activity Timeline + Formula-Agent Mapping side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <RecentActivityTimeline />
          <FormulaAgentMappingGrid />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActionsPanel />
        </div>

        {/* Open Hierarchy button */}
        <div className="flex gap-3">
          <button
            onClick={onOpenHierarchy}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.01]"
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
        <div className="max-w-7xl mx-auto">
          {/* Desktop: 3 columns, Mobile: single column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left: Logo + version */}
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Brain size={14} style={{ color: '#06B6D4' }} />
              <span className="text-[11px] font-bold" style={{ color: '#FFFFFF' }}>P-MAS Dashboard v5.0</span>
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>-- Monochrome Cyan</span>
            </div>

            {/* Center: Key stats */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>26 Agents</span>
              <span style={{ color: '#333333' }}>|</span>
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>8 Groups</span>
              <span style={{ color: '#333333' }}>|</span>
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>20 Formulas</span>
              <span style={{ color: '#333333' }}>|</span>
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>6 Edges</span>
            </div>

            {/* Right: Tech stack */}
            <div className="text-center md:text-right">
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>Powered by Next.js 16 + Prisma + TypeScript</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
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
      {showColorPreview && <ColorPreviewModal onClose={() => setShowColorPreview(false)} />}
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255,255,255'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}
