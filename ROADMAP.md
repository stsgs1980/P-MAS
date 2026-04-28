# P-MAS Roadmap

> Последнее обновление: 2025-07-19

## Статус проекта

**P-MAS** — Multi-Agent System Dashboard. Визуализация иерархии агентов, когнитивных формул, связей и метрик.

**Репо:** `stsgs1980/P-MAS`
**Стек:** Next.js 16 + TypeScript + Prisma + SQLite + ReactFlow + Tailwind + shadcn/ui
**Дизайн:** Monochrome Cyan (#06B6D4) на чёрном фоне

---

## ✅ Phase 1: UI/UX Fixes — ЗАВЕРШЕНО

| # | Задача | Приоритет | Статус | Когда |
|---|--------|-----------|--------|-------|
| 1.1 | Quick Stats collapsible | HIGH | ✅ Готово | Task 11 |
| 1.2 | Fix Legend/Stats overlap в иерархии | HIGH | ✅ Готово | Task 12 — sidebar |
| 1.3 | Compact header redesign | HIGH | ✅ Готово | Task 11 |
| 1.4 | Connection flow animation | MEDIUM | ❌ Не начато | — |
| 1.5 | Node depth/3D effects | MEDIUM | ❌ Не начато | — |

---

## ✅ Phase 2: API & Data Migration — ЗАВЕРШЕНО

| # | Задача | Приоритет | Статус | Когда |
|---|--------|-----------|--------|-------|
| 2.1 | Создать `/api/stats` endpoint | HIGH | ✅ Готово | Task 17 |
| 2.2 | Миграция Dashboard с hardcoded → API данные | HIGH | ✅ Готово | Task 18 |
| 2.3 | Quick Stats из API | HIGH | ✅ Готово | Task 18 |
| 2.4 | Status Distribution из API | HIGH | ✅ Готово | Task 18 |
| 2.5 | Role Groups из API | HIGH | ✅ Готово | Task 18 |
| 2.6 | Agent List из API | HIGH | ✅ Готово | Task 18 |
| 2.7 | Activity Events из API | MEDIUM | ✅ Готово | Task 18 |
| 2.8 | Top Performers из API | MEDIUM | ✅ Готово | Task 18 |
| 2.9 | Connection Heatmap из API | MEDIUM | ✅ Готово | Task 18 |
| 2.10 | Network Activity из API | MEDIUM | ✅ Готово | Task 18 |
| 2.11 | Live data индикатор + Refresh | MEDIUM | ✅ Готово | Task 18 |
| 2.12 | Fallback на hardcoded при ошибке API | MEDIUM | ✅ Готово | Task 18 |

---

## ✅ Phase 3: Wireframe Features — ЗАВЕРШЕНО

| # | Задача | Приоритет | Статус | Когда |
|---|--------|-----------|--------|-------|
| 3.1 | Add Agent модалка (POST /api/agents) | HIGH | ✅ Готово | Task 19 |
| 3.2 | ⊞ Fit button (fitView) | HIGH | ✅ Готово | Task 19 |
| 3.3 | ◎ Focus Selected Node button | HIGH | ✅ Готово | Task 19 |
| 3.4 | ⇅ Layout button (Dagre re-layout) | MEDIUM | ✅ Готово | Task 19 |
| 3.5 | Layers toggle (L0-L4) | MEDIUM | ✅ Готово | Task 19 |
| 3.6 | L0-L4 визуальные слои с бейджами | MEDIUM | ✅ Готово | Task 19 |
| 3.7 | LIVE индикатор в хедере | HIGH | ✅ Готово | Task 19 |
| 3.8 | ↻ Refresh кнопка в хедере | HIGH | ✅ Готово | Task 19 |
| 3.9 | Zoom In/Out через ReactFlow API | MEDIUM | ✅ Готово | Task 19 |

---

## 🔲 Phase 4: Visual Enhancements — ПЛАНИРУЕТСЯ

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 4.1 | Connection flow animation (данные текут по рёбрам) | HIGH | ❌ Не начато |
| 4.2 | Pulsing concentric waves от корневой ноды | MEDIUM | ❌ Не начато |
| 4.3 | Semi-transparent cluster backgrounds для role groups | MEDIUM | ❌ Не начато |
| 4.4 | Node inner-shadow/gradient для 3D-эффекта | MEDIUM | ❌ Не начато |
| 4.5 | Group boundary contours (усиленные) | LOW | ❌ Не начато |
| 4.6 | Skeleton loading для dashboard компонентов | MEDIUM | ❌ Не начато |
| 4.7 | Smooth page transition между Dashboard ↔ Hierarchy | LOW | ❌ Не начато |

---

## 🔲 Phase 5: Functionality — ПЛАНИРУЕТСЯ

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 5.1 | Real-time agent status updates (WebSocket) | HIGH | ❌ Не начато |
| 5.2 | Agent detail editing (PUT /api/agents/:id) | HIGH | ❌ Не начато |
| 5.3 | Agent deletion (DELETE /api/agents/:id) | MEDIUM | ❌ Не начато |
| 5.4 | Task management CRUD из UI | MEDIUM | ❌ Не начато |
| 5.5 | Interactive formula dependency explorer | MEDIUM | ❌ Не начато |
| 5.6 | Agent task queue visualization | MEDIUM | ❌ Не начато |
| 5.7 | Export dashboard as PDF/image | LOW | ❌ Не начато |
| 5.8 | Search по агентам с Cmd+K shortcut | LOW | ❌ Не начато |
| 5.9 | Keyboard shortcuts панель (помощь) | LOW | ❌ Не начато |

---

## 🔲 Phase 6: Advanced — ПЛАНИРУЕТСЯ

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 6.1 | Agent performance metrics из реальной телеметрии | HIGH | ❌ Не начато |
| 6.2 | Historical metrics (time-series в БД) | MEDIUM | ❌ Не начато |
| 6.3 | Alerting rules — настраиваемые пороги | MEDIUM | ❌ Не начато |
| 6.4 | Agent log viewer (streaming) | MEDIUM | ❌ Не начато |
| 6.5 | Multi-language UI (RU/EN toggle) | LOW | ❌ Не начато |
| 6.6 | Dark/light theme toggle | LOW | ❌ Не начато |
| 6.7 | Mobile-responsive improvements | MEDIUM | ❌ Не начато |

---

## Принципы дизайна

- **Чёрный фон** (#000000) — графы «светятся» на чёрном
- **Монохром + один акцент** (Cyan #06B6D4) — никакого радуги
- **Радиальная/иерархическая раскладка** — структура важнее хаоса
- **Glow-эффекты** — ноды «дышат», а не плоские кружки
- **Тонкие полупрозрачные рёбра** — рёбра не доминируют
- **Высокий контраст** — всё читается мгновенно
- **Минимализм** — без декораций, данные на первом месте

---

## Известные проблемы

| # | Проблема | Влияние |
|---|----------|---------|
| 1 | Dev server периодически умирает в sandbox | Нужно перезапускать `npx next dev -p 3000` |
| 2 | AGENT_LIST sidebar не синхронизирован с БД (12 из 26 имён не совпадали) | Исправлено миграцией на API |
| 3 | GitHub токены протухают | Нужен новый PAT для push |
| 4 | `templates/playwright.config.ts` вызывает lint error | Несвязанный файл, не влияет на проект |
