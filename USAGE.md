# Forge — Usage Guide

## Quick Start

```bash
docker compose up -d          # Start Postgres (~2 seconds)
pnpm run dev                  # Start Next.js dev server
```

Open **http://localhost:3000**

## Commands

| Action | Command |
|---|---|
| Start DB | `docker compose up -d` |
| Start dev server | `pnpm run dev` |
| Start everything (with auto-backup) | `./scripts/start.sh` |
| Stop dev server | `Ctrl+C` |
| Stop DB | `docker compose down` |
| Stop everything (with auto-backup) | `./scripts/stop.sh` |
| Backup DB | `./scripts/backup.sh` |
| Restore latest backup | `./scripts/restore.sh` |
| Restore specific backup | `./scripts/restore.sh backups/forge_YYYYMMDD_HHMMSS.sql` |
| Check DB health | `docker compose ps` |
| View DB logs | `docker compose logs postgres` |
| Wipe & reset DB | `docker compose down -v && docker compose up -d` |
| Production build | `pnpm run build` |
| Lint | `pnpm run lint` |

## Daily Flow

1. `docker compose up -d && pnpm run dev`
2. Open http://localhost:3000
3. Create a project (set working directory to your target repo)
4. Click an agent, set working directory, type a prompt, hit Enter
5. Watch the agent stream responses and execute tools in real-time
6. When done: `Ctrl+C` then `docker compose down`

Data persists across restarts. No re-setup needed.

## Agents

| Agent | Model | Specialty |
|---|---|---|
| The Architect | Opus | System design, architecture |
| Tech Lead | Opus | Task decomposition, code review |
| Backend Dev | Sonnet | APIs, server code, DB |
| Frontend Dev | Sonnet | UI, components, styling |
| QA Engineer | Sonnet | Unit & integration tests |
| E2E Tester | Sonnet | Playwright E2E tests |
| Security Auditor | Opus | Vulnerability scanning |
| DevOps Engineer | Sonnet | Docker, CI/CD, infra |

## Agent Tools

All agents can use real tools on your machine (sandboxed to the working directory):

- **bash** — run shell commands
- **read_file / write_file / edit_file** — filesystem operations
- **grep** — search file contents (ripgrep)
- **glob** — find files by pattern
- **web_fetch / web_search** — fetch URLs, search the web

Safety policies block destructive commands (`rm -rf`, `sudo`, `git push --force`, etc.) and protect sensitive files (`.env`, `.pem`, credentials).

## Workflow Presets

Available on any project's workflow page:

| Preset | Pipeline |
|---|---|
| New Feature | Architect → Backend → Frontend → QA → Security |
| Bug Fix | Tech Lead → Backend → QA → Tech Lead |
| Security Audit | Security → Backend → Security |
| Refactor | Tech Lead → Backend → QA → Tech Lead |

## API Endpoints

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/agents` | GET, POST | List/create agents |
| `/api/agents/:id` | GET, DELETE | Agent detail/delete |
| `/api/agents/:id/stream` | POST | SSE streaming chat |
| `/api/agents/:id/start` | POST | Start agent in pool |
| `/api/agents/:id/stop` | POST | Stop running agent |
| `/api/agents/instruct` | POST | Send instruction to running agent |
| `/api/projects` | GET, POST | List/create projects |
| `/api/tasks` | GET, POST, PATCH | Task CRUD |
| `/api/workflows` | GET, POST | Workflow CRUD |
| `/api/workflows/execute` | POST | Execute workflow DAG |
| `/api/events/stream` | GET | SSE event stream |
| `/api/stats` | GET | Live stats |

## Backups

- Backups are plain SQL files in `./backups/` (gitignored)
- `start.sh` and `stop.sh` auto-backup before starting/stopping
- Last 10 backups are retained, older ones auto-deleted
- Docker named volume `forge_data` preserves data across `docker compose down`
- Only `docker compose down -v` deletes the volume (full reset)
