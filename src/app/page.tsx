'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const AgentHierarchy = dynamic(
  () => import('@/components/agent-hierarchy'),
  { ssr: false }
)

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'hierarchy'>('hierarchy')

  if (activeView === 'hierarchy') {
    return <AgentHierarchy onBack={() => setActiveView('dashboard')} />
  }

  return <DashboardPanel onOpenHierarchy={() => setActiveView('hierarchy')} />
}

function DashboardPanel({ onOpenHierarchy }: { onOpenHierarchy: () => void }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-600/20 border border-cyan-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
                <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
                <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
                <path d="M6 18a4 4 0 0 1-1.967-.516"/>
                <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-wide">P-MAS</h1>
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
            <span>Agent Hierarchy</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Agents', value: '13', color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.08)' },
            { label: 'Active', value: '8', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
            { label: 'Role Groups', value: '4', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
            { label: 'Cognitive Types', value: '6', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{
                background: stat.bg,
                border: `1px solid ${stat.color}22`,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Role Groups */}
        <h2 className="text-white font-semibold text-sm mb-4">Role Groups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { name: 'Стратегия', label: 'Strategy', color: '#f59e0b', colorRgb: '245,158,11', agents: 2, formula: 'ToT' },
            { name: 'Тактика', label: 'Tactics', color: '#10b981', colorRgb: '16,185,129', agents: 3, formula: 'CoVe / ReWOO' },
            { name: 'Контроль', label: 'Control', color: '#f43f5e', colorRgb: '244,63,94', agents: 3, formula: 'Reflexion' },
            { name: 'Исполнение', label: 'Execution', color: '#06b6d4', colorRgb: '6,182,212', agents: 5, formula: 'ReAct / MoA' },
          ].map((group) => (
            <div
              key={group.name}
              className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: `rgba(${group.colorRgb}, 0.06)`,
                border: `1px solid rgba(${group.colorRgb}, 0.2)`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm" style={{ color: group.color }}>{group.name}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{
                    background: `rgba(${group.colorRgb}, 0.15)`,
                    color: group.color,
                  }}
                >
                  {group.agents}
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-2">{group.label}</p>
              <p className="text-slate-500 text-[10px]">Formula: {group.formula}</p>
            </div>
          ))}
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
            Open Hierarchy Visualization
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-4 border-t border-white/5">
        <p className="text-center text-slate-600 text-xs">P-MAS Dashboard v2.1 -- No Unicode Policy Enforced</p>
      </footer>
    </div>
  )
}
