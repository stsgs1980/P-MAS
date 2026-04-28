'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Workflow, Play, Eye, ChevronDown, ChevronRight, Clock,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Zap,
  ArrowRight, Cpu, Shield, RefreshCw, MessageSquare,
  Timer, GitBranch, Radio, Calendar, Hand, Sparkles,
  X, Settings2, ArrowLeftRight, Gauge, ArrowLeft,
  Search, Trash2, Plus, Network, ChevronLeft, Activity,
  Database, Target, RotateCcw, FileJson, AlertCircle,
  LayoutDashboard, Beaker, CornerDownLeft, CheckCircle,
  CircleDot, ArrowUpRight
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithRetry } from '@/lib/client-fetch'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string
  order: number
  name: string
  agentId: string | null
  roleGroup: string | null
  action: 'process' | 'review' | 'transform' | 'delegate' | 'broadcast' | 'decision'
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  condition: Record<string, any>
  fallbackStepId: string | null
  timeout: number
  retryPolicy: Record<string, any>
  config: Record<string, any>
}

interface WorkflowStats {
  totalExecutions: number
  completedExecutions: number
  runningExecutions: number
  failedExecutions: number
  successRate: number
}

interface RecentExecution {
  id: string
  status: string
  startedAt: string | null
  completedAt: string | null
}

interface WorkflowData {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  triggerType: 'manual' | 'event' | 'schedule' | 'webhook' | 'agent'
  triggerConfig: Record<string, any>
  version: number
  tags: string[]
  stepCount: number
  steps: WorkflowStep[]
  stats: WorkflowStats
  recentExecutions: RecentExecution[]
}

interface StepExecution {
  id: string
  stepId: string
  agentId: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_feedback'
  inputData: string
  outputData: string
  error: string | null
  startedAt: string | null
  completedAt: string | null
  messages: AgentMessage[]
}

interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string
  type: 'request' | 'response' | 'feedback' | 'error' | 'status' | 'context_update'
  content: string
  metadata: string
  timestamp: string
}

interface ExecutionData {
  id: string
  workflowId: string
  status: string
  taskContext: string
  input: string
  output: string
  error: string | null
  startedAt: string | null
  completedAt: string | null
  steps: StepExecution[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkflowPipelineProps {
  fullPage?: boolean
  onBack?: () => void
  onOpenHierarchy?: () => void
}

// ─── Role Groups for Create Dialog ────────────────────────────────────────────

const ROLE_GROUP_OPTIONS = [
  'Стратегия',
  'Тактика',
  'Контроль',
  'Исполнение',
  'Память',
  'Мониторинг',
  'Коммуникация',
  'Обучение',
]

const ACTION_OPTIONS: WorkflowStep['action'][] = [
  'process',
  'review',
  'transform',
  'delegate',
  'broadcast',
  'decision',
]

// ─── Color Constants ──────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  process: '#06B6D4',
  review: '#EAB308',
  transform: '#22D3EE',
  delegate: '#0891B2',
  broadcast: '#0E7490',
  decision: '#155E75',
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22C55E',
  running: '#06B6D4',
  failed: '#EF4444',
  waiting_feedback: '#EAB308',
  skipped: '#64748B',
  pending: '#475569',
}

const TRIGGER_ICONS: Record<string, any> = {
  manual: Hand,
  event: Zap,
  schedule: Calendar,
  webhook: Radio,
  agent: Cpu,
}

const ACTION_ICONS: Record<string, any> = {
  process: Cpu,
  review: Shield,
  transform: RefreshCw,
  delegate: GitBranch,
  broadcast: Radio,
  decision: Sparkles,
}

const WORKFLOW_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'rgba(71,85,105,0.15)', text: '#64748B', label: 'Draft' },
  active: { bg: 'rgba(6,182,212,0.15)', text: '#06B6D4', label: 'Active' },
  paused: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308', label: 'Paused' },
  archived: { bg: 'rgba(107,114,128,0.15)', text: '#6B7280', label: 'Archived' },
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function safeJsonParse(str: string | null | undefined, fallback: any = {}): any {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function successRateColor(rate: number): string {
  if (rate >= 80) return '#22C55E'
  if (rate >= 60) return '#EAB308'
  return '#EF4444'
}

// ─── Mini Pipeline Visualization (for cards) ──────────────────────────────────

function MiniPipeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="flex items-center gap-0.5 overflow-hidden">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
            style={{
              background: ACTION_COLORS[step.action] || '#475569',
              boxShadow: `0 0 4px ${ACTION_COLORS[step.action]}44`,
            }}
            title={`${step.name} (${step.action})`}
          />
          {i < steps.length - 1 && (
            <div
              className="w-3 h-px flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Pipeline Step Node ───────────────────────────────────────────────────────

function PipelineStepNode({
  step,
  execStatus,
  isAnimating,
  isHighlighted,
  onClick,
}: {
  step: WorkflowStep
  execStatus?: string
  isAnimating?: boolean
  isHighlighted?: boolean
  onClick?: () => void
}) {
  const actionColor = ACTION_COLORS[step.action] || '#475569'
  const statusColor = execStatus ? (STATUS_COLORS[execStatus] || '#475569') : actionColor
  const ActionIcon = ACTION_ICONS[step.action] || Cpu

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all duration-300 hover:scale-105 min-w-[90px] max-w-[120px] text-left"
      style={{
        background: isHighlighted ? `${statusColor}15` : 'rgba(13,13,13,0.8)',
        border: `1px solid ${isHighlighted ? `${statusColor}40` : 'rgba(51,51,51,0.4)'}`,
        boxShadow: isAnimating ? `0 0 12px ${statusColor}40` : isHighlighted ? `0 0 8px ${statusColor}20` : 'none',
      }}
    >
      {isAnimating && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            border: `1.5px solid ${statusColor}`,
            animation: 'pulseRing 1.5s ease-out infinite',
          }}
        />
      )}

      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${actionColor}20` }}
      >
        <ActionIcon size={12} style={{ color: actionColor }} />
      </div>

      <span
        className="text-[9px] font-medium text-center leading-tight truncate w-full"
        style={{ color: isHighlighted ? statusColor : '#B0B0B0' }}
      >
        {step.name}
      </span>

      {step.roleGroup && (
        <span
          className="text-[7px] px-1 py-0.5 rounded font-medium"
          style={{ background: `${actionColor}15`, color: actionColor }}
        >
          {step.roleGroup}
        </span>
      )}

      <div className="flex items-center gap-0.5">
        <Timer size={7} style={{ color: '#64748B' }} />
        <span className="text-[7px]" style={{ color: '#64748B' }}>{step.timeout}s</span>
      </div>

      {execStatus && (
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: STATUS_COLORS[execStatus],
            boxShadow: `0 0 4px ${STATUS_COLORS[execStatus]}44`,
          }}
        />
      )}
    </button>
  )
}

// ─── Pipeline Arrow ───────────────────────────────────────────────────────────

function PipelineArrow({ color = 'rgba(255,255,255,0.1)', animated = false }: { color?: string; animated?: boolean }) {
  return (
    <div className="flex items-center flex-shrink-0 mx-1">
      <svg width="20" height="12" viewBox="0 0 20 12">
        <line
          x1="0" y1="6" x2="14" y2="6"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={animated ? '4 3' : 'none'}
        >
          {animated && (
            <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="0.5s" repeatCount="indefinite" />
          )}
        </line>
        <polygon points="14,2 20,6 14,10" fill={color} />
      </svg>
    </div>
  )
}

// ─── Feedback Loop Arrow (curved, dashed, amber) ────────────────────────────

function FeedbackLoopArrow({
  fromIndex,
  toIndex,
  stepWidth,
  isActive,
}: {
  fromIndex: number
  toIndex: number
  stepWidth: number
  isActive?: boolean
}) {
  const gap = 20 // arrow width
  const fromX = fromIndex * (stepWidth + gap) + stepWidth / 2
  const toX = toIndex * (stepWidth + gap) + stepWidth / 2
  const curveHeight = 50
  const midX = (fromX + toX) / 2

  const pathD = `M ${fromX} -5 C ${fromX} ${-curveHeight}, ${toX} ${-curveHeight}, ${toX} -5`

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: `${fromX + stepWidth / 2 + 10}px`,
        height: `${curveHeight + 20}px`,
        transform: `translateY(-${curveHeight + 10}px)`,
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id={`feedback-arrow-${fromIndex}-${toIndex}`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0,0 6,3 0,6" fill="#EAB308" />
        </marker>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="#EAB308"
        strokeWidth="1.5"
        strokeDasharray="6 3"
        markerEnd={`url(#feedback-arrow-${fromIndex}-${toIndex})`}
        style={{
          animation: isActive ? 'feedbackPulse 1s ease-in-out infinite' : 'none',
          opacity: isActive ? 1 : 0.7,
        }}
      />
      <text
        x={midX}
        y={-curveHeight + 5}
        textAnchor="middle"
        fill="#EAB308"
        fontSize="8"
        fontWeight="600"
        style={{ opacity: 0.9 }}
      >
        feedback
      </text>
    </svg>
  )
}

// ─── Data Contract Card ──────────────────────────────────────────────────────

function DataContractCard({
  prevStep,
  nextStep,
  stepIndex,
}: {
  prevStep: WorkflowStep
  nextStep: WorkflowStep
  stepIndex: number
}) {
  const [expanded, setExpanded] = useState(false)

  const prevOutput = prevStep.outputSchema || {}
  const nextInput = nextStep.inputSchema || {}
  const prevHasSchema = Object.keys(prevOutput).length > 0
  const nextHasSchema = Object.keys(nextInput).length > 0

  // Simple compatibility check: if both have schemas, see if output properties overlap with input
  let compatible: 'yes' | 'maybe' | 'no' = 'maybe'
  if (prevHasSchema && nextHasSchema) {
    const outProps = prevOutput.properties ? Object.keys(prevOutput.properties) : []
    const inProps = nextInput.properties ? Object.keys(nextInput.properties) : []
    const overlap = outProps.filter((p: string) => inProps.includes(p))
    if (overlap.length > 0) compatible = 'yes'
    else if (outProps.length > 0 && inProps.length > 0) compatible = 'no'
  } else if (prevHasSchema || nextHasSchema) {
    compatible = 'maybe'
  }

  const compatColor = compatible === 'yes' ? '#22C55E' : compatible === 'no' ? '#EF4444' : '#EAB308'
  const CompatIcon = compatible === 'yes' ? CheckCircle2 : compatible === 'no' ? AlertCircle : AlertTriangle

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(13,13,13,0.8)',
        border: `1px solid rgba(51,51,51,0.4)`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.02]"
      >
        <ArrowRight size={10} style={{ color: '#475569' }} />
        <span className="text-[9px] font-medium" style={{ color: '#64748B' }}>
          Step {stepIndex} → Step {stepIndex + 1}
        </span>
        <CompatIcon size={10} style={{ color: compatColor }} />
        <span className="text-[8px]" style={{ color: compatColor }}>
          {compatible === 'yes' ? 'Compatible' : compatible === 'no' ? 'Incompatible' : 'Unknown'}
        </span>
        <ChevronDown
          size={10}
          style={{ color: '#475569', marginLeft: 'auto' }}
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Previous step output */}
          <div>
            <span className="text-[8px] font-bold uppercase" style={{ color: ACTION_COLORS[prevStep.action] }}>
              {prevStep.name} Output
            </span>
            <pre
              className="text-[7px] mt-1 p-2 rounded overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#8B8B8B' }}
            >
              {JSON.stringify(prevOutput, null, 2).substring(0, 400)}
            </pre>
          </div>
          {/* Next step input */}
          <div>
            <span className="text-[8px] font-bold uppercase" style={{ color: ACTION_COLORS[nextStep.action] }}>
              {nextStep.name} Input
            </span>
            <pre
              className="text-[7px] mt-1 p-2 rounded overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.3)', color: '#8B8B8B' }}
            >
              {JSON.stringify(nextInput, null, 2).substring(0, 400)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Task Context Timeline ───────────────────────────────────────────────────

function TaskContextTimeline({ taskContextStr }: { taskContextStr: string }) {
  const [expanded, setExpanded] = useState(true)
  const ctx = safeJsonParse(taskContextStr, {})
  const history: any[] = ctx._history || []

  if (history.length === 0) {
    return (
      <div
        className="rounded-lg p-3"
        style={{ background: 'rgba(13,13,13,0.8)', border: '1px solid rgba(51,51,51,0.3)' }}
      >
        <span className="text-[9px]" style={{ color: '#475569' }}>No task context history</span>
      </div>
    )
  }

  // Detect feedback loops
  const feedbackEntries = history.filter((h: any) => h.status === 'feedback_requested')

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'rgba(13,13,13,0.8)', border: '1px solid rgba(51,51,51,0.3)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ borderBottom: expanded ? '1px solid rgba(51,51,51,0.3)' : 'none' }}
      >
        <FileJson size={12} style={{ color: '#06B6D4' }} />
        <span className="text-[10px] font-semibold" style={{ color: '#06B6D4' }}>
          Task Context
        </span>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}
        >
          {history.length} entries
        </span>
        {feedbackEntries.length > 0 && (
          <span
            className="text-[8px] px-1.5 py-0.5 rounded flex items-center gap-1"
            style={{ background: 'rgba(234,179,8,0.12)', color: '#EAB308' }}
          >
            <CornerDownLeft size={8} />
            {feedbackEntries.length} feedback
          </span>
        )}
        <ChevronDown
          size={10}
          style={{ color: '#475569', marginLeft: 'auto' }}
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 py-3 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <div className="relative">
            {/* Timeline vertical line */}
            <div
              className="absolute left-[7px] top-2 bottom-2 w-px"
              style={{ background: 'rgba(51,51,51,0.5)' }}
            />

            {history.map((entry: any, i: number) => {
              const isFeedback = entry.status === 'feedback_requested'
              const statusColor = isFeedback ? '#EAB308' : STATUS_COLORS.completed
              const isLastEntry = i === history.length - 1

              return (
                <div key={i} className="relative flex items-start gap-3 pb-4">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{
                        background: `${statusColor}20`,
                        border: `1.5px solid ${statusColor}`,
                        boxShadow: isFeedback ? `0 0 8px ${statusColor}40` : 'none',
                      }}
                    >
                      {isFeedback ? (
                        <CornerDownLeft size={7} style={{ color: statusColor }} />
                      ) : (
                        <CheckCircle size={7} style={{ color: statusColor }} />
                      )}
                    </div>
                  </div>

                  {/* Entry content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold" style={{ color: statusColor }}>
                        {entry.step}
                      </span>
                      {entry.agent && (
                        <span className="text-[8px]" style={{ color: '#64748B' }}>
                          by {entry.agent}
                        </span>
                      )}
                      <span
                        className="text-[7px] px-1 py-0.5 rounded font-medium"
                        style={{
                          background: `${ACTION_COLORS[entry.action] || '#475569'}15`,
                          color: ACTION_COLORS[entry.action] || '#475569',
                        }}
                      >
                        {entry.action}
                      </span>
                      <span
                        className="text-[7px] px-1 py-0.5 rounded font-bold uppercase"
                        style={{
                          background: `${statusColor}15`,
                          color: statusColor,
                        }}
                      >
                        {entry.status}
                      </span>
                    </div>
                    {entry.timestamp && (
                      <span className="text-[7px]" style={{ color: '#3F3F46' }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                    {/* Feedback arrow to previous step */}
                    {isFeedback && i > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight size={8} style={{ color: '#EAB308' }} />
                        <span className="text-[7px]" style={{ color: '#EAB308' }}>
                          Feedback loop → back to previous step
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Execution Modal ──────────────────────────────────────────────────────────

function ExecutionModal({
  execution,
  workflow,
  onClose,
}: {
  execution: ExecutionData | null
  workflow: WorkflowData | null
  onClose: () => void
}) {
  const [animatingStep, setAnimatingStep] = useState(-1)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [showMessages, setShowMessages] = useState<string | null>(null)

  useEffect(() => {
    if (!execution || !workflow) return

    const stepCount = execution.steps.length
    let current = 0

    const interval = setInterval(() => {
      if (current < stepCount) {
        setAnimatingStep(current)
        setVisibleSteps(current + 1)
        current++
      } else {
        setAnimatingStep(-1)
        clearInterval(interval)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [execution, workflow])

  if (!execution || !workflow) return null

  const finalStatus = execution.status
  const isCompleted = finalStatus === 'completed'
  const isFailed = finalStatus === 'failed'

  // Find feedback loops in steps
  const feedbackLoops = workflow.steps
    .map((step, i) => ({ step, index: i }))
    .filter(({ step }) => step.fallbackStepId)

  const hasActiveFeedback = execution.steps.some(s => s.status === 'waiting_feedback')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(51,51,51,0.5)',
          boxShadow: `0 0 40px ${isCompleted ? 'rgba(34,197,94,0.1)' : isFailed ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)'}`,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(51,51,51,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${isCompleted ? '#22C55E' : isFailed ? '#EF4444' : '#06B6D4'}20` }}
            >
              {isCompleted ? (
                <CheckCircle2 size={16} style={{ color: '#22C55E' }} />
              ) : isFailed ? (
                <XCircle size={16} style={{ color: '#EF4444' }} />
              ) : (
                <Loader2 size={16} className="animate-spin" style={{ color: '#06B6D4' }} />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{workflow.name}</h3>
              <p className="text-[10px]" style={{ color: '#64748B' }}>
                Execution {execution.id.substring(0, 8)} &middot;{' '}
                {formatDuration(execution.startedAt, execution.completedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(51,51,51,0.3)', border: '1px solid rgba(51,51,51,0.4)' }}
          >
            <X size={14} style={{ color: '#888' }} />
          </button>
        </div>

        {/* Pipeline Visualization */}
        <div className="px-6 py-5 overflow-x-auto relative">
          <div className="flex items-center gap-0 min-w-max pb-4 relative">
            {workflow.steps.map((step, i) => {
              const stepExec = execution.steps[i]
              const execStatus = stepExec?.status
              const isThisAnimating = animatingStep === i
              const isRevealed = i < visibleSteps

              if (!isRevealed) {
                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className="w-[90px] h-[80px] rounded-lg opacity-20"
                      style={{ background: 'rgba(51,51,51,0.2)', border: '1px dashed rgba(51,51,51,0.3)' }}
                    />
                    {i < workflow.steps.length - 1 && <PipelineArrow />}
                  </div>
                )
              }

              return (
                <div key={step.id} className="flex items-center">
                  <PipelineStepNode
                    step={step}
                    execStatus={execStatus}
                    isAnimating={isThisAnimating}
                    isHighlighted={!!execStatus && execStatus !== 'pending'}
                    onClick={() => stepExec && setShowMessages(stepExec.id)}
                  />
                  {i < workflow.steps.length - 1 && (
                    <PipelineArrow
                      color={
                        execStatus === 'completed'
                          ? STATUS_COLORS.completed
                          : isThisAnimating
                            ? STATUS_COLORS.running
                            : 'rgba(255,255,255,0.1)'
                      }
                      animated={isThisAnimating || execStatus === 'running'}
                    />
                  )}
                </div>
              )
            })}

            {/* Feedback loop arrows */}
            {feedbackLoops.map(({ step, index }) => {
              const fallbackIdx = workflow.steps.findIndex(s => s.id === step.fallbackStepId)
              if (fallbackIdx < 0) return null
              const isActive = execution.steps[index]?.status === 'waiting_feedback'
              return (
                <FeedbackLoopArrow
                  key={`feedback-${step.id}`}
                  fromIndex={index}
                  toIndex={fallbackIdx}
                  stepWidth={90}
                  isActive={isActive || hasActiveFeedback}
                />
              )
            })}
          </div>
        </div>

        {/* Task Context Timeline */}
        <div className="px-6 pb-3">
          <TaskContextTimeline taskContextStr={execution.taskContext} />
        </div>

        {/* Step Details & Messages */}
        <div className="px-6 pb-6">
          {/* Execution status bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
            style={{
              background: `${isCompleted ? '#22C55E' : isFailed ? '#EF4444' : '#06B6D4'}08`,
              border: `1px solid ${isCompleted ? '#22C55E' : isFailed ? '#EF4444' : '#06B6D4'}20`,
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: isCompleted ? '#22C55E' : isFailed ? '#EF4444' : '#06B6D4' }}
            >
              {finalStatus}
            </span>
            <span className="text-[10px]" style={{ color: '#64748B' }}>
              {execution.steps.filter(s => s.status === 'completed').length}/{execution.steps.length} steps completed
            </span>
            {execution.steps.some(s => s.status === 'waiting_feedback') && (
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#EAB30815', color: '#EAB308' }}>
                Feedback loop triggered
              </span>
            )}
          </div>

          {/* Step execution details */}
          <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {execution.steps.map((stepExec, i) => {
              const step = workflow.steps[i]
              if (!step) return null
              const stepColor = STATUS_COLORS[stepExec.status] || '#475569'
              const isExpanded = showMessages === stepExec.id

              return (
                <div
                  key={stepExec.id}
                  className="rounded-lg transition-colors duration-200"
                  style={{
                    background: 'rgba(13,13,13,0.8)',
                    border: `1px solid ${stepColor}20`,
                  }}
                >
                  <button
                    onClick={() => setShowMessages(isExpanded ? null : stepExec.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: stepColor, boxShadow: `0 0 4px ${stepColor}44` }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: stepColor }}>
                      Step {i + 1}
                    </span>
                    <span className="text-[10px] font-medium text-white flex-1 truncate">
                      {step.name}
                    </span>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: `${ACTION_COLORS[step.action]}15`, color: ACTION_COLORS[step.action] }}
                    >
                      {step.action}
                    </span>
                    <span className="text-[9px]" style={{ color: '#64748B' }}>
                      {stepExec.startedAt && stepExec.completedAt
                        ? formatDuration(stepExec.startedAt, stepExec.completedAt)
                        : '—'}
                    </span>
                    <ChevronDown
                      size={12}
                      style={{ color: '#64748B' }}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {stepExec.messages.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          {stepExec.messages.map((msg) => {
                            const msgContent = safeJsonParse(msg.content)
                            const msgColor =
                              msg.type === 'request' ? '#06B6D4' :
                              msg.type === 'response' ? '#22C55E' :
                              msg.type === 'feedback' ? '#EAB308' :
                              msg.type === 'error' ? '#EF4444' :
                              '#64748B'

                            return (
                              <div
                                key={msg.id}
                                className="flex items-start gap-2 px-2 py-1.5 rounded"
                                style={{ background: `${msgColor}08` }}
                              >
                                <MessageSquare size={9} style={{ color: msgColor, marginTop: 2 }} className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold uppercase" style={{ color: msgColor }}>
                                      {msg.type}
                                    </span>
                                    <span className="text-[7px]" style={{ color: '#4B5563' }}>
                                      {msg.fromAgentId.substring(0, 8)} → {msg.toAgentId?.substring(0, 8) || 'all'}
                                    </span>
                                  </div>
                                  <p className="text-[9px] mt-0.5 leading-relaxed" style={{ color: '#B0B0B0' }}>
                                    {typeof msgContent === 'object' ? JSON.stringify(msgContent, null, 0).substring(0, 200) : String(msgContent).substring(0, 200)}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {stepExec.outputData && stepExec.outputData !== '{}' && (
                        <div className="mt-2">
                          <span className="text-[8px] font-bold uppercase" style={{ color: '#64748B' }}>Output</span>
                          <pre
                            className="text-[8px] mt-1 p-2 rounded overflow-x-auto"
                            style={{ background: 'rgba(0,0,0,0.3)', color: '#8B8B8B' }}
                          >
                            {JSON.stringify(safeJsonParse(stepExec.outputData), null, 2).substring(0, 500)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Expanded Pipeline View ───────────────────────────────────────────────────

function ExpandedPipelineView({
  workflow,
  onRun,
  running,
}: {
  workflow: WorkflowData
  onRun: () => void
  running: boolean
}) {
  const [showDataContracts, setShowDataContracts] = useState(false)

  // Find feedback loops
  const feedbackLoops = workflow.steps
    .map((step, i) => ({ step, index: i }))
    .filter(({ step }) => step.fallbackStepId)

  return (
    <div
      className="rounded-xl p-4 sm:p-6 mt-3 overflow-x-auto"
      style={{
        background: 'rgba(45,45,45,0.3)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold text-xs flex items-center gap-2">
          <Workflow size={12} style={{ color: '#06B6D4' }} />
          Pipeline Steps
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDataContracts(!showDataContracts)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: showDataContracts ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showDataContracts ? 'rgba(6,182,212,0.3)' : 'rgba(51,51,51,0.4)'}`,
              color: showDataContracts ? '#06B6D4' : '#64748B',
            }}
          >
            <FileJson size={10} />
            Data Contracts
          </button>
          <button
            onClick={onRun}
            disabled={running || workflow.status === 'draft'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(6,182,212,0.15)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4',
            }}
          >
            {running ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
            {running ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
      </div>

      {/* Pipeline horizontal flow */}
      <div className="relative">
        <div className="flex items-center gap-0 min-w-max pb-2">
          {workflow.steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <PipelineStepNode step={step} />
              {i < workflow.steps.length - 1 && <PipelineArrow />}
            </div>
          ))}
        </div>

        {/* Feedback loop arrows */}
        {feedbackLoops.map(({ step, index }) => {
          const fallbackIdx = workflow.steps.findIndex(s => s.id === step.fallbackStepId)
          if (fallbackIdx < 0) return null
          return (
            <FeedbackLoopArrow
              key={`feedback-${step.id}`}
              fromIndex={index}
              toIndex={fallbackIdx}
              stepWidth={90}
            />
          )
        })}
      </div>

      {/* Data Contracts Section */}
      {showDataContracts && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(51,51,51,0.3)' }}>
          <h5 className="text-white font-semibold text-[10px] mb-3 flex items-center gap-1.5">
            <FileJson size={10} style={{ color: '#06B6D4' }} />
            Data Contracts
          </h5>
          <div className="space-y-2">
            {workflow.steps.map((step, i) => {
              if (i === workflow.steps.length - 1) return null
              const nextStep = workflow.steps[i + 1]
              return (
                <DataContractCard
                  key={`contract-${i}`}
                  prevStep={step}
                  nextStep={nextStep}
                  stepIndex={i + 1}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Action type legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(51,51,51,0.3)' }}>
        {Object.entries(ACTION_COLORS).map(([action, color]) => {
          const Icon = ACTION_ICONS[action]
          return (
            <div key={action} className="flex items-center gap-1.5">
              <Icon size={9} style={{ color }} />
              <span className="text-[8px] capitalize" style={{ color }}>{action}</span>
            </div>
          )
        })}
        {feedbackLoops.length > 0 && (
          <div className="flex items-center gap-1.5">
            <CornerDownLeft size={9} style={{ color: '#EAB308' }} />
            <span className="text-[8px]" style={{ color: '#EAB308' }}>feedback</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Execution History ────────────────────────────────────────────────────────

function ExecutionHistory({
  executions,
  workflowId,
  onViewDetails,
}: {
  executions: RecentExecution[]
  workflowId: string
  onViewDetails: (workflowId: string, execId: string) => void
}) {
  if (executions.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-[10px]" style={{ color: '#475569' }}>No executions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
      {executions.map((exec) => {
        const statusColor = STATUS_COLORS[exec.status] || '#475569'
        return (
          <button
            key={exec.id}
            onClick={() => onViewDetails(workflowId, exec.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.03] text-left"
            style={{ background: 'rgba(13,13,13,0.6)' }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}44` }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: statusColor }}
            >
              {exec.status}
            </span>
            <span className="text-[9px] flex-1 text-right" style={{ color: '#64748B' }}>
              {formatTime(exec.startedAt)}
            </span>
            <span className="text-[8px]" style={{ color: '#475569' }}>
              {exec.id.substring(0, 6)}
            </span>
            <Eye size={10} style={{ color: '#475569' }} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  workflowName,
  onConfirm,
  onCancel,
}: {
  workflowName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 0 40px rgba(239,68,68,0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)' }}
          >
            <AlertTriangle size={20} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Delete Workflow</h3>
            <p className="text-[10px]" style={{ color: '#64748B' }}>This action cannot be undone</p>
          </div>
        </div>
        <p className="text-[11px] mb-5" style={{ color: '#B0B0B0' }}>
          Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{workflowName}&rdquo;</span>?
          All associated steps and execution history will be permanently removed.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-[10px] font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(51,51,51,0.4)',
              color: '#64748B',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-[10px] font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Trash2 size={10} />
              Delete
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Workflow Dialog ───────────────────────────────────────────────────

function CreateWorkflowDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<WorkflowData['triggerType']>('manual')
  const [tagsStr, setTagsStr] = useState('')
  const [steps, setSteps] = useState<Array<{
    name: string
    roleGroup: string
    action: WorkflowStep['action']
    timeout: number
  }>>([
    { name: '', roleGroup: ROLE_GROUP_OPTIONS[0], action: 'process', timeout: 300 },
  ])
  const [saving, setSaving] = useState(false)

  const addStep = () => {
    setSteps([...steps, { name: '', roleGroup: ROLE_GROUP_OPTIONS[0], action: 'process', timeout: 300 }])
  }

  const removeStep = (index: number) => {
    if (steps.length <= 1) return
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Workflow name is required')
      return
    }
    if (steps.some(s => !s.name.trim())) {
      toast.error('All steps must have a name')
      return
    }

    setSaving(true)
    try {
      const res = await fetchWithRetry('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          triggerType,
          tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
          steps: steps.map((s, i) => ({
            order: i,
            name: s.name.trim(),
            roleGroup: s.roleGroup,
            action: s.action,
            timeout: s.timeout,
          })),
        }),
      })

      if (res.ok) {
        toast.success('Workflow created successfully')
        onCreated()
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create workflow')
      }
    } catch {
      toast.error('Failed to create workflow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: '#0A0A0A',
          border: '1px solid rgba(51,51,51,0.5)',
          boxShadow: '0 0 40px rgba(6,182,212,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(51,51,51,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.15)' }}
            >
              <Plus size={16} style={{ color: '#06B6D4' }} />
            </div>
            <h3 className="text-white font-semibold text-sm">New Workflow</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(51,51,51,0.3)', border: '1px solid rgba(51,51,51,0.4)' }}
          >
            <X size={14} style={{ color: '#888' }} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748B' }}>
              Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Development Pipeline"
              className="w-full px-3 py-2 rounded-md text-[11px] text-white outline-none transition-all duration-200"
              style={{
                background: 'rgba(13,13,13,0.8)',
                border: '1px solid rgba(51,51,51,0.4)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(51,51,51,0.4)'}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748B' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={2}
              className="w-full px-3 py-2 rounded-md text-[11px] text-white outline-none resize-none transition-all duration-200"
              style={{
                background: 'rgba(13,13,13,0.8)',
                border: '1px solid rgba(51,51,51,0.4)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(51,51,51,0.4)'}
            />
          </div>

          {/* Trigger Type + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748B' }}>
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as WorkflowData['triggerType'])}
                className="w-full px-3 py-2 rounded-md text-[11px] text-white outline-none"
                style={{
                  background: 'rgba(13,13,13,0.8)',
                  border: '1px solid rgba(51,51,51,0.4)',
                }}
              >
                <option value="manual">Manual</option>
                <option value="event">Event</option>
                <option value="schedule">Schedule</option>
                <option value="webhook">Webhook</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: '#64748B' }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="e.g. core, development"
                className="w-full px-3 py-2 rounded-md text-[11px] text-white outline-none transition-all duration-200"
                style={{
                  background: 'rgba(13,13,13,0.8)',
                  border: '1px solid rgba(51,51,51,0.4)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(51,51,51,0.4)'}
              />
            </div>
          </div>

          {/* Pipeline Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>
                Pipeline Steps
              </label>
              <button
                onClick={addStep}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(6,182,212,0.12)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  color: '#06B6D4',
                }}
              >
                <Plus size={9} />
                Add Step
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{
                    background: 'rgba(13,13,13,0.6)',
                    border: '1px solid rgba(51,51,51,0.3)',
                  }}
                >
                  {/* Step number */}
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                    style={{ background: 'rgba(6,182,212,0.15)', color: '#06B6D4' }}
                  >
                    {i + 1}
                  </div>

                  {/* Step fields */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(i, 'name', e.target.value)}
                      placeholder="Step name"
                      className="px-2 py-1.5 rounded-md text-[10px] text-white outline-none col-span-2 sm:col-span-1"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(51,51,51,0.3)',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(51,51,51,0.3)'}
                    />
                    <select
                      value={step.roleGroup}
                      onChange={(e) => updateStep(i, 'roleGroup', e.target.value)}
                      className="px-2 py-1.5 rounded-md text-[10px] text-white outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(51,51,51,0.3)',
                      }}
                    >
                      {ROLE_GROUP_OPTIONS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <select
                      value={step.action}
                      onChange={(e) => updateStep(i, 'action', e.target.value)}
                      className="px-2 py-1.5 rounded-md text-[10px] text-white outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(51,51,51,0.3)',
                      }}
                    >
                      {ACTION_OPTIONS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={step.timeout}
                        onChange={(e) => updateStep(i, 'timeout', parseInt(e.target.value) || 300)}
                        className="px-2 py-1.5 rounded-md text-[10px] text-white outline-none w-16"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(51,51,51,0.3)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.3)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(51,51,51,0.3)'}
                      />
                      <span className="text-[8px]" style={{ color: '#475569' }}>sec</span>
                    </div>
                  </div>

                  {/* Remove step */}
                  <button
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Trash2 size={10} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4"
          style={{ background: '#0A0A0A', borderTop: '1px solid rgba(51,51,51,0.3)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-[10px] font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(51,51,51,0.4)',
              color: '#64748B',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-md text-[10px] font-bold transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(6,182,212,0.15)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4',
            }}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={10} />
                Create Workflow
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Workflow Card ────────────────────────────────────────────────────────────

function WorkflowCard({
  workflow,
  isExpanded,
  onToggle,
  onRun,
  onViewHistory,
  onDelete,
  running,
}: {
  workflow: WorkflowData
  isExpanded: boolean
  onToggle: () => void
  onRun: () => void
  onViewHistory: (workflowId: string, execId: string) => void
  onDelete: () => void
  running: boolean
}) {
  const statusStyle = WORKFLOW_STATUS_STYLES[workflow.status] || WORKFLOW_STATUS_STYLES.draft
  const TriggerIcon = TRIGGER_ICONS[workflow.triggerType] || Hand
  const rateColor = successRateColor(workflow.stats.successRate)

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(45,45,45,0.3)',
        border: `1px solid ${isExpanded ? 'rgba(6,182,212,0.3)' : 'rgba(51,51,51,0.5)'}`,
        boxShadow: isExpanded ? '0 0 20px rgba(6,182,212,0.08)' : 'none',
      }}
    >
      {/* Card body */}
      <div className="p-4 sm:p-5">
        {/* Top row: name, status, actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-xs truncate">{workflow.name}</h3>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0"
                style={{ background: statusStyle.bg, color: statusStyle.text }}
              >
                {statusStyle.label}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: '#64748B' }}>
              {workflow.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
              title="Delete workflow"
            >
              <Trash2 size={10} style={{ color: '#EF4444' }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRun() }}
              disabled={running || workflow.status === 'draft'}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}
              title="Run workflow"
            >
              {running ? (
                <Loader2 size={11} className="animate-spin" style={{ color: '#06B6D4' }} />
              ) : (
                <Play size={11} style={{ color: '#06B6D4' }} />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle() }}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,51,51,0.4)' }}
              title="View pipeline"
            >
              {isExpanded ? (
                <ChevronDown size={11} style={{ color: '#06B6D4' }} />
              ) : (
                <Eye size={11} style={{ color: '#64748B' }} />
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <TriggerIcon size={10} style={{ color: '#0891B2' }} />
            <span className="text-[9px] capitalize" style={{ color: '#0891B2' }}>
              {workflow.triggerType}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Workflow size={10} style={{ color: '#64748B' }} />
            <span className="text-[9px]" style={{ color: '#64748B' }}>
              {workflow.stepCount} steps
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge size={10} style={{ color: rateColor }} />
            <span className="text-[9px] font-bold" style={{ color: rateColor }}>
              {workflow.stats.successRate}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings2 size={10} style={{ color: '#475569' }} />
            <span className="text-[9px]" style={{ color: '#475569' }}>
              {workflow.stats.totalExecutions} runs
            </span>
          </div>
        </div>

        {/* Mini pipeline */}
        <MiniPipeline steps={workflow.steps} />

        {/* Tags */}
        {workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {workflow.tags.map((tag) => (
              <span
                key={tag}
                className="text-[7px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(6,182,212,0.08)', color: '#0891B2', border: '1px solid rgba(6,182,212,0.1)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Expanded: recent executions */}
        {isExpanded && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(51,51,51,0.3)' }}>
            <h4 className="text-white font-semibold text-[10px] mb-2 flex items-center gap-1.5">
              <Clock size={10} style={{ color: '#64748B' }} />
              Recent Executions
            </h4>
            <ExecutionHistory
              executions={workflow.recentExecutions}
              workflowId={workflow.id}
              onViewDetails={onViewHistory}
            />
          </div>
        )}
      </div>

      {/* Expanded: pipeline visualization */}
      {isExpanded && (
        <ExpandedPipelineView
          workflow={workflow}
          onRun={onRun}
          running={running}
        />
      )}
    </div>
  )
}

// ─── Sidebar Section Helper ──────────────────────────────────────────────────

function SidebarSection({
  icon,
  title,
  count,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.02] transition-colors duration-150"
        style={{ borderLeft: '2px solid transparent' }}
      >
        {icon}
        <span className="text-[10px] font-semibold text-white flex-1">{title}</span>
        {count !== undefined && (
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-medium"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}
          >
            {count}
          </span>
        )}
        <ChevronDown
          size={10}
          style={{ color: '#475569' }}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-3 pb-2">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowPipeline({ fullPage, onBack, onOpenHierarchy }: WorkflowPipelineProps) {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [executionModal, setExecutionModal] = useState<{
    execution: ExecutionData | null
    workflow: WorkflowData | null
  }>({ execution: null, workflow: null })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowData | null>(null)
  const [seeding, setSeeding] = useState(false)

  // Full-page specific state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterTrigger, setFilterTrigger] = useState<string | null>(null)

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/workflows')
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
      }
    } catch (err) {
      console.error('[WorkflowPipeline] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  // Execute workflow
  const handleRun = useCallback(async (workflowId: string) => {
    setRunningIds(prev => new Set(prev).add(workflowId))
    toast.info('Starting workflow execution...')

    try {
      const res = await fetchWithRetry('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      })

      if (res.ok) {
        const data = await res.json()
        const wf = workflows.find(w => w.id === workflowId)
        setExecutionModal({ execution: data.execution, workflow: wf || null })
        toast.success('Workflow execution completed')
        fetchWorkflows()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Execution failed')
      }
    } catch {
      toast.error('Execution failed')
    } finally {
      setRunningIds(prev => {
        const next = new Set(prev)
        next.delete(workflowId)
        return next
      })
    }
  }, [workflows, fetchWorkflows])

  // View execution history detail
  const handleViewHistory = useCallback(async (workflowId: string, execId: string) => {
    try {
      const res = await fetchWithRetry(`/api/workflows/${workflowId}`)
      if (res.ok) {
        const data = await res.json()
        const wf = data.workflow
        const execution = wf?.executions?.find((e: any) => e.id === execId)
        if (execution) {
          const parsedExecution = {
            ...execution,
            taskContext: execution.taskContext,
            input: execution.input,
            output: execution.output,
            steps: execution.steps?.map((s: any) => ({
              ...s,
              inputData: s.inputData,
              outputData: s.outputData,
            })) || [],
          }
          setExecutionModal({ execution: parsedExecution, workflow: wf || null })
        } else {
          toast.error('Execution not found')
        }
      }
    } catch {
      toast.error('Failed to load execution details')
    }
  }, [])

  // Delete workflow
  const handleDelete = useCallback(async (workflowId: string) => {
    try {
      const res = await fetchWithRetry(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Workflow deleted')
        fetchWorkflows()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete workflow')
    } finally {
      setDeleteTarget(null)
    }
  }, [fetchWorkflows])

  // Seed demo workflows
  const handleSeed = useCallback(async () => {
    setSeeding(true)
    try {
      const res = await fetchWithRetry('/api/workflows/seed', {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Demo workflows seeded')
        fetchWorkflows()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to seed')
      }
    } catch {
      toast.error('Failed to seed demo workflows')
    } finally {
      setSeeding(false)
    }
  }, [fetchWorkflows])

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  // Filter workflows
  const filteredWorkflows = workflows.filter(wf => {
    if (filterStatus && wf.status !== filterStatus) return false
    if (filterTrigger && wf.triggerType !== filterTrigger) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const nameMatch = wf.name.toLowerCase().includes(q)
      const tagMatch = wf.tags.some(t => t.toLowerCase().includes(q))
      const descMatch = wf.description.toLowerCase().includes(q)
      if (!nameMatch && !tagMatch && !descMatch) return false
    }
    return true
  })

  // Compute stats
  const pipelineStats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    draft: workflows.filter(w => w.status === 'draft').length,
    totalSteps: workflows.reduce((acc, w) => acc + w.stepCount, 0),
    totalExecutions: workflows.reduce((acc, w) => acc + w.stats.totalExecutions, 0),
    avgSuccessRate: workflows.length > 0
      ? Math.round(workflows.reduce((acc, w) => acc + w.stats.successRate, 0) / workflows.length)
      : 0,
  }

  // ─── Full-page layout ──────────────────────────────────────────────────

  if (fullPage) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <style>{`
          @keyframes pulseRing {
            0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(6, 182, 212, 0); }
            100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
          }
          @keyframes feedbackPulse {
            0%, 100% { opacity: 0.7; stroke-width: 1.5; }
            50% { opacity: 1; stroke-width: 2.5; }
          }
        `}</style>

        <div className="max-w-[1280px] w-full h-screen flex flex-col relative overflow-hidden select-none">
          {/* Top header bar (48px) */}
          <div
            className="relative z-40 flex items-center h-12 flex-shrink-0 px-4 gap-4"
            style={{
              background: '#0D0D0D',
              borderBottom: '1px solid rgba(51,51,51,0.5)',
            }}
          >
            {/* Top cyan accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #06B6D4, transparent)' }}
            />

            {/* Left: Back + Logo + Title */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,51,51,0.4)' }}
                  title="Back to Dashboard"
                >
                  <ArrowLeft size={13} style={{ color: '#06B6D4' }} />
                </button>
              )}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}
              >
                <Cpu size={13} style={{ color: '#06B6D4' }} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold" style={{ color: '#06B6D4' }}>P-MAS</span>
                <span className="text-[9px]" style={{ color: '#475569' }}>│</span>
                <span className="text-[10px] font-medium text-white">Workflow Pipeline</span>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-xs mx-auto">
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-md text-[10px] text-white outline-none"
                  style={{
                    background: 'rgba(13,13,13,0.8)',
                    border: '1px solid rgba(51,51,51,0.4)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(51,51,51,0.4)'}
                />
              </div>
            </div>

            {/* Right: Hierarchy button + Refresh */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onOpenHierarchy && (
                <button
                  onClick={onOpenHierarchy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(51,51,51,0.4)',
                    color: '#64748B',
                  }}
                >
                  <Network size={10} />
                  Hierarchy
                </button>
              )}
              <button
                onClick={fetchWorkflows}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-180"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,51,51,0.4)' }}
                title="Refresh"
              >
                <RefreshCw size={11} style={{ color: '#64748B' }} />
              </button>
            </div>
          </div>

          {/* Content area: Sidebar + Main */}
          <div className="flex flex-1 overflow-hidden">
            {/* Collapsible Sidebar */}
            <div
              className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300 relative"
              style={{
                width: sidebarOpen ? 280 : 48,
                background: '#0D0D0D',
                borderRight: '1px solid rgba(51,51,51,0.3)',
              }}
            >
              {/* Sidebar toggle button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-1/2 -translate-y-1/2 z-20 w-5 h-8 rounded-r-md flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  right: -20,
                  background: '#0D0D0D',
                  border: '1px solid rgba(51,51,51,0.4)',
                  borderLeft: 'none',
                }}
              >
                {sidebarOpen ? (
                  <ChevronLeft size={10} style={{ color: '#06B6D4' }} />
                ) : (
                  <ChevronRight size={10} style={{ color: '#06B6D4' }} />
                )}
              </button>

              {/* Sidebar content */}
              <div className="flex-1 overflow-y-auto pt-2 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {sidebarOpen ? (
                  <>
                    {/* Pipeline Stats */}
                    <SidebarSection
                      icon={<Activity size={11} style={{ color: '#06B6D4' }} />}
                      title="Pipeline Stats"
                      count={pipelineStats.total}
                    >
                      <div className="space-y-2">
                        {[
                          { label: 'Total Workflows', value: pipelineStats.total, color: '#06B6D4' },
                          { label: 'Active', value: pipelineStats.active, color: '#22C55E' },
                          { label: 'Draft', value: pipelineStats.draft, color: '#64748B' },
                          { label: 'Total Steps', value: pipelineStats.totalSteps, color: '#0891B2' },
                          { label: 'Total Executions', value: pipelineStats.totalExecutions, color: '#0E7490' },
                          { label: 'Avg Success Rate', value: `${pipelineStats.avgSuccessRate}%`, color: successRateColor(pipelineStats.avgSuccessRate) },
                        ].map(stat => (
                          <div key={stat.label} className="flex items-center justify-between">
                            <span className="text-[9px]" style={{ color: '#64748B' }}>{stat.label}</span>
                            <span className="text-[9px] font-bold" style={{ color: stat.color }}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </SidebarSection>

                    {/* Divider */}
                    <div className="mx-3 my-2" style={{ borderTop: '1px solid rgba(51,51,51,0.2)' }} />

                    {/* Filter by Status */}
                    <SidebarSection
                      icon={<Shield size={11} style={{ color: '#06B6D4' }} />}
                      title="Filter by Status"
                    >
                      <div className="space-y-1">
                        <button
                          onClick={() => setFilterStatus(null)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] text-left transition-colors hover:bg-white/[0.02]"
                          style={{
                            background: !filterStatus ? 'rgba(6,182,212,0.1)' : 'transparent',
                            color: !filterStatus ? '#06B6D4' : '#64748B',
                            border: `1px solid ${!filterStatus ? 'rgba(6,182,212,0.2)' : 'transparent'}`,
                          }}
                        >
                          All Statuses
                        </button>
                        {Object.entries(WORKFLOW_STATUS_STYLES).map(([key, style]) => (
                          <button
                            key={key}
                            onClick={() => setFilterStatus(filterStatus === key ? null : key)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] text-left transition-colors hover:bg-white/[0.02]"
                            style={{
                              background: filterStatus === key ? `${style.text}15` : 'transparent',
                              color: filterStatus === key ? style.text : '#64748B',
                              border: `1px solid ${filterStatus === key ? `${style.text}30` : 'transparent'}`,
                            }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ background: style.text }} />
                            {style.label}
                            <span className="ml-auto" style={{ color: '#475569' }}>
                              {workflows.filter(w => w.status === key).length}
                            </span>
                          </button>
                        ))}
                      </div>
                    </SidebarSection>

                    {/* Filter by Trigger Type */}
                    <SidebarSection
                      icon={<Zap size={11} style={{ color: '#06B6D4' }} />}
                      title="Filter by Trigger"
                    >
                      <div className="space-y-1">
                        <button
                          onClick={() => setFilterTrigger(null)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] text-left transition-colors hover:bg-white/[0.02]"
                          style={{
                            background: !filterTrigger ? 'rgba(6,182,212,0.1)' : 'transparent',
                            color: !filterTrigger ? '#06B6D4' : '#64748B',
                            border: `1px solid ${!filterTrigger ? 'rgba(6,182,212,0.2)' : 'transparent'}`,
                          }}
                        >
                          All Types
                        </button>
                        {(['manual', 'event', 'schedule', 'webhook', 'agent'] as const).map(type => {
                          const Icon = TRIGGER_ICONS[type]
                          return (
                            <button
                              key={type}
                              onClick={() => setFilterTrigger(filterTrigger === type ? null : type)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] text-left transition-colors hover:bg-white/[0.02]"
                              style={{
                                background: filterTrigger === type ? 'rgba(6,182,212,0.1)' : 'transparent',
                                color: filterTrigger === type ? '#06B6D4' : '#64748B',
                                border: `1px solid ${filterTrigger === type ? 'rgba(6,182,212,0.2)' : 'transparent'}`,
                              }}
                            >
                              <Icon size={9} style={{ color: '#0891B2' }} />
                              {type}
                              <span className="ml-auto" style={{ color: '#475569' }}>
                                {workflows.filter(w => w.triggerType === type).length}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </SidebarSection>

                    {/* Divider */}
                    <div className="mx-3 my-2" style={{ borderTop: '1px solid rgba(51,51,51,0.2)' }} />

                    {/* Action Types Legend */}
                    <SidebarSection
                      icon={<Settings2 size={11} style={{ color: '#06B6D4' }} />}
                      title="Action Types"
                      defaultOpen={false}
                    >
                      <div className="space-y-1.5">
                        {Object.entries(ACTION_COLORS).map(([action, color]) => {
                          const Icon = ACTION_ICONS[action]
                          return (
                            <div key={action} className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${color}15` }}>
                                <Icon size={9} style={{ color }} />
                              </div>
                              <span className="text-[9px] capitalize" style={{ color }}>{action}</span>
                            </div>
                          )
                        })}
                      </div>
                    </SidebarSection>

                    {/* Divider */}
                    <div className="mx-3 my-2" style={{ borderTop: '1px solid rgba(51,51,51,0.2)' }} />

                    {/* Quick Actions */}
                    <SidebarSection
                      icon={<Beaker size={11} style={{ color: '#06B6D4' }} />}
                      title="Quick Actions"
                      defaultOpen={false}
                    >
                      <div className="space-y-2">
                        <button
                          onClick={handleSeed}
                          disabled={seeding}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[9px] font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'rgba(6,182,212,0.12)',
                            border: '1px solid rgba(6,182,212,0.2)',
                            color: '#06B6D4',
                          }}
                        >
                          {seeding ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Beaker size={10} />
                          )}
                          {seeding ? 'Seeding...' : 'Seed Demo Workflows'}
                        </button>
                      </div>
                    </SidebarSection>
                  </>
                ) : (
                  /* Collapsed sidebar icons */
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <button
                      onClick={fetchWorkflows}
                      className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,51,51,0.3)' }}
                      title="Refresh"
                    >
                      <RefreshCw size={11} style={{ color: '#64748B' }} />
                    </button>
                    <button
                      onClick={handleSeed}
                      disabled={seeding}
                      className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
                      title="Seed Demo Workflows"
                    >
                      {seeding ? <Loader2 size={11} className="animate-spin" style={{ color: '#06B6D4' }} /> : <Beaker size={11} style={{ color: '#06B6D4' }} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {/* Toolbar: New Workflow button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
                    <Workflow size={14} style={{ color: '#06B6D4' }} />
                    Workflows
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                      style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}
                    >
                      {filteredWorkflows.length}
                    </span>
                  </h2>
                  {(filterStatus || filterTrigger || searchQuery) && (
                    <button
                      onClick={() => { setFilterStatus(null); setFilterTrigger(null); setSearchQuery('') }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[8px] transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#EAB308' }}
                    >
                      <X size={8} />
                      Clear filters
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(6,182,212,0.15)',
                    border: '1px solid rgba(6,182,212,0.3)',
                    color: '#06B6D4',
                  }}
                >
                  <Plus size={10} />
                  New Workflow
                </button>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="rounded-lg p-4 animate-pulse"
                      style={{ background: 'rgba(13,13,13,0.8)', border: '1px solid rgba(51,51,51,0.3)' }}
                    >
                      <div className="h-3 w-2/3 rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      <div className="h-2 w-full rounded mb-1" style={{ background: 'rgba(255,255,255,0.03)' }} />
                      <div className="h-2 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    </div>
                  ))}
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow size={28} style={{ color: '#475569' }} className="mx-auto mb-3" />
                  <p className="text-[11px]" style={{ color: '#475569' }}>
                    {workflows.length === 0 ? 'No workflows found' : 'No workflows match your filters'}
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: '#3F3F46' }}>
                    {workflows.length === 0 ? 'Create workflows or seed sample data' : 'Try adjusting your filters'}
                  </p>
                  {workflows.length === 0 && (
                    <button
                      onClick={handleSeed}
                      disabled={seeding}
                      className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-md text-[10px] font-bold mx-auto transition-all duration-200 hover:scale-105 disabled:opacity-50"
                      style={{
                        background: 'rgba(6,182,212,0.15)',
                        border: '1px solid rgba(6,182,212,0.3)',
                        color: '#06B6D4',
                      }}
                    >
                      {seeding ? <Loader2 size={10} className="animate-spin" /> : <Beaker size={10} />}
                      {seeding ? 'Seeding...' : 'Seed Demo Workflows'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredWorkflows.map((wf) => (
                    <WorkflowCard
                      key={wf.id}
                      workflow={wf}
                      isExpanded={expandedId === wf.id}
                      onToggle={() => toggleExpand(wf.id)}
                      onRun={() => handleRun(wf.id)}
                      onViewHistory={(workflowId, execId) => handleViewHistory(workflowId, execId)}
                      onDelete={() => setDeleteTarget(wf)}
                      running={runningIds.has(wf.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Execution Modal */}
          {executionModal.execution && (
            <ExecutionModal
              execution={executionModal.execution}
              workflow={executionModal.workflow}
              onClose={() => setExecutionModal({ execution: null, workflow: null })}
            />
          )}

          {/* Create Workflow Dialog */}
          {showCreateDialog && (
            <CreateWorkflowDialog
              onClose={() => setShowCreateDialog(false)}
              onCreated={fetchWorkflows}
            />
          )}

          {/* Delete Confirmation */}
          {deleteTarget && (
            <DeleteConfirmDialog
              workflowName={deleteTarget.name}
              onConfirm={() => handleDelete(deleteTarget.id)}
              onCancel={() => setDeleteTarget(null)}
            />
          )}
        </div>
      </div>
    )
  }

  // ─── Embedded (dashboard card) layout ──────────────────────────────────

  // Loading state
  if (loading) {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(45,45,45,0.3)',
          border: '1px solid rgba(51,51,51,0.5)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Workflow size={14} style={{ color: '#06B6D4' }} />
          <h2 className="text-white font-semibold text-sm">Workflow Pipeline</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-lg p-4 animate-pulse"
              style={{ background: 'rgba(13,13,13,0.8)', border: '1px solid rgba(51,51,51,0.3)' }}
            >
              <div className="h-3 w-2/3 rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="h-2 w-full rounded mb-1" style={{ background: 'rgba(255,255,255,0.03)' }} />
              <div className="h-2 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 sm:p-6"
      style={{
        background: 'rgba(45,45,45,0.3)',
        border: '1px solid rgba(51,51,51,0.5)',
      }}
    >
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(6, 182, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
        @keyframes feedbackPulse {
          0%, 100% { opacity: 0.7; stroke-width: 1.5; }
          50% { opacity: 1; stroke-width: 2.5; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: '#06B6D4' }} />
          <Workflow size={14} style={{ color: '#06B6D4' }} />
          Workflow Pipeline
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}
          >
            {workflows.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(6,182,212,0.12)',
              border: '1px solid rgba(6,182,212,0.2)',
              color: '#06B6D4',
            }}
          >
            <Plus size={9} />
            New
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(51,51,51,0.4)',
              color: '#64748B',
            }}
          >
            {seeding ? <Loader2 size={9} className="animate-spin" /> : <Beaker size={9} />}
            {seeding ? 'Seeding...' : 'Seed'}
          </button>
          <button
            onClick={fetchWorkflows}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,51,51,0.4)', color: '#64748B' }}
          >
            <RefreshCw size={9} />
            Refresh
          </button>
        </div>
      </div>

      {/* Workflow cards grid */}
      {workflows.length === 0 ? (
        <div className="text-center py-8">
          <Workflow size={24} style={{ color: '#475569' }} className="mx-auto mb-2" />
          <p className="text-[11px]" style={{ color: '#475569' }}>No workflows found</p>
          <p className="text-[9px] mt-1" style={{ color: '#3F3F46' }}>Create workflows or seed sample data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              isExpanded={expandedId === wf.id}
              onToggle={() => toggleExpand(wf.id)}
              onRun={() => handleRun(wf.id)}
              onViewHistory={(workflowId, execId) => handleViewHistory(workflowId, execId)}
              onDelete={() => setDeleteTarget(wf)}
              running={runningIds.has(wf.id)}
            />
          ))}
        </div>
      )}

      {/* Execution Modal */}
      {executionModal.execution && (
        <ExecutionModal
          execution={executionModal.execution}
          workflow={executionModal.workflow}
          onClose={() => setExecutionModal({ execution: null, workflow: null })}
        />
      )}

      {/* Create Workflow Dialog */}
      {showCreateDialog && (
        <CreateWorkflowDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={fetchWorkflows}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          workflowName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
