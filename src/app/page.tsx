'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Brain, Target, Shield, Zap, Database, Activity, Network, Sparkles, ArrowRight, ArrowLeftRight, Diamond, Eye, Megaphone, Workflow, ChevronRight, TrendingUp, TrendingDown, Cpu, HardDrive, Wifi, ArrowUp } from 'lucide-react'

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
  { name: 'Стратегия', label: 'Strategy', color: '#f59e0b', colorRgb: '245,158,11', icon: Brain, agents: 3, formulas: 'ToT, CoVe, GoT', desc: 'Strategic planning, analysis, vision', statusSummary: [{ color: '#22c55e', label: '3 active' }] },
  { name: 'Тактика', label: 'Tactics', color: '#10b981', colorRgb: '16,185,129', icon: Target, agents: 3, formulas: 'ReWOO, ReAct, SelfConsistency', desc: 'Coordination, planning, communication', statusSummary: [{ color: '#22c55e', label: '2 active' }, { color: '#eab308', label: '1 idle' }] },
  { name: 'Контроль', label: 'Control', color: '#f43f5e', colorRgb: '244,63,94', icon: Shield, agents: 3, formulas: 'Reflexion, CoVe, ReAct', desc: 'Quality, evaluation, safety', statusSummary: [{ color: '#22c55e', label: '3 active' }] },
  { name: 'Исполнение', label: 'Execution', color: '#06b6d4', colorRgb: '6,182,212', icon: Zap, agents: 5, formulas: 'ReAct, MoA, SelfRefine, PoT', desc: 'Task execution, coding, testing', statusSummary: [{ color: '#22c55e', label: '4 active' }, { color: '#eab308', label: '1 idle' }] },
  { name: 'Память', label: 'Memory / Knowledge', color: '#8b5cf6', colorRgb: '139,92,246', icon: Database, agents: 3, formulas: 'CoT, AoT, SoT', desc: 'Knowledge base, RAG, context management', statusSummary: [{ color: '#22c55e', label: '2 active' }, { color: '#6366f1', label: '1 standby' }] },
  { name: 'Мониторинг', label: 'Monitoring', color: '#14b8a6', colorRgb: '20,184,166', icon: Activity, agents: 3, formulas: 'CoT, LATS, GoT', desc: 'Observation, alerting, diagnostics', statusSummary: [{ color: '#22c55e', label: '2 active' }, { color: '#f97316', label: '1 paused' }] },
  { name: 'Коммуникация', label: 'Communication', color: '#ec4899', colorRgb: '236,72,153', icon: Network, agents: 3, formulas: 'PromptChaining, StepBack, PlanAndSolve', desc: 'Inter-agent messaging, routing, protocol translation', statusSummary: [{ color: '#22c55e', label: '2 active' }, { color: '#eab308', label: '1 idle' }] },
  { name: 'Обучение', label: 'Learning / Training', color: '#f97316', colorRgb: '249,115,22', icon: Sparkles, agents: 3, formulas: 'DSPy, MetaCoT, LeastToMost', desc: 'Fine-tuning, feedback loops, skill acquisition', statusSummary: [{ color: '#22c55e', label: '2 active' }, { color: '#eab308', label: '1 idle' }] },
]

const FORMULA_TAXONOMY = [
  {
    category: 'Foundational',
    formulas: [
      { name: 'CoT', full: 'Chain of Thought', color: '#94a3b8' },
      { name: 'ToT', full: 'Tree of Thoughts', color: '#f59e0b' },
      { name: 'GoT', full: 'Graph of Thoughts', color: '#eab308' },
      { name: 'AoT', full: 'Algorithm of Thoughts', color: '#a78bfa' },
      { name: 'SoT', full: 'Skeleton of Thought', color: '#fb923c' },
    ],
  },
  {
    category: 'Verification',
    formulas: [
      { name: 'CoVe', full: 'Chain of Verification', color: '#8b5cf6' },
      { name: 'Reflexion', full: 'Self-Reflection', color: '#f43f5e' },
      { name: 'SelfConsistency', full: 'Self-Consistency', color: '#c084fc' },
      { name: 'SelfRefine', full: 'Self-Refine', color: '#38bdf8' },
    ],
  },
  {
    category: 'Planning',
    formulas: [
      { name: 'ReWOO', full: 'Research w/o Observation', color: '#10b981' },
      { name: 'ReAct', full: 'Reasoning + Action', color: '#06b6d4' },
      { name: 'PromptChaining', full: 'Prompt Chaining', color: '#34d399' },
      { name: 'PlanAndSolve', full: 'Plan-and-Solve', color: '#a3e635' },
      { name: 'StepBack', full: 'Step-Back Prompting', color: '#f472b6' },
      { name: 'LeastToMost', full: 'Least-to-Most', color: '#fb923c' },
    ],
  },
  {
    category: 'Advanced',
    formulas: [
      { name: 'MoA', full: 'Mixture of Agents', color: '#ec4899' },
      { name: 'LATS', full: 'Lang Agent Tree Search', color: '#4ade80' },
      { name: 'PoT', full: 'Program of Thought', color: '#f472b6' },
      { name: 'DSPy', full: 'Declarative Self-Improving', color: '#22d3ee' },
      { name: 'MetaCoT', full: 'Meta Chain of Thought', color: '#c084fc' },
    ],
  },
]

const EDGE_TYPES = [
  { name: 'Command', desc: 'Parent to child directive', color: '#f59e0b', style: 'solid', icon: ArrowRight },
  { name: 'Sync', desc: 'Peer synchronization', color: '#64748b', style: 'dotted', icon: ArrowLeftRight },
  { name: 'Twin', desc: 'Mirror agent link', color: '#06b6d4', style: 'dashed', icon: Diamond },
  { name: 'Delegate', desc: 'Task delegation', color: '#8b5cf6', style: 'dash-dot', icon: Workflow },
  { name: 'Supervise', desc: 'Oversight feedback', color: '#14b8a6', style: 'fine dot', icon: Eye },
  { name: 'Broadcast', desc: 'One-to-many signal', color: '#f97316', style: 'long dash', icon: Megaphone },
]

const QUICK_STATS = [
  { label: 'Total Agents', value: '26', color: '#22d3ee', colorRgb: '6,182,212' },
  { label: 'Role Groups', value: '8', color: '#f59e0b', colorRgb: '245,158,11' },
  { label: 'Cognitive Formulas', value: '20', color: '#8b5cf6', colorRgb: '139,92,246' },
  { label: 'Edge Types', value: '6', color: '#10b981', colorRgb: '16,185,129' },
  { label: 'Active Agents', value: '16', color: '#22c55e', colorRgb: '34,197,94' },
  { label: 'Idle Agents', value: '4', color: '#eab308', colorRgb: '234,179,8' },
  { label: 'Tasks', value: '26', color: '#0ea5e9', colorRgb: '14,165,233' },
  { label: 'Formulas Coverage', value: '100%', color: '#f43f5e', colorRgb: '244,63,94' },
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
const GROUP_COLORS = ['#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#8b5cf6', '#14b8a6', '#ec4899', '#f97316']

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
    { label: 'CPU Usage', value: 34, color: '#22d3ee', width: cpuWidth, icon: Cpu },
    { label: 'Memory Usage', value: 67, color: '#f59e0b', width: memWidth, icon: HardDrive },
    { label: 'Network I/O', value: 23, color: '#10b981', width: netWidth, icon: Wifi },
  ]

  return (
    <div
      className="rounded-xl p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Animated gradient border effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.03), rgba(139,92,246,0.03), rgba(16,185,129,0.03))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />

      <div className="relative z-10">
        <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          System Health Monitor
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {metrics.map((m) => {
            const MetricIcon = m.icon
            return (
              <div key={m.label} className="rounded-lg p-3" style={{ background: 'rgba(10, 14, 26, 0.6)' }}>
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
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(10, 14, 26, 0.6)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-slate-400 text-[10px]">Agent Uptime</span>
            <span className="text-green-400 font-bold text-xs" style={{ textShadow: '0 0 8px rgba(34, 197, 94, 0.4)', animation: 'pulseGlow 2s ease-in-out infinite' }}>99.7%</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(10, 14, 26, 0.6)' }}>
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400 text-[10px]">Active Connections</span>
            <span className="text-cyan-400 font-bold text-xs">55</span>
            {/* Spark line */}
            <svg width="32" height="12" className="ml-1">
              <polyline
                points="0,8 4,6 8,9 12,4 16,7 20,3 24,5 28,2 32,6"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1"
                opacity="0.6"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(10, 14, 26, 0.6)' }}>
            <TrendingDown className="w-3 h-3 text-green-400" />
            <span className="text-slate-400 text-[10px]">Error Rate</span>
            <span className="text-green-400 font-bold text-xs">0.3%</span>
            <TrendingDown className="w-2.5 h-2.5 text-green-400" />
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
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
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
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Network className="w-3.5 h-3.5 text-violet-400" />
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
    { id: 'CoT', x: 60, y: 30, color: '#94a3b8' },
    { id: 'ToT', x: 170, y: 30, color: '#f59e0b' },
    { id: 'GoT', x: 280, y: 30, color: '#eab308' },
    { id: 'MetaCoT', x: 60, y: 90, color: '#c084fc' },
    { id: 'AoT', x: 280, y: 90, color: '#a78bfa' },
    { id: 'SoT', x: 390, y: 90, color: '#fb923c' },
    { id: 'CoVe', x: 60, y: 150, color: '#8b5cf6' },
    { id: 'Reflexion', x: 170, y: 150, color: '#f43f5e' },
    { id: 'SelfConsistency', x: 280, y: 150, color: '#c084fc' },
    { id: 'SelfRefine', x: 390, y: 150, color: '#38bdf8' },
    { id: 'ReAct', x: 60, y: 210, color: '#06b6d4' },
    { id: 'ReWOO', x: 170, y: 210, color: '#10b981' },
    { id: 'PromptChaining', x: 280, y: 210, color: '#34d399' },
    { id: 'PlanAndSolve', x: 390, y: 210, color: '#a3e635' },
    { id: 'PoT', x: 60, y: 270, color: '#f472b6' },
    { id: 'StepBack', x: 170, y: 270, color: '#f472b6' },
    { id: 'LeastToMost', x: 280, y: 270, color: '#fb923c' },
    { id: 'DSPy', x: 60, y: 330, color: '#22d3ee' },
    { id: 'MoA', x: 170, y: 330, color: '#ec4899' },
    { id: 'LATS', x: 280, y: 330, color: '#4ade80' },
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
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h3 className="text-white font-semibold text-xs mb-4 flex items-center gap-2">
        <Workflow className="w-3.5 h-3.5 text-amber-400" />
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
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1.5"
              />
              <polygon
                points={`${endX},${endY} ${ax1},${ay1} ${ax2},${ay2}`}
                fill="rgba(148, 163, 184, 0.3)"
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

// ─── Dashboard Panel ──────────────────────────────────────────────────────────

function DashboardPanel({ onOpenHierarchy }: { onOpenHierarchy: () => void }) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      setShowScrollTop(window.scrollY > scrollHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0e1a', scrollBehavior: 'smooth' }}>
      <style>{`html { scroll-behavior: smooth; }`}</style>
      {/* Header */}
      <header
        className="px-4 sm:px-6 py-4 border-b border-white/5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(139,92,246,0.03), rgba(16,185,129,0.02))',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 12s ease infinite',
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-600/20 border border-cyan-500/30 relative">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <h1 className="text-white font-bold text-lg tracking-wide">P-MAS</h1>
                {/* Glowing green pulse dot */}
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: '#22c55e' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: '#22c55e' }}
                  />
                </span>
              </div>
              <p className="text-slate-500 text-xs">Prompt-based Multi-Agent System</p>
            </div>
          </div>
          <button
            onClick={onOpenHierarchy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: '#22d3ee',
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
          <span className="w-1 h-4 rounded-full bg-amber-500" />
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
          <span className="w-1 h-4 rounded-full bg-purple-500" />
          Prompting Formulas Taxonomy (20)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {FORMULA_TAXONOMY.map((category) => (
            <div
              key={category.category}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
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
          <span className="w-1 h-4 rounded-full bg-amber-400" />
          Formula Flow Diagram
        </h2>
        <div className="mb-8">
          <FormulaFlowDiagram />
        </div>

        {/* Edge Types */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-emerald-500" />
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

        {/* Architecture Overview */}
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-rose-500" />
          Architecture Overview
        </h2>
        <div
          className="rounded-xl p-6 mb-6 overflow-x-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
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
              { label: '--broadcast-->', color: '#f97316' },
              { label: '--delegate-->', color: '#8b5cf6' },
              { label: '<--supervise--', color: '#14b8a6' },
              { label: '<---sync----', color: '#64748b' },
              { label: '----delegate--->', color: '#8b5cf6' },
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

        {/* Recent Activity Timeline + Formula-Agent Mapping side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <RecentActivityTimeline />
          <FormulaAgentMappingGrid />
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <button
            onClick={onOpenHierarchy}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.04))',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#22d3ee',
            }}
          >
            <ChevronRight className="w-4 h-4" />
            Open Hierarchy Visualization
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-4 sm:px-6 py-4 border-t border-white/5">
        <p className="text-center text-slate-600 text-xs">P-MAS Dashboard v3.2 -- 8 Groups / 20 Formulas / 6 Edge Types / 26 Agents</p>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#22d3ee',
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
