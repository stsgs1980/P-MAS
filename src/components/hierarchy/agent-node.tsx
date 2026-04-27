'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Building2,
  BarChart3,
  Sparkles,
  Target,
  ClipboardList,
  Radio,
  Search,
  TrendingUp,
  ShieldCheck,
  Zap,
  Flame,
  Bug,
  CheckCircle2,
  Brain,
  Shield,
  Activity,
  BookOpen,
  HardDrive,
  FileSearch,
  Monitor,
  Bell,
  Gauge,
  Network,
  Megaphone,
  Workflow,
  GitBranch,
  RefreshCw,
  Binary,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import { ROLE_CONFIG, STATUS_COLORS, type AgentData } from './types'

// Lucide icon map — NO Unicode emojis, ONLY SVG icons
const AVATAR_ICONS: Record<string, LucideIcon> = {
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
  'check-circle': CheckCircle2,
  'brain': Brain,
  'shield': Shield,
  'activity': Activity,
  'book-open': BookOpen,
  'hard-drive': HardDrive,
  'file-search': FileSearch,
  'monitor': Monitor,
  'bell': Bell,
  'gauge': Gauge,
  'network': Network,
  'megaphone': Megaphone,
  'workflow': Workflow,
  'git-branch': GitBranch,
  'refresh-ccw': RefreshCw,
  'binary': Binary,
}

export interface AgentNodeData extends AgentData {
  isHighlighted?: boolean
  isDimmed?: boolean
  skillCount?: number
  taskCount?: number
  [key: string]: unknown
}

function AgentNodeComponent({ data, selected }: NodeProps) {
  const agent = data as unknown as AgentNodeData
  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['Исполнение']
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline

  const IconComponent = AVATAR_ICONS[agent.avatar] || Brain
  const isDimmed = agent.isDimmed
  const isHighlighted = agent.isHighlighted

  return (
    <div
      style={{
        width: 160,
        minHeight: 58,
        background: `rgba(${config.colorRgb}, 0.06)`,
        border: `1px solid ${selected ? config.color : `rgba(${config.colorRgb}, 0.2)`}`,
        borderWidth: selected ? 1.5 : 0.5,
        borderRadius: 8,
        opacity: isDimmed ? 0.25 : 1,
        transition: 'opacity 0.3s, border-color 0.3s',
        overflow: 'hidden',
        boxShadow: selected
          ? `0 0 20px rgba(${config.colorRgb}, 0.15), 0 0 40px rgba(${config.colorRgb}, 0.05)`
          : isHighlighted
            ? `0 0 12px rgba(${config.colorRgb}, 0.1)`
            : 'none',
        cursor: 'pointer',
      }}
    >
      {/* Header strip */}
      <div
        style={{
          height: 16,
          background: `rgba(${config.colorRgb}, 0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            color: config.color,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {config.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 7, color: statusColor, fontWeight: 600 }}>
            {agent.status.toUpperCase()}
          </span>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: agent.status === 'active' ? `0 0 4px ${statusColor}` : 'none',
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '4px 8px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: `rgba(${config.colorRgb}, 0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComponent size={12} color={config.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {agent.name}
          </div>
          <div style={{ fontSize: 7, color: '#64748B', marginTop: 1 }}>
            {agent.formula} · {agent.skillCount ?? 0} skills
          </div>
        </div>
      </div>

      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 6,
          height: 6,
          background: config.color,
          opacity: 0.5,
          border: 'none',
          top: -3,
        }}
      />

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 6,
          height: 6,
          background: config.color,
          opacity: 0.5,
          border: 'none',
          bottom: -3,
        }}
      />
    </div>
  )
}

export const AgentNode = memo(AgentNodeComponent)
