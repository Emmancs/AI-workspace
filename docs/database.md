# FlowAI Database Schema Documentation

FlowAI Workspace uses PostgreSQL 16 with the `pgvector` extension and Prisma ORM.

## Entity Overview

| Entity | Primary Key | Description |
|---|---|---|
| `User` | UUID | User authentication accounts, profile avatar, job titles, admin flags |
| `Account` | UUID | OAuth providers (Google, GitHub) |
| `Session` | UUID | Active refresh session tokens |
| `Workspace` | UUID | Tenant boundaries, workspace name, slug, logo, settings |
| `WorkspaceMember` | UUID | Maps User to Workspace with `WorkspaceRole` (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`) |
| `WorkspaceInvitation` | UUID | Email invitations with secret token, expiration, and status |
| `Project` | UUID | Workspace projects, statuses (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`) |
| `ProjectMember` | UUID | Maps User to Project |
| `Document` | UUID | Collaborative docs with Yjs JSON content and plainText for indexing |
| `DocumentVersion` | UUID | Historical document snapshots |
| `Comment` | UUID | Inline document comments and thread resolutions |
| `CommentReply` | UUID | Replies to inline document comments |
| `Task` | UUID | Kanban tasks (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) & priorities |
| `TaskLabel` | UUID | Task categorization tags and color indicators |
| `DiscussionChannel` | UUID | Workspace discussion channels |
| `Message` | UUID | Real-time chat messages with threading support |
| `MessageReaction` | UUID | Emoji reactions on discussion messages |
| `Notification` | UUID | In-app user notifications |
| `ActivityLog` | UUID | System audit logs tracking actor actions |
| `AIConversation` | UUID | Workspace AI Assistant chat conversations |
| `AIMessage` | UUID | Chat history messages with source citations |
| `AIUsageLog` | UUID | Token tracking, cost estimation, and model usage analytics |
| `Embedding` | UUID | Pgvector 1536-dimensional vector store with workspace filtering |

---

## Indexing Strategy

- **Foreign Key Indexes**: All foreign keys explicitly index lookup fields for high-performance joins.
- **Tenant Isolation Indexing**: `workspaceId` is indexed across all workspace entities.
- **Compound Indexes**: `(workspaceId, userId)` on `WorkspaceMember`, `(projectId, userId)` on `ProjectMember`.
- **Search Indexes**: `slug` on `Workspace`, `token` on `WorkspaceInvitation`, `email` on `User`.
