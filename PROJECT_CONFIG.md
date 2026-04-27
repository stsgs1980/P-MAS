# Project Configuration

> Project-specific settings for the current project.
> This file is NOT part of the toolkit standards -- it is created per project.
>
> Toolkit version: v1.5.0

---

## Stack Signature

```
Built with: Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma + shadcn/ui + Framer Motion + Zustand
```

> Format defined by: `MARKDOWN_STANDARD v2.1`
> Default value defined by: `README_TEMPLATE.md`

---

## Dev Server

| Setting | Value |
|---------|-------|
| Command | `npx next dev -p 3000` |
| Health check | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000` |
| Host | `127.0.0.1` (NOT `localhost`) |
| Startup wait | 6 seconds (Turbopack compile time) |
| Output redirect | `</dev/null >/tmp/zdev.log 2>&1 &` |

### Error Handling

| Response | Action |
|----------|--------|
| 200 | Server running, proceed |
| 000 | Server down, restart with `dev-watchdog` skill |
| 500 | Server error, check logs, fix error, then restart |

---

## Project Paths

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router entry points and routes |
| `src/app/api/` | API endpoints (agents, hierarchy, seed) |
| `src/components/` | React components (agent-hierarchy, ui/) |
| `src/lib/` | Core libraries (db, api-retry, health-check, circuit-breaker) |
| `prisma/` | Prisma schema and migrations |
| `instructions/` | Agent behavioral instructions |
| `skills/` | Automated agent skills |
| `standards/` | Governance documents (Group B) |
| `templates/` | Operational templates (Group A) |
| `public/` | Static assets |

---

## Component Library

- Use **shadcn/ui** components (New York style), do not build from scratch
- TypeScript throughout with strict typing
- **Framer Motion** for animations and transitions
- **Zustand** for client-side state management
- **Lucide Icons** for SVG icon system (No-Unicode Policy, no emoji)

---

## Database

| Setting | Value |
|---------|-------|
| Engine | SQLite |
| Connection | `file:./db/custom.db` (relative path) |
| Connection limit | `connection_limit=1` (SQLite requirement) |
| ORM | Prisma v6 |

---

## Agent System

P-MAS manages 26 AI agents across 8 role groups with 20 cognitive formulas.

### Role Groups

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

### Skills Available

| Skill | When to Use |
|-------|-------------|
| `api-retry` | HTTP requests to external APIs, 502/503/504 errors |
| `health-check` | Checking API availability, monitoring response times |
| `fallback` | Primary API unavailable, need alternative providers |
| `git-safe-ops` | Before any git push/pull/rebase/merge with remote |
| `dev-watchdog` | Starting, restarting, or checking dev server |

---

## Design System

- **Monochrome Cyan theme** on dark background
- Primary accent: `#06B6D4` (Cyan)
- Background: `#000000`, Surface: `#1A1A1A`
- **No-Unicode Policy v2.1** -- Lucide SVG icons only, zero emoji
- Max content width: 1280px (W1280)
- Dark-first, data-first minimalism

---

## Environment Variables

All environment variables must be documented in `.env.example`
per `REPRODUCIBILITY-STANDARD`.

---

## Notes

- This file is the single source of truth for project-specific configuration
- When switching to a different stack, update only this file
- AGENT_RULES.md references this file for all project-dependent settings
