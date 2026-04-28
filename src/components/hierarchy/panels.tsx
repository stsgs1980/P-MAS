'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain,
  Hexagon,
  X,
  ChevronRight,
  Users,
  Activity,
  List,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import { ROLE_CONFIG, ROLE_ORDER, STATUS_COLORS, FORMULA_DESC, type AgentData, type EdgeType } from './types'
import { fetchWithRetry } from '@/lib/client-fetch'

// ─── Group Sidebar ══════════════════════════════════════════════════════════════

export function GroupSidebar({
  agents,
  activeFilter,
  onFilterChange,
  selectedAgentId,
  onSelectAgent,
}: {
  agents: AgentData[]
  activeFilter: string | null
  onFilterChange: (group: string | null) => void
  selectedAgentId: string | null
  onSelectAgent: (id: string) => void
}) {
  const groupCounts: Record<string, number> = {}
  for (const a of agents) {
    groupCounts[a.roleGroup] = (groupCounts[a.roleGroup] || 0) + 1
  }

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    idle: agents.filter(a => a.status === 'idle').length,
    error: agents.filter(a => a.status === 'error').length,
  }

  const filteredAgents = activeFilter
    ? agents.filter(a => a.roleGroup === activeFilter)
    : agents

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: '#0A0A0A',
        borderRight: '1px solid rgba(51,51,51,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontSize: 11,
      }}
      className="terrain-scroll"
    >
      {/* Groups */}
      <div style={{ padding: 12, borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={10} color="#555" />
          Role Groups
        </div>
        {ROLE_ORDER.map(group => {
          const cfg = ROLE_CONFIG[group]
          if (!cfg) return null
          const count = groupCounts[group] || 0
          const isActive = activeFilter === group
          return (
            <div
              key={group}
              onClick={() => onFilterChange(isActive ? null : group)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 8px',
                borderRadius: 5,
                cursor: 'pointer',
                marginBottom: 2,
                background: isActive ? `rgba(${cfg.colorRgb}, 0.06)` : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(51,51,51,0.1)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500, color: isActive ? '#fff' : '#B0B0B0' }}>{group}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#555',
                  background: 'rgba(51,51,51,0.2)',
                  padding: '1px 5px',
                  borderRadius: 3,
                }}
              >
                {count}
              </span>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div style={{ padding: 12, borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Activity size={10} color="#555" />
          System Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <StatCard value={stats.total} label="Total" color="#fff" />
          <StatCard value={stats.active} label="Active" color="#22D3EE" />
          <StatCard value={stats.idle} label="Idle" color="#64748B" />
          <StatCard value={stats.error} label="Error" color="#EF4444" />
        </div>
      </div>

      {/* Agent list */}
      <div style={{ padding: 12, flex: 1 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <List size={10} color="#555" />
          Agents {activeFilter ? `(${activeFilter})` : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredAgents.map(agent => {
            const cfg = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['Исполнение']
            const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
            const isSelected = agent.id === selectedAgentId
            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 10,
                  color: isSelected ? '#fff' : '#B0B0B0',
                  background: isSelected ? `rgba(${cfg.colorRgb}, 0.08)` : 'transparent',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(51,51,51,0.08)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(51,51,51,0.25)',
        borderRadius: 6,
        padding: 8,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ─── Edit Mode Input Styles ══════════════════════════════════════════════════

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: '#111',
  border: '1px solid rgba(51,51,51,0.4)',
  color: '#fff',
  fontSize: 11,
  borderRadius: 5,
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: '#111',
  border: '1px solid rgba(51,51,51,0.4)',
  color: '#fff',
  fontSize: 11,
  borderRadius: 5,
  outline: 'none',
  appearance: 'auto' as any,
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#B0B0B0',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  display: 'block',
  marginBottom: 3,
}

// ─── Detail Panel ═══════════════════════════════════════════════════════════════

export function DetailPanel({
  agent,
  allAgents,
  onClose,
  onAgentUpdated,
  onAgentDeleted,
}: {
  agent: AgentData | null
  allAgents: AgentData[]
  onClose: () => void
  onAgentUpdated?: (agent: AgentData) => void
  onAgentDeleted?: (agentId: string) => void
}) {
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editRoleGroup, setEditRoleGroup] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editFormula, setEditFormula] = useState('')
  const [editSkills, setEditSkills] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Reset edit state when agent changes or entering edit mode
  useEffect(() => {
    if (agent) {
      setEditName(agent.name)
      setEditRole(agent.role)
      setEditRoleGroup(agent.roleGroup)
      setEditStatus(agent.status)
      setEditFormula(agent.formula)
      setEditSkills(agent.skills || '')
      setEditDescription(agent.description || '')
    }
    setEditMode(false)
    setShowDeleteConfirm(false)
  }, [agent?.id])

  const enterEditMode = () => {
    if (!agent) return
    setEditName(agent.name)
    setEditRole(agent.role)
    setEditRoleGroup(agent.roleGroup)
    setEditStatus(agent.status)
    setEditFormula(agent.formula)
    setEditSkills(agent.skills || '')
    setEditDescription(agent.description || '')
    setEditMode(true)
    setShowDeleteConfirm(false)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setShowDeleteConfirm(false)
  }

  const handleSave = async () => {
    if (!agent) return
    setSaving(true)
    try {
      const res = await fetchWithRetry(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          roleGroup: editRoleGroup,
          status: editStatus,
          formula: editFormula,
          skills: editSkills,
          description: editDescription,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        onAgentUpdated?.(updated)
        setEditMode(false)
      }
    } catch {
      // Silently fail — could add toast later
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!agent) return
    setDeleting(true)
    try {
      const res = await fetchWithRetry(`/api/agents/${agent.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onAgentDeleted?.(agent.id)
        setEditMode(false)
        setShowDeleteConfirm(false)
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false)
    }
  }

  if (!agent) {
    return (
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: '#0A0A0A',
          borderLeft: '1px solid rgba(51,51,51,0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555',
          textAlign: 'center',
          padding: 20,
        }}
      >
        <Hexagon size={28} color="#333" strokeWidth={1} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>Select an agent to view details</div>
      </div>
    )
  }

  const config = ROLE_CONFIG[agent.roleGroup] || ROLE_CONFIG['Исполнение']
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const skills = agent.skills ? agent.skills.split(',').filter(Boolean) : []
  const formulaDesc = FORMULA_DESC[agent.formula] || ''

  const parent = agent.parentId ? allAgents.find(a => a.id === agent.parentId) : null
  const twin = agent.twinId ? allAgents.find(a => a.id === agent.twinId) : null
  const children = allAgents.filter(a => a.parentId === agent.id)

  // ─── Edit Mode ────────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: '#0A0A0A',
          borderLeft: '1px solid rgba(51,51,51,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        className="terrain-scroll"
      >
        {/* Header */}
        <div style={{ padding: 16, position: 'relative', borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
          <div
            style={{
              height: 2,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
              opacity: 0.6,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `rgba(${config.colorRgb}, 0.1)`,
                  border: `1px solid rgba(${config.colorRgb}, 0.2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pencil size={12} color={config.color} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: config.color }}>Edit Agent</span>
            </div>
            <button
              onClick={cancelEdit}
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                border: '1px solid rgba(51,51,51,0.4)',
                background: 'rgba(255,255,255,0.03)',
                color: '#B0B0B0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Agent name"
              style={inputStyle}
            />
          </div>

          {/* Role */}
          <div>
            <label style={labelStyle}>Role</label>
            <input
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              placeholder="Agent role"
              style={inputStyle}
            />
          </div>

          {/* Role Group */}
          <div>
            <label style={labelStyle}>Role Group</label>
            <select
              value={editRoleGroup}
              onChange={e => setEditRoleGroup(e.target.value)}
              style={selectStyle}
            >
              {ROLE_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              style={selectStyle}
            >
              {['active', 'idle', 'paused', 'standby', 'error', 'offline'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Formula */}
          <div>
            <label style={labelStyle}>Cognitive Formula</label>
            <select
              value={editFormula}
              onChange={e => setEditFormula(e.target.value)}
              style={selectStyle}
            >
              {Object.keys(FORMULA_DESC).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Skills */}
          <div>
            <label style={labelStyle}>Skills (comma-separated)</label>
            <input
              value={editSkills}
              onChange={e => setEditSkills(e.target.value)}
              placeholder="e.g. analysis,reporting"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Agent description..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical' as const,
                minHeight: 60,
              }}
            />
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={{
            padding: '10px 16px',
            background: 'rgba(239,68,68,0.06)',
            borderTop: '1px solid rgba(239,68,68,0.2)',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={12} color="#EF4444" />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444' }}>
                Delete &quot;{agent.name}&quot;?
              </span>
            </div>
            <div style={{ fontSize: 9, color: '#B0B0B0', marginBottom: 8 }}>
              This action cannot be undone. The agent and its tasks will be permanently removed.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444', cursor: deleting ? 'wait' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
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

        {/* Action Buttons */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(51,51,51,0.2)',
          display: 'flex',
          gap: 6,
        }}>
          <button
            onClick={handleSave}
            disabled={saving || !editName.trim()}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4', cursor: saving ? 'wait' : 'pointer',
              opacity: !editName.trim() || saving ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'opacity 0.15s',
            }}
          >
            <Save size={10} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
              background: '#1A1A1A', border: '1px solid rgba(51,51,51,0.4)',
              color: '#B0B0B0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'background 0.15s',
            }}
          >
            <RotateCcw size={10} />
            Cancel
          </button>
          {!showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '6px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── View Mode ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: '#0A0A0A',
        borderLeft: '1px solid rgba(51,51,51,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
      className="terrain-scroll"
    >
      {/* Header */}
      <div style={{ padding: 16, position: 'relative', borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div
          style={{
            height: 2,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
            opacity: 0.6,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `rgba(${config.colorRgb}, 0.1)`,
                border: `1px solid rgba(${config.colorRgb}, 0.2)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={16} color={config.color} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.name}</div>
              <div style={{ fontSize: 11, color: config.color, fontWeight: 500 }}>{agent.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={enterEditMode}
              title="Edit agent"
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                border: '1px solid rgba(51,51,51,0.4)',
                background: 'rgba(255,255,255,0.03)',
                color: '#B0B0B0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#06B6D4'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#B0B0B0'; e.currentTarget.style.borderColor = 'rgba(51,51,51,0.4)' }}
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                border: '1px solid rgba(51,51,51,0.4)',
                background: 'rgba(255,255,255,0.03)',
                color: '#B0B0B0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: `${statusColor}15`,
              color: statusColor,
              border: `1px solid ${statusColor}30`,
            }}
          >
            {agent.status.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: `rgba(${config.colorRgb}, 0.08)`,
              color: config.color,
              border: `1px solid rgba(${config.colorRgb}, 0.15)`,
            }}
          >
            {agent.formula}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(51,51,51,0.15)',
              color: '#B0B0B0',
              border: '1px solid rgba(51,51,51,0.25)',
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Description
        </div>
        <div style={{ fontSize: 11, color: '#B0B0B0', lineHeight: 1.5 }}>{agent.description}</div>
      </div>

      {/* Formula */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Cognitive Formula
        </div>
        <div
          style={{
            background: `rgba(${config.colorRgb}, 0.06)`,
            border: `1px solid rgba(${config.colorRgb}, 0.15)`,
            borderRadius: 6,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: config.color }}>{agent.formula}</div>
          <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{formulaDesc}</div>
        </div>
      </div>

      {/* Skills */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Skills ({skills.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {skills.map(skill => (
            <span
              key={skill}
              style={{
                fontSize: 8,
                fontWeight: 600,
                padding: '2px 5px',
                borderRadius: 3,
                background: 'rgba(51,51,51,0.2)',
                color: '#64748B',
                border: '1px solid rgba(51,51,51,0.3)',
              }}
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(51,51,51,0.2)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Connections
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {parent && (
            <ConnItem label="Parent" name={parent.name} color={ROLE_CONFIG[parent.roleGroup]?.color || '#888'} />
          )}
          {twin && (
            <ConnItem label="Twin" name={twin.name} color={ROLE_CONFIG[twin.roleGroup]?.color || '#888'} />
          )}
          {children.length > 0 && (
            <div>
              <span style={{ fontSize: 9, color: '#555' }}>Children</span>
              <div style={{ marginLeft: 8, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {children.map(c => (
                  <ConnItem key={c.id} label="" name={c.name} color={ROLE_CONFIG[c.roleGroup]?.color || '#888'} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Tasks
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: config.color }}>
            {Array.isArray(agent.tasks) ? agent.tasks.length : 0}
          </span>
          <span style={{ fontSize: 9, color: '#555' }}>assigned</span>
        </div>
      </div>
    </div>
  )
}

function ConnItem({ label, name, color }: { label: string; name: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: '#B0B0B0',
        padding: '3px 6px',
        borderRadius: 4,
        background: 'rgba(51,51,51,0.08)',
      }}
    >
      {label && <span style={{ color: '#555', fontSize: 9, width: 40, flexShrink: 0 }}>{label}</span>}
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span>{name}</span>
      <ChevronRight size={8} color="#555" style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  )
}

// ─── KPI Strip ══════════════════════════════════════════════════════════════════

export function KPIStrip({ agents }: { agents: AgentData[] }) {
  const byStatus: Record<string, number> = {}
  for (const a of agents) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1
  }

  const items = [
    { color: '#fff', value: agents.length, label: 'Total' },
    { color: '#22D3EE', value: byStatus.active || 0, label: 'Active' },
    { color: '#64748B', value: byStatus.idle || 0, label: 'Idle' },
    { color: '#F59E0B', value: byStatus.paused || 0, label: 'Paused' },
    { color: '#EF4444', value: byStatus.error || 0, label: 'Error' },
    { color: '#8B5CF6', value: byStatus.standby || 0, label: 'Standby' },
  ]

  return (
    <div
      style={{
        background: '#0A0A0A',
        borderTop: '1px solid rgba(51,51,51,0.25)',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 24,
        flexShrink: 0,
      }}
    >
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.value}</span>
          <span style={{ fontSize: 9, color: '#555' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
