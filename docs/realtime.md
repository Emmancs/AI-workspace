# Real-time Collaboration & WebSockets

FlowAI Workspace uses WebSockets and Redis Pub/Sub for real-time features.

---

## ⚡ Collaboration Engine Architecture

1. **Yjs CRDT Document Engine**:
   - Yjs CRDT model guarantees conflict-free document state synchronization.
   - Awareness protocols transmit active cursor positions, selections, and user presence indicators.
   - Autosave worker flushes document updates to PostgreSQL periodically.

2. **Real-time Discussion Channels**:
   - NestJS WebSocket Gateways handle channel connections.
   - Redis Pub/Sub broadcasts incoming messages across multiple backend instances for horizontal scaling.

3. **Notification Service**:
   - Instant web socket pushes for user mentions, task assignments, and document inline comments.
