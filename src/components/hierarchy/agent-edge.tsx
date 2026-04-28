'use client'

import React, { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { EDGE_CONFIG, type EdgeType } from './types'

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
