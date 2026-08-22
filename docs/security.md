# FlowAI Security & Compliance Guidelines

Security is built into FlowAI Workspace at every architectural layer.

---

## 🔒 Security Practices

1. **Input Validation**: Class-validator DTO validation pipes sanitize and transform incoming REST request payloads.
2. **SQL Injection Protection**: Managed via Prisma ORM parameterized query builder.
3. **Cross-Site Scripting (XSS)**: Next.js automatic React component DOM escaping and Content-Security-Policy header rules.
4. **Password Hashing**: Passwords stored using `bcryptjs` with salt round factor >= 10.
5. **Session Management**: JWT access tokens (short-lived 15m) paired with httpOnly refresh token cookies.
6. **Secrets Handling**: Environment variable isolation, zero hardcoded API keys or database connection credentials.
7. **Audit Logging**: `ActivityLog` entries record high-sensitivity workspace events (member invitations, role modifications, document deletions).
