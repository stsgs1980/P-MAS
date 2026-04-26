# Task 6: Enhance Hierarchy with Animated Status Transitions and Task Indicators

## Task Summary
Enhanced the agent-hierarchy.tsx visualization with animated status transitions, task count indicators, connection pulse animations, and minimap improvements.

## Changes Made

### 1. Animated Status Transition Badges
- Added `statusTransitions` state (Record<string, { status: string; timestamp: number }>)
- useEffect fires every 15 seconds, randomly changes 1-2 agent statuses (active/idle/paused/standby cycle)
- When status changes: pulse ring animation expands from r=3 to r=14 and fades over 1 second
- Floating label "STATUS: ACTIVE" etc. appears above agent node, fades out over 2 seconds
- Transition cleared from state after 2 seconds

### 2. Agent Task Count Indicator
- Added `taskCount` prop to AgentNode (default 0)
- Text at y=48, fontSize 6, fill #B0B0B0, opacity 0.5
- Displays "{taskCount} tasks" below agent name
- Wired through main component from agent.tasks array length

### 3. Connection Pulse Animation
- Added `pulsingConnections` state (Set<string>)
- useEffect fires every 8 seconds, randomly selects 1-2 connections
- Pulsing connections: particle radius increases (3->5), opacity increases (0.8->1.0)
- Connection line opacity increases (0.18->0.4 for main, 0.25->0.5 for glow)
- Added `isPulsing` prop to ConnectionLine component
- Pulse clears after 3 seconds

### 4. Minimap Enhancement
- Scale increased from 140 to 160 (making minimap larger)
- Container width increased from 160 to 180
- Added viewport indicator glow (rect with orbGlow filter, strokeOpacity 0.1)
- Viewport stroke width increased (0.2->0.3), opacity increased (0.25->0.35)
- Agent colored dots were already present in the minimap

## Verification
- `bun run lint` passes cleanly (0 errors)
- Dev server compiles successfully
- All terrain design system colors preserved (#000000, #1A1A1A, #2D2D2D, #4A90E2, etc.)
- No Unicode emoji used - all visual elements use SVG
