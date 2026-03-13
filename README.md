# FORGE — AI Workforce Orchestration Platform

<div align="center">

**A command center where specialized AI agents work as a coordinated dev team.**

Built with Next.js 16 &bull; React 19 &bull; Anthropic Claude API &bull; TypeScript

[Getting Started](#getting-started) &bull; [Architecture](#architecture) &bull; [Features](#features) &bull; [Agent Roles](#agent-roles) &bull; [Screenshots](#screenshots)

<br />

<img src="docs/screenshots/dashboard.png" alt="Forge Dashboard — Command Center with 8 AI agents" width="100%" />

<sub>Command Center — monitor and direct your AI workforce in real-time</sub>

</div>

---

## The Problem

Building software with AI today means manually switching between modes (plan, code, test, review), managing separate conversations, losing context between sessions, and mentally orchestrating the workflow yourself. This doesn't scale.

## The Solution

**Forge** provides a single dark-themed dashboard where 8 specialized AI agents work as a coordinated development team. You define the project, and the team self-organizes: the Architect designs, the Backend Dev codes, the QA Engineer tests, the Security Auditor reviews — all visible in real-time where you intervene as the admin.

Each agent has real tool access (file I/O, terminal, web search, code search) and streams its work via SSE. Workflows orchestrate multi-step pipelines where agents hand off work automatically.

---

## Features

- **8 Specialized Agents** — Architect, Tech Lead, Backend Dev, Frontend Dev, QA Engineer, E2E Tester, Security Auditor, DevOps Engineer
- **Real Tool Access** — Agents read/write files, execute shell commands, search code with grep/glob, and fetch web content
- **Streaming Output** — Watch agents think and work in real-time via Server-Sent Events
- **Workflow Engine** — Define multi-step DAG pipelines with dependency resolution and parallel execution
- **4 Workflow Presets** — Full Feature, Bug Fix, Refactor, New Project — ready to run
- **Admin Console** — Send instructions to any running agent mid-execution
- **Per-Project Metrics** — Track tokens, costs, tasks, and events scoped to each project
- **Cost Tracking** — Real-time token counting with per-model pricing (Opus/Sonnet/Haiku)
- **Agent Pool** — Concurrent execution with configurable limits and auto-queuing
- **Safety Policies** — Path sandboxing, blocked destructive commands, protected files
- **Token Optimization** — Tool result truncation, conversation sliding window, role-tuned parameters
- **Dark Theme UI** — Premium agentic aesthetic with glass panels, gradient accents, and glow effects

---

## Screenshots

<table>
<tr>
<td width="50%">

**Dashboard — Command Center**

<img src="docs/screenshots/dashboard.png" alt="Dashboard" />

8 agent cards with status indicators, live stats, activity feed, and admin console

</td>
<td width="50%">

**Agent Execution — Tool Activity**

<img src="docs/screenshots/agent-execution.png" alt="Agent Execution" />

Real-time streaming with tool calls (read_file, write_file), token tracking, and cost display

</td>
</tr>
</table>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (base-ui), custom dark theme |
| State | Zustand (client), React Server Components (server) |
| Real-time | Server-Sent Events via Route Handlers |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) — direct streaming with tool_use |
| Database | PostgreSQL 17 (Docker) with `postgres` driver |
| Validation | Zod v4 |
| Tools | Custom implementations: file ops (Node.js fs), bash (child_process), grep (ripgrep), glob, web fetch |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FORGE DASHBOARD                       │
│              Next.js 16 App Router + Dark UI             │
│                                                          │
│  Agent Cards │ Workflow Canvas │ Admin Console │ Stats   │
└───────────────────────┬─────────────────────────────────┘
                        │ SSE (real-time streaming)
┌───────────────────────┴─────────────────────────────────┐
│              ORCHESTRATION ENGINE                        │
│                                                          │
│  Agent Pool    │  Event Bus      │  Workflow Runner      │
│  (concurrent)  │  (EventEmitter  │  (DAG execution,     │
│                │   + DB persist) │   step handoff)       │
│                                                          │
│  Session Mgr   │  Task Router    │  Cost Tracker         │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────┐
│              AGENT EXECUTION LAYER                       │
│                                                          │
│  Each agent = Claude API session with:                   │
│  - Role-specific system prompt                           │
│  - Scoped tool access (read, write, bash, grep, etc.)   │
│  - Streaming output via SSE                              │
│  - Token-optimized conversation management               │
│                                                          │
│  Architect │ Tech Lead │ Backend │ Frontend │ QA │ ...   │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────┐
│              PostgreSQL 17                               │
│  projects │ agents │ tasks │ workflows │ events │ costs  │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Roles

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **The Architect** | Opus | read, write, grep, glob, web_search | System design, architecture decisions, tech specs |
| **Tech Lead** | Opus | read, grep, glob, bash, web_search | Task decomposition, code review, coordination |
| **Backend Dev** | Sonnet | read, write, edit, bash, grep, glob, web_search, web_fetch | APIs, server code, database queries |
| **Frontend Dev** | Sonnet | read, write, edit, bash, grep, glob | UI components, pages, styling |
| **QA Engineer** | Sonnet | read, write, edit, bash, grep, glob | Unit tests, integration tests, coverage |
| **E2E Tester** | Sonnet | read, write, edit, bash, grep, glob | Playwright tests, user flow validation |
| **Security Auditor** | Opus | read, bash, grep, glob | OWASP scanning, vulnerability detection |
| **DevOps Engineer** | Sonnet | read, write, edit, bash, grep, glob | Docker, CI/CD, deployment configs |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** (recommended) or npm
- **Docker** (for PostgreSQL)
- **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/forge.git
cd forge

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Start PostgreSQL + dev server
./scripts/start.sh

# Or manually:
docker compose up -d          # Start database
pnpm dev                      # Start dev server
```

Open **http://localhost:3000**

### Environment Variables

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://forge:forge_local_dev@127.0.0.1:5432/forge
```

---

## Usage

### Quick Start

1. **Create a project** — Go to Projects → New Project, set a name and working directory
2. **Select your project** — Click the project card to activate it
3. **Click an agent** — The working directory auto-fills from your project
4. **Send a prompt** — Watch the agent work with real-time streaming
5. **Run a workflow** — Go to Workflows, pick a preset, execute

### Workflow Presets

| Preset | Steps | Flow |
|--------|-------|------|
| **Full Feature** | 5 | Architect → Backend → Frontend → QA → Tech Lead review |
| **Bug Fix** | 3 | Tech Lead analyze → Backend fix → QA verify |
| **Refactor** | 4 | Tech Lead plan → Backend refactor → QA test → Security audit |
| **New Project** | 4 | Architect design → Backend scaffold → Frontend UI → DevOps config |

### Admin Console

While agents are running, send real-time instructions:
- Select an agent from the dropdown
- Type your instruction
- It gets injected at the agent's next turn boundary

### Scripts

```bash
./scripts/start.sh              # Start DB + backup + dev server
./scripts/stop.sh               # Backup + stop DB
./scripts/backup.sh             # Manual pg_dump backup
./scripts/restore.sh [file]     # Restore from backup
```

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/            # Dashboard pages (route group)
│   │   ├── page.tsx            # Main command center
│   │   ├── agents/             # Agent registry + detail pages
│   │   ├── projects/           # Project CRUD + workspace
│   │   └── settings/           # System status
│   └── api/                    # 13 API routes
│       ├── agents/             # CRUD, start, stop, stream, instruct
│       ├── projects/           # CRUD + per-project stats
│       ├── workflows/          # CRUD + DAG execution
│       ├── events/stream/      # Global/project SSE stream
│       ├── tasks/              # Task management
│       └── stats/              # System-wide metrics
├── lib/
│   ├── agents/                 # Agent loop, factory, definitions, sessions, costs
│   ├── orchestrator/           # Event bus, agent pool, workflow runner, task router
│   ├── tools/                  # Tool implementations (file, bash, grep, glob, web)
│   ├── db/                     # PostgreSQL repository layer
│   └── types/                  # Zod schemas + TypeScript types
├── components/
│   ├── dashboard/              # Sidebar, topbar, stats, activity feed
│   ├── agents/                 # Agent cards, grid, output terminal
│   ├── console/                # Admin console, prompt input
│   └── workflow/               # DAG canvas, step nodes
└── stores/                     # Zustand (agent, project, event)
```

---

## Token Optimization

Forge is designed for cost-efficient agent execution:

- **Tool result truncation** — Large outputs (bash, file reads, web fetches) are capped before being added to conversation history, preventing token explosion on subsequent turns
- **Conversation sliding window** — Old turns are trimmed when history grows beyond 30 messages, keeping the original prompt and most recent context
- **Role-tuned parameters** — Execution agents (Backend, QA, DevOps) use lower temperature (0.2-0.3) and smaller max_tokens (4096) vs planning agents (Architect, Lead) at 0.5/6144
- **Scoped tool access** — Each agent only gets the tools it needs, reducing per-turn schema overhead
- **Workflow context capping** — Step handoff output is trimmed to 8K chars to prevent massive context in multi-step pipelines
- **Conciseness prompting** — System prompt suffix instructs agents to be direct and avoid filler

---

## Safety

- Agents are sandboxed to their project's working directory via path validation
- Destructive shell commands are blocked (`rm -rf /`, `sudo`, `force push`, etc.)
- Protected files (`.env`, `.pem`, `.key`, credentials) cannot be written by agents
- System directories (`/`, `~`, `/etc`, `/usr`) cannot be used as working directories
- No authentication required — designed as a local-only personal tool

---

## Database

PostgreSQL 17 running in Docker with:
- 6 tables: `projects`, `agents` (8 pre-seeded), `tasks`, `workflows`, `events`, `cost_tracking`
- Auto-migrations on first container start
- Named Docker volume for data persistence
- Automated pg_dump backups (last 10 kept)

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/[id]` | Get agent details |
| POST | `/api/agents/[id]/start` | Start agent on a task |
| POST | `/api/agents/[id]/stop` | Stop a running agent |
| POST | `/api/agents/[id]/stream` | Stream agent execution (SSE) |
| POST | `/api/agents/instruct` | Send instruction to running agent |
| GET/POST | `/api/projects` | List / create projects |
| GET | `/api/projects/[id]/stats` | Per-project metrics |
| GET/POST | `/api/tasks` | List / create tasks |
| GET/POST | `/api/workflows` | List / create workflows |
| POST | `/api/workflows/execute` | Execute a workflow DAG |
| GET | `/api/events/stream` | SSE event stream (filterable by project) |
| GET | `/api/stats` | System-wide statistics |

---

## Roadmap

- [ ] MCP server integration for extensible tools
- [ ] Agent memory/learning across sessions
- [ ] Custom workflow editor (drag-and-drop DAG)
- [ ] Git integration (show diffs, commits by agents)
- [ ] Budget alerts and cost limits
- [ ] Project import/export
- [ ] Mobile-responsive layout

---

## License

MIT

---

<div align="center">
<sub>Built with Claude Opus &bull; Next.js 16 &bull; TypeScript</sub>
</div>
