# Agent Rules

> Toolkit version: **v1.5.0**
>
> Mandatory rules for AI agents working with this toolkit.
> Read before starting work on any project.

---

## 0. Onboarding Protocol

When entering a project (new chat, session restart, context loss),
you MUST complete the onboarding protocol before starting any work:

1. Read `AGENT_RULES.md` (this file)
2. Read `PROJECT_CONFIG.md` (project-specific settings) -- if exists
3. Read `worklog.md` (previous session history)
4. Check git state: `git log --oneline -10` and `git status`
5. Verify project state per `PROJECT_CONFIG.md` (dev server, paths)
6. Scan project structure
7. Report current state to user

See `instructions/onboarding-protocol.md` for full details.
NEVER start coding or modifying files before completing Steps 1-3.

## 1. Language Rule

Always respond in the user's language. If the user writes in Russian, respond in Russian. If in English, respond in English. Never switch languages without explicit request.

- Code, file paths, terminal commands, git commit messages - always English
- Chat messages, explanations, worklog - match user's language
- Before each response verify: "Am I writing in the same language as the user?"

## 2. Git Workflow Rules

### 2.1 Backup Before Rewrite

Before any git operation that rewrites history (rebase, merge, pull, reset --hard):

1. `git stash push -m "pre-op-backup"`
2. `cp -r src/ /tmp/src-backup/`
3. `git log --oneline -20 > /tmp/git-log-backup.txt`

### 2.2 Force Push Over Rebase

When `git push` is rejected (diverged branches):

- `git push --force origin main` - CORRECT
- `git pull --rebase` - FORBIDDEN (blocks sandbox environment on conflict)

### 2.3 Never Pull After Remote URL Change

After `git remote set-url origin <url>`:

- `git push --force origin main` - CORRECT
- `git pull` - FORBIDDEN (creates unnecessary conflicts)

### 2.4 No Panic Diagnostics

Before telling the user data is lost, check ALL 5 paths:

1. `ls src/app/` - do files exist?
2. `ls .git/rebase-merge/` - is rebase paused?
3. `git reflog` - are commits referenced?
4. `ls /tmp/src-backup-*/` - were backups created?
5. `git fsck --lost-found` - dangling objects?

NEVER say "permanently lost" until all 5 checks are exhausted.

### 2.5 Always Push After Commit

After EVERY `git commit` -- MANDATORY `git push origin main` (no exceptions).

- One commit = one push. NEVER accumulate multiple commits without pushing.
- If push is rejected -- use `git push --force-with-lease origin main`, NOT `git pull --rebase`.
- NEVER use `git pull --rebase` (only `git pull --no-rebase` is allowed).

### 2.6 Stash Before Conflict-Prone Operations

Before any git operation that may cause a conflict:

1. `git stash push -m "pre-conflict-backup"`
2. `git push origin main`

### 2.7 Log Everything

After every git operation, log to `worklog.md`: operation, hash before/after, result.

## 3. Project Environment

Project-specific settings are defined in **`PROJECT_CONFIG.md`**.
If that file exists, it contains:

- Stack signature (e.g., `Built with: Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma + shadcn/ui + Framer Motion + Zustand`)
- Dev server command and port
- Project paths (entry points, config locations)
- Environment-specific notes

If `PROJECT_CONFIG.md` does not exist, the agent MUST ask the user
for the stack and project structure before proceeding.

## 4. Code Standards

This toolkit enforces the following standards. All files referenced below
are in the `standards/` directory.

### 4.1 No-Unicode Policy v2.1

> File: `standards/No-Unicode_Policy_v2.1.md`
> Levels: **[C] Critical** (code, UI) + **[W] Warning** (AI-communication, docs) + **[I] Info** (prototypes, internal)

Prohibits emoji and Unicode graphic characters in:
- Source code and UI text **[C]**
- AI agent chat responses **[W]** -- user messages are NOT regulated
- Project documentation **[W]** (subject to MARKDOWN_STANDARD)

Exceptions:
- `(ref)` marking in tables and code blocks for identification purposes
- Typographic characters (em dash, copyright, degree) in plain text only
- Cyrillic characters in Russian-language content

### 4.2 MARKDOWN_STANDARD v2.1

> Files: `standards/MARKDOWN_STANDARD_RU_v2.1.md`, `standards/MARKDOWN_STANDARD_EN_v2.1.md`
> Level: **[W] Warning**

Governs formatting of all .md files in the project:
- ASCII + Cyrillic + typographic characters in text
- No Unicode in headings, code, or tables (except `(ref)`)
- 4 backticks for nested code blocks, language tags required
- Dash `-` for unordered lists
- Stack signature format: `Built with: <project technologies>`
  (default value defined in `standards/README_TEMPLATE.md`)

### 4.3 REPRODUCIBILITY-STANDARD

> File: `standards/REPRODUCIBILITY-STANDARD.md`
> Level: **[C] Critical**

Ensures `clone + install + dev = works` on any machine. Key rules:
- `.env.example` required with all variables and safe defaults
- Relative paths only (no `/home/`, `http://localhost:` in code)
- SQLite: `connection_limit=1`, relative path via `path.resolve()`
- Error handling: generic messages to client, no Prisma error leakage
- Anti-fragility: non-critical ops must not break critical ones
- Dark theme required via CSS variables
- No dead packages in dependencies
- Auto-backup before every write mutation
- Deduplication-first on all create endpoints
- Safe delete with explicit confirmation for all entities

See the full document for 11 rules across 4 levels (Environment, Code, Delivery, Process).

### 4.4 Implementation Order

Standards must be applied in a specific order.
See `standards/ПОРЯДОК_внедрения_стандартов.md` for the full 6-step sequence.

## 5. Diagnostic Disclosure

Severity ladder for communicating problems:

| Certainty | Phrase |
|-----------|--------|
| File exists | "File X is present, Y lines" |
| Not found | "File X not found, checking alternatives..." |
| All checks exhausted | "File X not found after exhaustive search. Options: A, B, C" |
| All recovery failed | "File X could not be recovered. You may need to recreate it." |

Never jump to the last row without passing through all previous rows.

## 6. Planning Rule

For tasks that require more than 3 steps, write a plan in `worklog.md` BEFORE writing code.

- Tasks 1-3 steps: just do it, log after
- Tasks 4-10 steps: write a brief plan in worklog, then execute
- Tasks 10+ steps: write a detailed plan, show user for confirmation before starting

See `instructions/writing-plans.md` for full details.

## 7. Skills to Use

| Skill | When to Use |
|-------|-------------|
| `api-retry` | Making HTTP requests to external APIs, encountering 502/503/504 errors |
| `health-check` | Checking availability of chat.z.ai, monitoring API response times |
| `fallback` | chat.z.ai is unavailable, need alternative providers |
| `git-safe-ops` | Before any git push/pull/rebase/merge with remote |
| `dev-watchdog` | Starting, restarting, or checking dev server |

## 8. Instructions to Follow

| Instruction | File |
|-------------|------|
| Onboarding Protocol | `instructions/onboarding-protocol.md` |
| Git Workflow Rules | `instructions/git-workflow-rules.md` |
| Language Rule | `instructions/language-rule.md` |
| Diagnostic Disclosure | `instructions/diagnostic-disclosure.md` |
| Writing Plans | `instructions/writing-plans.md` |

## 9. Document Classification

This toolkit organizes files into two groups:

### Group B -- Governance (standards)

Apply FIRST. Define rules that all other documents must follow.

| File | Version | Level | Purpose |
|------|---------|-------|---------|
| `MARKDOWN_STANDARD_RU_v2.1.md` | v2.1.4 | [W] | Markdown formatting rules (Russian) |
| `MARKDOWN_STANDARD_EN_v2.1.md` | v2.1.4 | [W] | Markdown formatting rules (English) |
| `No-Unicode_Policy_v2.1.md` | v2.1.3 | [C]+[W]+[I] | Unicode/emoji prohibition |
| `README_TEMPLATE.md` | v2.1 | -- | Mandatory README structure + stack default |
| `ПОРЯДОК_внедрения_стандартов.md` | v2.0 | -- | Implementation sequence (6 steps) |
| `REPRODUCIBILITY-STANDARD.md` | v1.0 | [C] | Clone+install+dev = works |

### Group A -- Operational (templates)

Deploy AFTER Group B. These SUBMIT to Group B standards.

| File | Version | Purpose |
|------|---------|---------|
| `WORKLOG.md` | v2.1.1 | Agent work journal (deployed as `worklog.md`) |
| `TASK_TEMPLATE.md` | v2.1.1 | Sub-agent prompt templates |
| `README_WORKLOG.md` | v2.1.1 | Worklog system guide |

### Infrastructure (non-standard)

| File | Purpose |
|------|---------|
| `AGENT_RULES.md` | This file -- agent behavioral rules |
| `PROJECT_CONFIG.md` | Project-specific settings (stack, paths, server) |
| `instructions/*.md` | Detailed behavioral instructions |

## Sandbox Z.ai

- Файловая система общая между чатами. Файлы не удаляются между сессиями.
- Shell процесс умирает с чатом. Файлы остаются.
- При блокировке (ошибка `needs merge`): `rm -rf .git/rebase-merge .git/rebase-apply && rm -f .git/MERGE_HEAD && git reset --hard HEAD` — ТОЛЬКО из нового чата.

## Правила поведения

- НЕ создавать функции, страницы, компоненты без запроса
- НЕ «улучшать» проект без запроса
- НЕ переименовывать, НЕ перемещать, НЕ удалять файлы без запроса
- Перед коммитом: `git diff` — убедиться что изменено только запрошенное
- Перед push: `git log --oneline -5` — убедиться что нет лишних коммитов
- При старте: `git remote -v` — если нет origin, привязать к GitHub

## Проект в Sandbox

- Рабочая директория sandbox: `/home/z/my-project/`
- Основной проект ДОЛЖЕН находиться в `/home/z/my-project/` — sandbox автоматически запускает dev-сервер отсюда
- НЕ создавать отдельные папки для клонов проекта
- После git clone — переместить содержимое в `/home/z/my-project/`
- При старте: `cd /home/z/my-project && git remote -v` — убедиться что remote привязан к GitHub

## Запуск dev-сервера

Правильный способ запуска (процесс выживает после завершения bash):

````bash
cd /home/z/my-project && npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 &
disown
sleep 8
````

НЕ запускать без `disown` — bash убьёт дочерний процесс при завершении.
НЕ использовать `bun dev` — процесс умирает быстрее.

---

Built with: Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma + shadcn/ui + Framer Motion + Zustand
