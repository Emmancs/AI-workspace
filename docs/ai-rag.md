# Workspace AI Assistant & RAG Pipeline

FlowAI Workspace includes an AI engine that understands the context of documents, project tasks, discussions, and inline comments within a team's workspace.

---

## 🔄 RAG Pipeline Architecture

```text
  Workspace Entity (Doc / Task / Discussion)
                     │
                     ▼
             Text Extraction
                     │
                     ▼
           Chunking (500 tokens)
                     │
                     ▼
      OpenAI Embeddings (1536 dims)
                     │
                     ▼
        PostgreSQL + pgvector Index
                     │
                     ▼
    Semantic Search (Filtered by workspaceId)
                     │
                     ▼
         Relevant Context Injection
                     │
                     ▼
           LLM Output + Sources
```

---

## 🔒 Tenant Isolation & Privacy Rules

1. **Workspace Boundary**: Multi-tenant isolation is enforced at vector database queries. Every embedding store and retrieval operation must explicitly match `workspaceId`.
2. **Context Verification**: If retrieval produces zero matches within the current workspace, the AI assistant explicitly states that no workspace context was found, preventing hallucination.
3. **Usage Tracking**: Every AI operation logs token consumption in `AIUsageLog` for analytics and billing monitoring.
