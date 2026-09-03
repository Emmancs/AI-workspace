# FlowAI Workspace 

FlowAI Workspace is a production-ready, AI-native collaborative workspace for individuals and high-performing teams.

It combines document editing, project management, real-time team discussions, and an AI assistant that understands the context and knowledge of the current workspace with strict tenant-level isolation.

---

## Key Features & Vision

- **Collaborative Editor**: Rich Yjs CRDT-based document editor supporting simultaneous real-time document editing, presence cursors, inline comments, and autosave.
- **Kanban & Project Management**: Multi-view project tracker with epics, tasks, priority sorting, assignee tracking, and AI automated task generation from project specifications.
- **Workspace RAG Engine**: Retrieval-Augmented Generation using PostgreSQL `pgvector` storing embedded documents, tasks, and discussion channels with strict workspace authorization filters.
- **Real-Time Discussions**: Channel-based WebSocket discussions with message threads, user mentions, and emoji reactions.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions on NestJS backend (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`).
- **Production Architecture**: Built as a modular monolith ready for horizontal scaling via Redis Pub/Sub.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: Strict TypeScript
- **Styling**: Tailwind CSS (Dark Mode Glassmorphic Aesthetic)
- **Components**: Lucide Icons, Framer Motion, Recharts

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL 16 with `pgvector` extension
- **ORM**: Prisma ORM
- **Cache & Pub/Sub**: Redis
- **Real-time**: WebSockets (Socket.io & Yjs CRDT)

---

## Repository Architecture

```text
flowai-workspace/
├── backend/                  # NestJS Modular Backend API
│   ├── src/
│   │   ├── auth/             # Authentication & OAuth
│   │   ├── users/            # User Management
│   │   ├── workspaces/       # Workspaces & Isolation
│   │   ├── members/          # Member roles & RBAC
│   │   ├── projects/         # Project tracking
│   │   ├── documents/        # Documents & Yjs syncing
│   │   ├── tasks/            # Kanban task management
│   │   ├── discussions/      # Real-time WebSockets channels
│   │   ├── notifications/    # Workspace notifications
│   │   ├── ai/               # AI Assistant & Prompts
│   │   ├── embeddings/       # pgvector RAG Pipeline
│   │   ├── analytics/        # Workspace metrics
│   │   ├── admin/            # Admin system controls
│   │   └── health/           # API Health check
│   └── prisma/
│       └── schema.prisma     # Complete Prisma ORM definitions
├── frontend/                 # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages & layouts
│   │   ├── components/       # Reusable UI & layout components
│   │   └── lib/              # Utilities & helpers
├── docker-compose.yml        # PostgreSQL (pgvector) + Redis + Services
└── README.md
```

---

## Quick Start & Running Locally

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

### 2. Start Database & Redis via Docker
```bash
docker compose up postgres redis -d
```

### 3. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```
Backend API server will start at `http://localhost:4000`. Swagger documentation available at `http://localhost:4000/api/docs`.

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend Web application will start at `http://localhost:3000`.

---

## Testing & Verification

- **Backend Type Check**: `npm --prefix backend run check-types`
- **Frontend Type Check**: `npm --prefix frontend run check-types`
- **Prisma Validate**: `npx --prefix backend prisma validate`

---

## License
UNLICENSED - Production SaaS Portfolio Project.
