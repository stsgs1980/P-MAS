# Task 3: Add Agent Modal + Enhanced Hierarchy Toolbar Features

## Agent: full-stack-developer

## Changes Made

### File Modified: `/home/z/my-project/src/components/hierarchy/agent-hierarchy-v2.tsx`

1. **New Imports**: Added `X`, `Crosshair` from lucide-react; `FORMULA_DESC` from types
2. **New State Variables** (7): `showAddAgent`, `newAgentName`, `newAgentRole`, `newAgentGroup`, `newAgentFormula`, `newAgentStatus`, `newAgentSkills`
3. **ReactFlow Instance Ref**: `reactFlowInstance` ref stored via `onInit` callback on `<ReactFlow>`
4. **Add Agent Button**: Now calls `setShowAddAgent(true)` to open modal
5. **handleAddAgent**: POST to `/api/agents`, resets form, refreshes data
6. **handleFocus**: `fitView` with selected node filter
7. **handleFitView**: `fitView` for all nodes
8. **Enhanced Toolbar**: Zoom In/Out use ReactFlow API, added Fit button (text + icon), Focus button (cyan when selected, gray when not)
9. **Custom Add Agent Modal**: Fixed overlay with dark backdrop, 6 form fields, Cancel/Create buttons, click-outside-to-close

## Verification
- Lint: 0 errors (only unrelated templates/playwright.config.ts parse error)
- Dev server: running successfully
