# FlowAI REST API Specifications

The FlowAI Backend exposes clean, RESTful API endpoints prefixed under `/api`.

All API responses follow a uniform JSON structure:

### Success Response Format:
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-08-22T23:15:00.000Z"
}
```

### Error Response Format:
```json
{
  "success": false,
  "message": "Resource not found",
  "errorCode": "DOCUMENT_NOT_FOUND",
  "errors": null,
  "path": "/api/documents/doc-123",
  "timestamp": "2026-08-22T23:15:00.000Z"
}
```

---

## Core Route Definitions

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate & obtain JWT
- `POST /api/auth/logout` - Invalidate session
- `POST /api/auth/refresh` - Refresh access token

### Workspaces & Members
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Fetch workspace details
- `PATCH /api/workspaces/:id` - Update settings
- `DELETE /api/workspaces/:id` - Delete workspace (OWNER only)
- `GET /api/workspaces/:id/members` - List workspace members
- `POST /api/workspaces/:id/invitations` - Send email invitation

### Projects & Tasks
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/tasks` - List tasks with status/priority filters
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update status/priority/assignee

### Documents & Collaboration
- `GET /api/documents` - List workspace documents
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Fetch document
- `PATCH /api/documents/:id` - Update document

### Workspace AI Assistant & RAG
- `POST /api/ai/chat` - Chat with workspace AI
- `POST /api/ai/summarize` - Summarize selected document
- `POST /api/ai/generate-tasks` - Generate tasks from spec
- `POST /api/ai/search` - Hybrid semantic search across workspace
