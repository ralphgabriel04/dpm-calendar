# Architecture Decision Records (ADRs)

This document indexes all Architecture Decision Records for DPM Calendar.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

**Format**: [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records)

---

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-001](./docs/decisions/001-feature-first-architecture.md) | Feature-First Architecture | Accepted | 2024-04-03 |
| [ADR-002](./docs/decisions/002-authentication-strategy.md) | Authentication Strategy with NextAuth.js | Accepted | 2024-03-15 |
| [ADR-003](./docs/decisions/003-database-choice.md) | PostgreSQL with Supabase | Accepted | 2024-03-10 |
| [ADR-004](./docs/decisions/004-state-management.md) | React Query + tRPC for Server State | Accepted | 2024-03-12 |
| [ADR-005](./docs/decisions/005-internationalization.md) | next-intl for i18n | Accepted | 2024-03-20 |
| [ADR-006](./docs/decisions/006-focus-timer-persistence.md) | LocalStorage for Focus Sessions | Accepted | 2024-04-04 |
| [ADR-007](./docs/decisions/007-push-notifications.md) | Web Push API over FCM | Accepted | 2024-04-02 |
| [ADR-008](./docs/decisions/008-nlp-date-parsing.md) | chrono-node for Date Parsing | Accepted | 2024-04-02 |

---

## ADR Template

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded by [ADR-XXX]

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Drawback 1
- Drawback 2

### Neutral
- Trade-off 1

## Alternatives Considered
1. Alternative A - Why rejected
2. Alternative B - Why rejected

## References
- Link to relevant documentation
- Link to related issues/PRs
```

---

## ADR Summaries

### ADR-001: Feature-First Architecture

**Context**: As the codebase grew, the traditional layer-first architecture (components/, hooks/, api/) became difficult to navigate and maintain.

**Decision**: Adopt feature-first architecture with `src/features/` containing self-contained feature modules.

**Consequences**: Better code organization, easier onboarding, clear ownership boundaries.

---

### ADR-002: Authentication Strategy with NextAuth.js

**Context**: Need secure authentication supporting multiple providers and enterprise SSO.

**Decision**: Use NextAuth.js with Google, GitHub OAuth, and OIDC for enterprise SSO.

**Consequences**: Industry-standard security, easy provider addition, session management handled automatically.

---

### ADR-003: PostgreSQL with Supabase

**Context**: Need a reliable, scalable database with good DX and managed infrastructure.

**Decision**: Use Supabase (managed PostgreSQL) with Prisma ORM.

**Consequences**: Strong typing, easy migrations, RLS for multi-tenancy, real-time subscriptions available.

---

### ADR-004: React Query + tRPC for Server State

**Context**: Managing server state with complex caching requirements and type safety needs.

**Decision**: Use tRPC for type-safe API layer with React Query for caching and synchronization.

**Consequences**: End-to-end type safety, automatic cache invalidation, optimistic updates.

---

### ADR-005: next-intl for Internationalization

**Context**: Application needs French and English support with potential for more languages.

**Decision**: Use next-intl with JSON message files and App Router integration.

**Consequences**: Clean separation of translations, server-side rendering support, easy to add new locales.

---

### ADR-006: LocalStorage for Focus Sessions

**Context**: Focus timer needs to persist across page refreshes and work offline.

**Decision**: Store focus session state in localStorage with periodic server sync.

**Consequences**: Offline support, instant recovery on refresh, eventual consistency with server.

---

### ADR-007: Web Push API over FCM

**Context**: Need push notifications for reminders and time-sensitive alerts.

**Decision**: Use native Web Push API with VAPID instead of Firebase Cloud Messaging.

**Consequences**: No vendor lock-in, works with service workers, smaller bundle size.

---

### ADR-008: chrono-node for Date Parsing

**Context**: Quick capture feature needs natural language date parsing in French and English.

**Decision**: Use chrono-node library for NLP date extraction.

**Consequences**: Excellent FR/EN support, battle-tested library, handles relative dates well.

---

## Process

### Creating a New ADR

1. Copy the template above
2. Assign the next sequential ID
3. Write the ADR with full context
4. Submit as PR for review
5. Update this index when merged

### Lifecycle

- **Proposed**: Under discussion
- **Accepted**: Approved and implemented
- **Deprecated**: No longer recommended
- **Superseded**: Replaced by a newer ADR

---

## Related Documents

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Roadmap](./ROADMAP.md)
- [Changelog](./CHANGELOG.md)
