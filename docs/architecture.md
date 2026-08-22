# FlowAI Architecture Overview

FlowAI Workspace is structured as a modular full-stack web application designed for high security, low-latency collaboration, and tenant-isolated AI Retrieval-Augmented Generation (RAG).

---

## 🏛️ System Architecture

```text
                                 ┌──────────────────────────────────┐
                                 │         Next.js 15 App           │
                                 │       (React 19 + Tailwind)      │
                                 └────────────────┬─────────────────┘
                                                  │
                                                  │ REST / WebSockets
                                                  ▼
                                 ┌──────────────────────────────────┐
                                 │       NestJS API Gateway         │
                                 │  (Global Pipes, Guards, Filters) │
                                 └────────┬─────────────────┬───────┘
                                          │                 │
                         ┌────────────────┘                 └────────────────┐
                         ▼                                                   ▼
         ┌──────────────────────────────┐                    ┌──────────────────────────────┐
         │    PostgreSQL + pgvector     │                    │          Redis Cache         │
         │   (Prisma ORM Entities)      │                    │     (Pub/Sub & WebSockets)  │
         └──────────────────────────────┘                    └──────────────────────────────┘
```

---

## 🔒 Security & RBAC Enforcements

Authorization is strictly enforced on the NestJS backend using NestJS Guards and Custom Decorators:

- **OWNER**: Full administrative control, billing, member deletion, workspace management.
- **ADMIN**: Project management, document management, task allocation, member invite approvals.
- **EDITOR**: Create & edit documents, tasks, comments, and participate in project discussion channels.
- **VIEWER**: Read-only workspace access.

---

## 🧠 Workspace AI Isolation Policy

Every vector embedding generated from workspace documents, tasks, or discussions is stored alongside a mandatory `workspaceId` metadata field in PostgreSQL (`Embedding` table).

All RAG semantic search queries explicitly include `WHERE workspaceId = :activeWorkspaceId` before vector similarity calculations are processed by the LLM pipeline.
