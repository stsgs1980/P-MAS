# P-MAS Dashboard

**Prompt-based Multi-Agent System** — Interactive hierarchy visualization dashboard for managing and monitoring 26 AI agents across 8 role groups with 20 cognitive formulas.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

P-MAS (Prompt-based Multi-Agent System) is a multi-agent orchestration platform with a real-time monitoring dashboard. The system organizes AI agents into a hierarchical structure with specialized role groups, cognitive reasoning formulas, and inter-agent communication patterns.

The dashboard provides two main views:

- **Dashboard** — System overview with metrics, role group status, formula taxonomy, network activity, performance monitoring, and alert management
- **Hierarchy Visualization** — Interactive SVG-based agent hierarchy with zoom, pan, minimap, collapsible sidebar, search, and context menus

---

## Architecture

### Agent Hierarchy

```
                    P-MAS System
                         |
        +-------+-------+-------+-------+
        |       |       |       |       |
    Стратегия Тактика Контроль Исполнение ...
        |       |       |       |
     +--+--+  +-+-+  +-+-+  +-----+
     |   |   |  |   |  |   |  |  |  |
     A   B   C  D  E  F  G  H  I  J  K
```

### 8 Role Groups

| Group | Russian | Agents | Lead Agent | Color |
|-------|---------|--------|------------|-------|
| Strategy | Стратегия | 3 | Arkhitektor | `#67E8F9` |
| Tactics | Тактика | 3 | Koordinator | `#22D3EE` |
| Control | Контроль | 3 | Revizor | `#06B6D4` |
| Execution | Исполнение | 5 | Ispolnitel-A | `#0891B2` |
| Memory | Память | 3 | Arkhivarius | `#0E7490` |
| Monitoring | Мониторинг | 3 | Nablyudatel | `#155E75` |
| Communication | Коммуникация | 3 | Shlyuz | `#164E63` |
| Learning | Обучение | 3 | Trener | `#083344` |

### 20 Cognitive Formulas

| Category | Formulas |
|----------|----------|
| **Foundational** | CoT, ToT, GoT, PoT |
| **Verification** | CoVe, SelfRefine, SelfConsistency |
| **Planning** | ReAct, ReWOO, PlanAndSolve, StepBack, PromptChaining |
| **Advanced** | Reflexion, LATS, DSPy, MetaCoT, LeastToMost, AoT, SoT, MoA |

### Agent Connection Types

| Type | Description | Color |
|------|-------------|-------|
| Command | Direct task assignment | `#06B6D4` |
| Sync | State synchronization | `#64748B` |
| Twin | Paired agent redundancy | `#22D3EE` |
| Delegate | Task delegation | `#0891B2` |
| Supervise | Oversight relationship | `#475569` |
| Broadcast | Group-wide notification | `#0E7490` |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | App Router, SSR, API routes |
| **TypeScript 5** | Type-safe development |
| **Prisma ORM** | Database schema & queries (SQLite) |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | UI component library (New York style) |
| **Framer Motion** | Animations & transitions |
| **Zustand** | Client state management |
| **Lucide Icons** | SVG icon system (no emoji/Unicode) |
| **agent-toolkit v1.5.0** | Standards, skills, resilience layer |

---

## Design System

### Monochrome Cyan Theme

The dashboard uses a strict monochrome color system with **Cyan (#06B6D4)** as the single accent color on a dark background.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#06B6D4` | Accent, links, active states |
| Background | `#000000` | Main background |
| Surface | `#1A1A1A` | Cards, panels |
| Surface Alt | `#2D2D2D` | Hover states, borders |
| Text Primary | `#FFFFFF` | Headings, important text |
| Text Secondary | `#B0B0B0` | Body text, descriptions |

### Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| Active | Bright Cyan | `#22D3EE` |
| Idle | Slate | `#64748B` |
| Paused | Amber | `#EAB308` |
| Standby | Indigo | `#818CF8` |
| Error | Rose | `#F43F5E` |
| Offline | Zinc | `#3F3F46` |

### Design Principles

- **Dark-first** — Graphs and data glow on black background
- **Monochrome + 1 accent** — No rainbow, only Cyan
- **No-Unicode Policy v2.1** — Lucide SVG icons only, zero emoji
- **W1280** — Max content width of 1280px, centered
- **High contrast** — Everything reads instantly
- **Data-first minimalism** — No decoration, content drives design

---

## Getting Started

### Prerequisites

- **Bun** runtime (v1.0+)
- **Node.js** compatible environment

### Installation

```bash
# Clone the repository
git clone https://github.com/stsgs1980/P-MAS.git
cd P-MAS

# Install dependencies
bun install

# Set up the database
bun run db:push

# Seed the database with sample agents and tasks
# (Visit http://localhost:3000/api/seed after starting the server)
```

### Development

```bash
# Start the development server (port 3000)
bun run dev

# Run linting
bun run lint

# Push schema changes to database
bun run db:push
```

### Database Seeding

After starting the dev server, seed the database by making a POST request:

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates 26 agents across 8 role groups with hierarchy relationships and 26 sample tasks.

---

## Project Structure

```
P-MAS/
├── prisma/
│   └── schema.prisma          # Agent & Task models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agents/         # Agent CRUD (GET, POST)
│   │   │   ├── agents/[id]/    # Agent CRUD (GET, PATCH, DELETE)
│   │   │   ├── tasks/          # Task CRUD (GET, POST)
│   │   │   ├── tasks/[id]/     # Task CRUD (GET, PATCH, DELETE)
│   │   │   ├── hierarchy/      # Hierarchy with connections
│   │   │   ├── health/         # Server health check
│   │   │   └── seed/           # Database seeding
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Dashboard page
│   ├── components/
│   │   ├── agent-hierarchy.tsx # Hierarchy visualization component
│   │   └── ui/                 # shadcn/ui components
│   └── lib/
│       ├── db.ts               # Prisma client instance
│       ├── api-retry.ts        # Exponential backoff retry
│       ├── circuit-breaker.ts  # Circuit breaker pattern
│       ├── health-check.ts     # Health monitoring
│       ├── fallback-manager.ts # Multi-provider fallback
│       ├── client-fetch.ts     # Client-side fetch with retry
│       ├── resilience.ts       # Unified resilience exports
│       └── utils.ts            # Utility functions
├── skills/                     # Agent skills (api-retry, health-check, etc.)
├── standards/                  # Governance documents (No-Unicode, Markdown, etc.)
├── instructions/               # Behavioral instructions
├── templates/                  # Operational templates
├── AGENT_RULES.md              # Agent behavioral rules
├── PROJECT_CONFIG.md           # Project-specific configuration
├── public/                     # Static assets
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## API Endpoints

### Agents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agents` | List all agents |
| `POST` | `/api/agents` | Create a new agent |
| `GET` | `/api/agents/[id]` | Get agent by ID |
| `PATCH` | `/api/agents/[id]` | Update agent |
| `DELETE` | `/api/agents/[id]` | Delete agent (with cleanup) |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | List tasks (filter by agentId, status, priority) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/[id]` | Get task by ID |
| `PATCH` | `/api/tasks/[id]` | Update task |
| `DELETE` | `/api/tasks/[id]` | Delete task |

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/hierarchy` | Get hierarchy with connections |
| `GET` | `/api/health` | Server health check (database status) |
| `POST` | `/api/seed` | Seed database with sample data |

---

## Features

### Dashboard

- System health monitor with animated sparklines
- Role group cards with progress bars and agent counts
- Formula taxonomy with category grouping
- Network activity chart with animated gradient
- Performance metrics with mini sparkline charts
- Active alerts panel with severity levels
- Recent activity timeline with group badges
- Connection heatmap visualization
- Search/filter across all sections
- Collapsible sections for each panel
- Live clock with auto-refresh
- Notification bell with alert dropdown
- Animated counters for key metrics
- SVG architecture diagram
- System status badge (ONLINE/OFFLINE)

### Hierarchy Visualization

- Interactive SVG canvas with zoom & pan
- Radial layout with group boundary contours
- Collapsible left sidebar with:
  - Quick Stats (always visible)
  - Detailed Stats (collapsible)
  - Legend with edge type icons
  - Connection type toggles
  - Integrated minimap
- Node right-click context menu
- Search with glow highlight effect
- Connection strength visualization
- Breadcrumb navigation trail
- Fit-to-screen keyboard shortcut (F)
- Role group filtering
- Agent detail panel with staggered animations
- Mobile responsive with overlay sidebar

---

## Database Schema

```prisma
model Agent {
  id          String   @id @default(cuid())
  name        String
  role        String
  roleGroup   String          // Стратегия, Тактика, Контроль, ...
  status      String          // active, idle, paused, standby, error, offline
  formula     String          // ToT, CoVe, ReWOO, Reflexion, ReAct, MoA, ...
  parentId    String?         // Hierarchy: parent agent
  twinId      String?         // Paired agent (mutual)
  skills      String          // Comma-separated skill names
  description String
  avatar      String          // Lucide icon name
  createdAt   DateTime
  updatedAt   DateTime
  tasks       Task[]
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String
  status      String          // pending, running, completed, failed
  priority    String          // low, medium, high, critical
  agentId     String?
  agent       Agent?
  createdAt   DateTime
  updatedAt   DateTime
}
```

---

## Agent Catalog

| # | Name | Role | Group | Formula | Status |
|---|------|------|-------|---------|--------|
| 1 | Arkhitektor | Chief Strategy Agent | Стратегия | ToT | Active |
| 2 | Analitik | Strategy Analyst | Стратегия | CoVe | Active |
| 3 | Vizioner | Vision Agent | Стратегия | GoT | Active |
| 4 | Koordinator | Tactical Coordinator | Тактика | ReWOO | Active |
| 5 | Planirovshchik | Task Planner | Тактика | ReAct | Active |
| 6 | Kommunikator | Inter-Agent Comm | Тактика | SelfConsistency | Idle |
| 7 | Revizor | Quality Controller | Контроль | Reflexion | Active |
| 8 | Ocenshchik | Performance Evaluator | Контроль | CoVe | Active |
| 9 | Strazh | Safety Guard | Контроль | ReAct | Active |
| 10 | Ispolnitel-A | Primary Executor | Исполнение | ReAct | Active |
| 11 | Ispolnitel-B | Secondary Executor | Исполнение | MoA | Active |
| 12 | Otladchik | Debug Agent | Исполнение | SelfRefine | Idle |
| 13 | Testirovshchik | Test Agent | Исполнение | PoT | Active |
| 14 | Koder | Code Generator | Исполнение | PoT | Active |
| 15 | Arkhivarius | Knowledge Archivist | Память | CoT | Active |
| 16 | RAG-Specialist | RAG Retrieval Agent | Память | AoT | Active |
| 17 | Kontekst-Manager | Context Manager | Память | SoT | Standby |
| 18 | Nablyudatel | System Observer | Мониторинг | CoT | Active |
| 19 | Alert-Operator | Alert Agent | Мониторинг | LATS | Paused |
| 20 | Diagnost | Diagnostics Agent | Мониторинг | GoT | Active |
| 21 | Shlyuz | Gateway Agent | Коммуникация | PromptChaining | Active |
| 22 | Protokolista | Protocol Agent | Коммуникация | StepBack | Active |
| 23 | Dispeter | Dispatcher Agent | Коммуникация | PlanAndSolve | Active |
| 24 | Trener | Trainer Agent | Обучение | DSPy | Active |
| 25 | Adapter | Adapter Agent | Обучение | MetaCoT | Active |
| 26 | Otsenochnik | Evaluator Agent | Обучение | LeastToMost | Idle |

---

## License

MIT

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), [shadcn/ui](https://ui.shadcn.com/), and [Framer Motion](https://www.framer.com/motion/)
- Icon system by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
