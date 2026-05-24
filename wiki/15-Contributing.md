# 🤝 Contribuer

## Prérequis

| Outil | Version |
|-------|---------|
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ (ou Supabase) |
| Git | 2.30+ |

---

## Setup de développement

```bash
git clone https://github.com/ralphgabriel04/dpm-calendar.git
cd dpm-calendar
npm install
cp .env.example .env.local
# Configurer DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY
npm run db:migrate
npm run dev
```

---

## Architecture du code

### Feature-First

Le code est organisé par **domaine métier** (vertical slices), pas par couche technique :

```
src/features/[module]/
├── components/    # React components
├── server/        # tRPC routers + services
├── hooks/         # React hooks
├── lib/           # Utilities
└── types/         # TypeScript types
```

> Voir [[02-Architecture-Overview]] et [ADR-001](docs/decisions/001-feature-first-architecture.md).

### Conventions

| Élément | Convention |
|---------|-----------|
| Composants | PascalCase (`EventModal.tsx`) |
| Fichiers utilitaires | camelCase (`nlp-parser.ts`) |
| Routers tRPC | camelCase.router.ts |
| Stores | camelCase.store.ts |
| Modèles Prisma | PascalCase |
| Enums | SCREAMING_SNAKE |
| Branches | kebab-case (`feature/focus-timer`) |

---

## Git Conventions

### Branches

| Préfixe | Usage |
|---------|-------|
| `feature/` | Nouvelle feature |
| `fix/` | Bug fix |
| `refactor/` | Refactoring |
| `docs/` | Documentation |
| `chore/` | Maintenance |
| `wave-X/` | Batch de features (wave) |

### Conventional Commits

```
feat: add focus timer engine (#117)
fix: correct sync push direction (#134)
refactor: migrate calendar feature to src/features/
docs: add Loi 25 incident register
chore: remove dead exports
test: add Vitest setup and 25 tests
ci: add GitHub Actions workflows
```

Format : `type(scope?): description (#issue?)`

---

## Code Standards

### TypeScript

- **Strict mode** activé (`strict: true` dans tsconfig.json)
- **Pas de `any`** — utiliser `unknown` ou des types spécifiques
- **Zod** pour la validation de toutes les inputs tRPC
- **Path alias** : `@/` → `./src/`

### React

- **React Server Components** par défaut
- **Client Components** uniquement quand nécessaire (`"use client"`)
- **Zustand** pour l'état UI (pas de React Context pour le state)
- **tRPC + TanStack Query** pour le server state

### Tailwind CSS

- **Dark mode** via classe (`darkMode: ["class"]`)
- **CSS variables** pour les couleurs (HSL)
- **Accent** : `#8b5cf6` (violet)
- Utiliser `cn()` pour le merging de classes

---

## Testing

### Framework : Vitest

```bash
npm test           # Run unique
npm run test:watch # Watch mode
```

### Structure

```
tests/
├── helpers/trpc-test-utils.ts  # Mock DB, tRPC instance
├── routers/*.test.ts           # Tests des routers
├── utils/*.test.ts             # Tests des utilitaires
└── *.test.ts                   # Tests des modules
```

### Écrire un test de router

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb, createTestTRPC, createTestContext } from "../helpers/trpc-test-utils";

const mockDb = createMockDb();

vi.mock("@/infrastructure/db/client", () => ({ db: mockDb }));
vi.mock("@/infrastructure/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 100 })),
}));

// ... mock context et procedures
// Import router after mocks
// Create caller and test
```

### Couverture actuelle

| Module | Tests |
|--------|-------|
| Event Router | 42 |
| Task Router | 45 |
| Calendar Router | 22 |
| User Router | 18 |
| Habit Router | 24 |
| Chronotype | 15 |
| NLP Parser | 11 |
| Recurrence | 14 |
| AI Scheduler | 10 |
| Crypto | 5 |
| Rate Limit | 5 |
| Focus Block | 5 |
| Sync Conflict | 5 |
| **Total** | **222** |

---

## Design System

### Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| Primary | `#8b5cf6` (violet) | Accent principal |
| Background | CSS var (HSL) | Arrière-plan |
| Foreground | CSS var (HSL) | Texte |
| Muted | CSS var (HSL) | Éléments secondaires |
| Destructive | CSS var (HSL) | Actions dangereuses |

### Typographie

- **Police** : Inter (Google Fonts)
- **Tailles** : Système par défaut Tailwind

### Composants UI

Basés sur **Radix UI** (via shadcn/ui pattern) :
- Button, Input, Dialog, Popover, Select, Switch, Checkbox, Tooltip
- DatePicker, TimePicker, ColorPicker
- DropdownMenu, Badge, Avatar

### Principes

| Principe | Valeur |
|----------|--------|
| Dark-first | Thème sombre par défaut |
| Touch targets | 44px minimum |
| WCAG | 2.1 AA |
| Responsive | Mobile-first |

---

## Performance

### Cibles

| Métrique | Cible |
|----------|-------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| API p95 | < 500ms |

---

## Definition of Done

Une feature est "done" quand :

- [ ] Code TypeScript sans `any`
- [ ] Tests unitaires écrits et passants
- [ ] Validation Zod sur les inputs
- [ ] Pas de console.log ou code debug
- [ ] Responsive (mobile + desktop)
- [ ] Dark mode supporté
- [ ] i18n (FR + EN) si applicable
- [ ] PR reviewée et mergée
- [ ] Issue GitHub fermée

---

## CI/CD

### GitHub Actions

| Workflow | Déclencheur | Timeout |
|----------|-----------|---------|
| `ci.yml` | Push main, PRs | 15 min |
| `lint.yml` | Push main, PRs | 10 min |

### Pipeline CI

1. Checkout
2. Setup Node.js 20
3. `npm ci`
4. `prisma generate` + `prisma validate`
5. `tsc --noEmit` (type-check)
6. `npm run build` (Next.js build)
7. `npm test` (Vitest)

---

## Scrum

| Propriété | Valeur |
|-----------|--------|
| Sprint | 1 semaine |
| Story Points | Fibonacci (1, 2, 3, 5, 8, 13) |
| Cérémonies | Planning, Daily, Review, Retro |
| Board | GitHub Issues + Labels |
