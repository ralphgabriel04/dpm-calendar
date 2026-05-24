# ADR-001: Feature-First Architecture

## Status
Accepted

## Date
2024-04-03

## Context

As the DPM Calendar codebase grew beyond the initial implementation, the traditional layer-first architecture became increasingly difficult to navigate and maintain:

```
src/
├── components/     # 50+ files
├── hooks/          # 20+ files
├── api/            # 15+ files
├── utils/          # 10+ files
└── types/          # 15+ files
```

Problems encountered:
- Finding related code required jumping between multiple directories
- New features scattered code across 4-5 different folders
- Unclear ownership boundaries between features
- Difficult to onboard new developers
- Circular dependencies between modules

## Decision

Adopt a feature-first (vertical slice) architecture:

```
src/
├── features/
│   ├── calendar/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── server/
│   │   └── types/
│   ├── tasks/
│   ├── habits/
│   ├── wellness/
│   ├── analytics/
│   └── ...
├── shared/
│   ├── components/
│   ├── hooks/
│   └── lib/
└── infrastructure/
    ├── api/
    ├── db/
    └── trpc/
```

Each feature module is self-contained with:
- `components/` - React components
- `hooks/` - React hooks
- `server/` - tRPC routers and server-side logic
- `types/` - TypeScript types (if needed)

## Consequences

### Positive
- **Cohesion**: Related code lives together
- **Discoverability**: Easy to find all code for a feature
- **Ownership**: Clear boundaries for code ownership
- **Isolation**: Features can be developed independently
- **Testing**: Easy to test features in isolation
- **Onboarding**: New developers can focus on one feature

### Negative
- **Initial migration effort**: Required moving 100+ files
- **Import path changes**: All imports needed updating
- **Learning curve**: Team needs to understand new structure

### Neutral
- Shared code needs careful consideration (what goes in shared/ vs feature/)
- Some duplication may occur between features (acceptable trade-off)

## Alternatives Considered

### 1. Keep Layer-First Architecture
- **Rejected**: Problems would only compound as codebase grows

### 2. Micro-Frontend Architecture
- **Rejected**: Overkill for current team size and deployment model

### 3. Monorepo with Packages
- **Rejected**: Added complexity without significant benefits for single-app project

## Implementation

Migration was done in batches:
- Batch 0: Security foundations
- Batches 1-2: Infrastructure & shared layer extraction
- Batch 3: Fix imports after feature renames
- Batches 4.1-4.6: Migrate each feature domain
- Batches 5-6: Final cleanup and validation

## References

- [Bulletproof React Architecture](https://github.com/alan2207/bulletproof-react)
- [Feature-Sliced Design](https://feature-sliced.design/)
- PR: Batches 1-6 migration commits
