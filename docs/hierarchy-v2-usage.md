# P-MAS Hierarchy v2 — Work Instructions

## Architecture Overview

The Hierarchy page is a React Flow + Dagre-based DAG visualization of the P-MAS multi-agent system. It renders 26 AI agents as node-cards in a top-down hierarchical layout across 5 layers (L0-L4).

## File Structure

```
src/
  app/
    hierarchy/
      page.tsx                         # Dedicated /hierarchy route
    page.tsx                           # Dashboard + Hierarchy toggle (via dynamic import)
  components/
    hierarchy/
      agent-hierarchy-v2.tsx           # Main component: React Flow canvas, header, toolbar, layout
      agent-node.tsx                   # Custom React Flow node — card with Lucide icon, role strip, ports
      agent-edge.tsx                   # Custom React Flow edge — smooth step with type-based styling
      panels.tsx                       # GroupSidebar, DetailPanel, KPIStrip — all Lucide icons only
      types.ts                         # AgentData, ConnectionData, ROLE_CONFIG, EDGE_CONFIG, Dagre layout
  lib/
    client-fetch.ts                    # fetchWithRetry for API calls
```

## Key Design Rules

### 1. NO Unicode Emojis — Lucide SVG Icons Only

All iconography in the application MUST use Lucide React SVG icons. Unicode emoji characters
(e.g., building-2, brain, shield, etc.) are strictly forbidden in code, dialogue, and rendered output.

**Correct approach** — import Lucide icon component and render:

```tsx
import { Brain, Shield, Zap, Building2 } from 'lucide-react'

// In component:
const AVATAR_ICONS: Record<string, LucideIcon> = {
  'brain': Brain,
  'shield': Shield,
  'zap': Zap,
  'building-2': Building2,
}

// Render:
const IconComponent = AVATAR_ICONS[agent.avatar] || Brain
<IconComponent size={16} color={config.color} />
```

**Forbidden** — Unicode emoji map:

```tsx
// NEVER DO THIS:
const AVATAR_ICONS: Record<string, string> = {
  'brain': '\u{1F9E0}',     // WRONG
  'building-2': '\u{1F3E2}', // WRONG
  'shield': '\u{1F6E1}',     // WRONG
}
```

### 2. Avatar-to-Icon Mapping

Each agent has an `avatar` field (string) that maps to a Lucide icon name. The mapping
is defined in `agent-node.tsx`:

| Avatar Key      | Lucide Component |
|-----------------|------------------|
| building-2      | Building2        |
| bar-chart-3     | BarChart3        |
| sparkles        | Sparkles         |
| target          | Target           |
| clipboard-list  | ClipboardList    |
| radio           | Radio            |
| search          | Search           |
| trending-up     | TrendingUp       |
| shield-check    | ShieldCheck      |
| zap             | Zap              |
| flame           | Flame            |
| bug             | Bug              |
| check-circle    | CheckCircle2     |
| brain           | Brain            |
| shield          | Shield           |
| activity        | Activity         |
| book-open       | BookOpen         |
| hard-drive      | HardDrive        |
| file-search     | FileSearch       |
| monitor         | Monitor          |
| bell            | Bell             |
| gauge           | Gauge            |
| network         | Network          |
| megaphone       | Megaphone        |
| workflow        | Workflow         |
| git-branch      | GitBranch        |
| refresh-ccw     | RefreshCw        |
| binary          | Binary           |

Fallback: `Brain` is used if the avatar key is not found.

### 3. Hierarchy Layers

The 5-layer DAG structure is defined in ROLE_CONFIG (types.ts):

| Level | Role Group (RU) | Label (EN) | Color    |
|-------|-----------------|------------|----------|
| L0    | Стратегия       | Strategy   | #67E8F9  |
| L1    | Тактика         | Tactics    | #22D3EE  |
| L2    | Контроль        | Control    | #06B6D4  |
| L3    | Исполнение      | Execution  | #0891B2  |
| L4    | Память          | Memory     | #0E7490  |
| L4    | Мониторинг      | Monitoring | #155E75  |
| L4    | Коммуникация    | Comms      | #164E63  |
| L4    | Обучение        | Learning   | #0C4A6E  |

### 4. Edge Types

6 connection types with visual differentiation:

| Type      | Style       | Color   | Default Visible |
|-----------|-------------|---------|-----------------|
| command   | solid       | #22D3EE | Yes             |
| sync      | dashed 5/5  | #64748B | Yes             |
| twin      | dashed 8/4  | #0891B2 | Yes             |
| delegate  | dashed 6/3  | #0891B2 | No              |
| supervise | dotted 2/4  | #475569 | No              |
| broadcast | dash-dot    | #0E7490 | No              |

### 5. Adding a New Agent

1. Add the agent to the database via Prisma (or `/api/agents` CRUD endpoint)
2. Ensure `avatar` field maps to an existing Lucide icon key
3. Set `roleGroup` to one of the 8 defined groups
4. Set `parentId` and `twinId` for connection generation
5. The Dagre layout will automatically position the agent

### 6. Adding a New Icon

1. Check available icons at https://lucide.dev/icons
2. Import in `agent-node.tsx`:
   ```tsx
   import { YourNewIcon } from 'lucide-react'
   ```
3. Add to `AVATAR_ICONS` map:
   ```tsx
   'your-new-icon': YourNewIcon,
   ```
4. Use the key as the `avatar` field value in agent data

### 7. Keyboard Shortcuts

| Key    | Action                              |
|--------|-------------------------------------|
| 1-8    | Filter by role group (toggle)       |
| 9      | Clear group filter                  |
| Escape | Deselect agent / close detail panel |

### 8. Routes

| URL          | Description                        |
|--------------|------------------------------------|
| /            | Dashboard (with Hierarchy toggle)  |
| /hierarchy   | Dedicated Hierarchy page           |

### 9. API Endpoints

| Endpoint      | Method | Description                      |
|---------------|--------|----------------------------------|
| /api/hierarchy| GET    | Returns agents with connections  |

### 10. Performance Considerations

- React Flow nodes and edges are memoized with `useMemo`
- Dagre layout is recomputed only when `agents` or `connections` change
- Status transition simulation runs every 15 seconds (configurable)
- Node components use `React.memo` for render optimization
- Search filtering uses Set-based lookups for O(1) membership checks
