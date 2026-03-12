# Forge - AI Workforce Orchestration Platform

## Project Overview
Forge is a local-first AI workforce orchestration platform. Specialized AI agents (Architect, Tech Lead, Backend Dev, Frontend Dev, QA, E2E Tester, Security Auditor, DevOps) work as a coordinated dev team, visible on a real-time dark dashboard.

## Tech Stack
- **Framework**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui v4 (base-ui, dark theme)
- **State**: Zustand (client), React Server Components (server)
- **Real-time**: Server-Sent Events (SSE) via Route Handlers
- **AI**: @anthropic-ai/sdk (direct API, streaming, tool_use loop)
- **Database**: PostgreSQL 17 (single Docker container, `postgres` npm driver)
- **Validation**: Zod v4
- **Testing**: Vitest + React Testing Library + Playwright (to be set up)

## Commands
```bash
pnpm run dev                    # Start dev server (port 3000)
pnpm run build                  # Production build
pnpm run lint                   # ESLint
docker compose up -d            # Start Postgres container
docker compose down             # Stop Postgres container
./scripts/start.sh              # Start DB + backup + dev server
./scripts/stop.sh               # Backup + stop DB
./scripts/backup.sh             # Manual pg_dump backup
./scripts/restore.sh [file]     # Restore from backup
```

## Architecture
- `src/app/(dashboard)/` - Dashboard pages (route group)
- `src/app/api/` - 12 API routes (agents, projects, tasks, workflows, events, stats)
- `src/lib/agents/` - Agent execution (factory, loop, session, cost tracking, definitions)
- `src/lib/tools/` - Tool system with safety policies (file ops, bash, grep, glob, web)
- `src/lib/orchestrator/` - Event bus (with persistence), agent pool, task router, workflow runner, presets
- `src/lib/db/` - Database repository layer (postgresjs queries)
- `src/lib/types/` - Zod schemas and TypeScript types (agent, project, task, workflow, events)
- `src/components/` - UI components (dashboard, agents, console, workflow)
- `src/stores/` - Zustand stores (agent, event, project)

## Key Patterns
- **Agent Loop**: prompt -> Claude API stream -> detect tool_use -> execute tool -> feed tool_result -> continue
- **SSE Streaming**: Agent output streams via POST to `/api/agents/[id]/stream`
- **Agent Pool**: Concurrent agent limit (default 5), auto-queuing, lifecycle management
- **Event Bus**: In-process EventEmitter with batch persistence to PostgreSQL
- **Safety Policies**: Blocked commands (rm -rf, sudo, force push, etc.), path sandboxing, protected files (.env, credentials)
- **Workflow DAG**: Steps with dependencies, parallel execution of independent steps, preset templates
- **Dark Theme**: Custom CSS variables in globals.css, always-dark (`<html class="dark">`)

## Safety
- Agents are sandboxed to their working directory (path validation)
- Destructive bash commands are blocked (see `lib/tools/safety.ts`)
- Protected files (.env, .pem, .key, credentials) cannot be written by agents
- System directories (/, ~, /etc) cannot be used as working directories
- No auth needed - local-only personal tool

## Database
- Single Postgres 17 Alpine container via `docker-compose.yml`
- Docker named volume `forge_data` persists data across container restarts
- Automated pg_dump backups in `./backups/` (kept last 10)
- 6 SQL migrations in `supabase/migrations/` (auto-run on first container start)
- Tables: projects, agents (8 seeded built-in), tasks, workflows, events, cost_tracking
- DB driver: `postgres` (postgresjs) — direct queries, no ORM

## Implemented Phases
- **Phase 1**: Foundation - dark dashboard, agent cards, streaming chat, full tool access
- **Phase 2**: Task system, multi-agent pool, event persistence, admin console, project CRUD
- **Phase 3 (partial)**: Workflow engine, DAG execution, 4 preset templates, workflow canvas UI
