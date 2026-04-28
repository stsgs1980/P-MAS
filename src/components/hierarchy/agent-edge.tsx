'use client'

import React, { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { EDGE_CONFIG, type EdgeType } from './types'

// ─── Animation duration per edge type (in seconds) ──────────────────────────

const EDGE_DURATIONS: Record<EdgeType, number> = {
  command: 3,
  sync: 5,
  twin: 4,
  delegate: 3.5,
  supervise: 6,
  broadcast: 2.5,
}

// ─── Particle definitions per edge ──────────────────────────────────────────
// Each particle has a stagger offset (0–1 fraction of dur) and a size multiplier

const PARTICLES = [
  { offset: 0, sizeMultiplier: 1 },
  { offset: 0.33, sizeMultiplier: 0.85 },
  { offset: 0.66, sizeMultiplier: 0.7 },
]

function AgentEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeType = (data?.edgeType as EdgeType) || 'command'
  const config = EDGE_CONFIG[edgeType]
  const strength = (data?.strength as number) ?? 1
  const flowAnimation = (data?.flowAnimation as boolean) ?? true

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })

  const opacity = selected ? 0.7 : 0.2 + strength * 0.2
  const strokeWidth = selected ? 1.5 : 0.5 + strength * 0.5
  const dur = EDGE_DURATIONS[edgeType]

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: config.color,
          strokeWidth,
          strokeOpacity: opacity,
          strokeDasharray: config.strokeDasharray || undefined,
        }}
      />

      {/* ─── Animated flow particles ──────────────────────────────────── */}
      {flowAnimation && (
        <g>
          {/* SVG filter for glow effect — scoped per edge to avoid conflicts */}
          <defs>
            <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Trailing glow — larger, more diffuse */}
            <filter id={`trail-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
              </feMerge>
            </filter>
          </defs>

          {PARTICLES.map((particle, i) => {
            const baseRadius = 2 + strength * 0.5
            const radius = baseRadius * particle.sizeMultiplier
            const beginOffset = particle.offset * dur

            return (
              <g key={`${id}-particle-${i}`}>
                {/* Trailing glow circle (larger, more diffuse, lower opacity) */}
                <circle
                  r={radius * 2.5}
                  fill={config.color}
                  opacity={0.15}
                  filter={`url(#trail-${id})`}
                >
                  <animateMotion
                    path={edgePath}
                    dur={`${dur}s`}
                    begin={`${beginOffset}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  />
                </circle>

                {/* Main particle circle with glow filter */}
                <circle
                  r={radius}
                  fill={config.color}
                  opacity={0.7}
                  filter={`url(#glow-${id})`}
                >
                  <animateMotion
                    path={edgePath}
                    dur={`${dur}s`}
                    begin={`${beginOffset}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  />
                  {/* Subtle opacity pulsation */}
                  <animate
                    attributeName="opacity"
                    values="0.5;0.85;0.5"
                    dur={`${dur * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )
          })}
        </g>
      )}

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 8,
              fontWeight: 700,
              color: config.color,
              background: 'rgba(10,10,10,0.9)',
              padding: '1px 4px',
              borderRadius: 3,
              pointerEvents: 'none',
              border: `1px solid ${config.color}30`,
            }}
          >
            {config.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const AgentEdge = memo(AgentEdgeComponent)
