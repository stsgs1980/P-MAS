'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Workflow, Play, Eye, ChevronDown, ChevronRight, Clock,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Zap,
  ArrowRight, Cpu, Shield, RefreshCw, MessageSquare,
  Timer, GitBranch, Radio, Calendar, Hand, Sparkles,
  X, Settings2, ArrowLeftRight, Gauge
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

// ─── Color Constants ──────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  process: '#06B6D4',
  review: '#EAB308',
  transform: '#818CF8',
  delegate: '#0891B2',
  broadcast: '#22C55E',
  decision: '#F97316',
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
      {/* Animated pulse for running state */}
      {isAnimating && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            border: `1.5px solid ${statusColor}`,
            animation: 'pulseRing 1.5s ease-out infinite',
          }}
        />
      )}

      {/* Action icon */}
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${actionColor}20` }}
      >
        <ActionIcon size={12} style={{ color: actionColor }} />
      </div>

      {/* Step name */}
      <span
        className="text-[9px] font-medium text-center leading-tight truncate w-full"
        style={{ color: isHighlighted ? statusColor : '#B0B0B0' }}
      >
        {step.name}
      </span>

      {/* Role group badge */}
      {step.roleGroup && (
        <span
          className="text-[7px] px-1 py-0.5 rounded font-medium"
          style={{ background: `${actionColor}15`, color: actionColor }}
        >
          {step.roleGroup}
        </span>
      )}

      {/* Timeout indicator */}
      <div className="flex items-center gap-0.5">
        <Timer size={7} style={{ color: '#64748B' }} />
        <span className="text-[7px]" style={{ color: '#64748B' }}>{step.timeout}s</span>
      </div>

      {/* Execution status indicator */}
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

  // Animate steps one by one
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
        <div className="px-6 py-5 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max pb-4">
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
          </div>
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
          <div className="space-y-2 max-h-64 overflow-y-auto terrain-scroll">
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
                      {/* Messages */}
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
                                      {msg.fromAgentId.substring(0, 8)} → {msg.toAgentId.substring(0, 8)}
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

                      {/* Output data */}
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

      {/* Pipeline horizontal flow */}
      <div className="flex items-center gap-0 min-w-max pb-2">
        {workflow.steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <PipelineStepNode step={step} />
            {i < workflow.steps.length - 1 && <PipelineArrow />}
          </div>
        ))}
      </div>

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
    <div className="space-y-1.5 max-h-48 overflow-y-auto terrain-scroll">
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

// ─── Workflow Card ────────────────────────────────────────────────────────────

function WorkflowCard({
  workflow,
  isExpanded,
  onToggle,
  onRun,
  onViewHistory,
  running,
}: {
  workflow: WorkflowData
  isExpanded: boolean
  onToggle: () => void
  onRun: () => void
  onViewHistory: (workflowId: string, execId: string) => void
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
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
          {/* Trigger type */}
          <div className="flex items-center gap-1.5">
            <TriggerIcon size={10} style={{ color: '#0891B2' }} />
            <span className="text-[9px] capitalize" style={{ color: '#0891B2' }}>
              {workflow.triggerType}
            </span>
          </div>

          {/* Step count */}
          <div className="flex items-center gap-1.5">
            <Workflow size={10} style={{ color: '#64748B' }} />
            <span className="text-[9px]" style={{ color: '#64748B' }}>
              {workflow.stepCount} steps
            </span>
          </div>

          {/* Success rate */}
          <div className="flex items-center gap-1.5">
            <Gauge size={10} style={{ color: rateColor }} />
            <span className="text-[9px] font-bold" style={{ color: rateColor }}>
              {workflow.stats.successRate}%
            </span>
          </div>

          {/* Executions count */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowPipeline() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [executionModal, setExecutionModal] = useState<{
    execution: ExecutionData | null
    workflow: WorkflowData | null
  }>({ execution: null, workflow: null })

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
        // Refresh workflows to get updated stats
        fetchWorkflows()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Execution failed')
      }
    } catch (err) {
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
        // Find the specific execution from the workflow's executions
        const execution = wf?.executions?.find((e: any) => e.id === execId)
        if (execution) {
          // Parse step data for the modal
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

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

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
        <button
          onClick={fetchWorkflows}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] transition-all duration-200 hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51,51,51,0.4)', color: '#64748B' }}
        >
          <RefreshCw size={9} />
          Refresh
        </button>
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
    </div>
  )
}
