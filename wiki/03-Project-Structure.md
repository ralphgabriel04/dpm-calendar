# 📁 Structure du projet

## Racine

```
dpm-calendar/
├── .claude/                    # Configuration Claude Code
├── .github/                    # CI/CD et branch protection
│   ├── BRANCH_PROTECTION.md
│   └── workflows/
│       ├── ci.yml              # Build + TypeScript + Tests
│       └── lint.yml            # ESLint
├── docs/                       # Documentation technique
│   ├── compliance/             # Loi 25, incidents, runbook
│   ├── decisions/              # Architecture Decision Records (ADR)
│   └── UX-UI-REDESIGN-REPORT.md
├── message/                    # Fichiers de traduction (i18n)
├── prisma/                     # Schéma et migrations
│   ├── schema.prisma           # 30+ modèles, 20+ enums
│   └── migrations/             # Historique des migrations
├── public/                     # Assets statiques
│   ├── integrations/           # Logos d'intégration
│   ├── sw.js                   # Service Worker
│   └── *.png                   # Logos DPM
├── scripts/                    # Scripts utilitaires
│   ├── encrypt-existing-tokens.ts
│   ├── update-imports-batch1.mjs
│   └── update-imports-batch2.mjs
├── src/                        # Code source principal
├── tests/                      # Tests unitaires
├── wiki/                       # Pages wiki GitHub
├── .env.example                # Template des variables d'environnement
├── ADMIN_LOG.md                # Journal d'administration
├── CHANGELOG.md                # Historique des versions
├── CONTRIBUTING.md             # Guide de contribution
├── DECISIONS.md                # Index des ADR
├── ROADMAP.md                  # Roadmap produit
├── SECURITY.md                 # Politique de sécurité
├── next.config.mjs             # Config Next.js + headers sécurité + CSP
├── package.json                # Dépendances et scripts
├── tailwind.config.js          # Theme et design tokens
├── tsconfig.json               # TypeScript strict mode
├── vercel.json                 # Cron jobs Vercel
└── vitest.config.ts            # Config tests Vitest
```

---

## Source (`src/`)

```
src/
├── app/                        # Next.js App Router
├── features/                   # Modules métier (13)
├── i18n/                       # Configuration next-intl
├── infrastructure/             # Couche technique transversale
├── lib/                        # Utilitaires bas niveau
├── middleware.ts                # Edge auth guard
├── shared/                     # Composants et hooks partagés
├── stores/                     # Zustand state management
└── types/                      # Extensions TypeScript
```

---

## App Router (`src/app/`)

```
app/
├── (auth)/                     # Groupe routes authentification
│   ├── layout.tsx
│   ├── onboarding/             # Onboarding guide
│   └── quick-onboarding/       # Setup rapide
├── (dashboard)/                # Groupe routes protégées
│   ├── layout.tsx              # Auth + onboarding check
│   ├── analytics/              # Tableau de bord analytique
│   ├── calendar/               # Vue calendrier
│   ├── daily-planning/         # Planification quotidienne
│   ├── dashboard/              # Dashboard principal
│   ├── goals/                  # Gestion des objectifs
│   ├── habits/                 # Suivi des habitudes
│   ├── home/                   # Page d'accueil dashboard
│   ├── matrix/                 # Matrice d'Eisenhower
│   ├── planner/                # Planificateur
│   ├── rules/                  # Moteur de règles
│   ├── settings/               # Paramètres utilisateur
│   └── tasks/                  # Gestion des tâches
├── api/                        # Routes API
│   ├── auth/                   # NextAuth + OAuth callbacks
│   │   ├── [...nextauth]/      # Handler NextAuth
│   │   ├── google-calendar/    # Connexion Google Calendar
│   │   └── microsoft-calendar/ # Connexion Microsoft Calendar
│   ├── cron/
│   │   └── sync/               # Job de sync (chaque 5 min)
│   └── trpc/
│       └── [trpc]/             # Endpoint tRPC (GET/POST)
├── login/                      # Page de connexion
├── privacy/                    # Politique de confidentialité
├── terms/                      # Conditions d'utilisation
├── error.tsx                   # Page d'erreur globale
├── globals.css                 # Styles globaux + CSS variables
├── layout.tsx                  # Layout racine (Inter, i18n, Providers)
├── loading.tsx                 # Loading skeleton global
├── not-found.tsx               # Page 404
└── page.tsx                    # Landing page publique
```

---

## Features (`src/features/`)

Chaque module suit la même structure interne :

```
features/[module]/
├── components/                 # Composants React
├── server/                     # Routers tRPC + services
├── hooks/                      # Hooks React spécifiques
├── lib/                        # Utilitaires du module
└── types/                      # Types TypeScript
```

### 13 modules

| Module | Description | Composants clés |
|--------|-------------|-----------------|
| `calendar/` | Calendrier multi-vue, events, récurrence | 6 vues, EventForm, RecurrenceSelector, DnD |
| `tasks/` | Tâches multi-vue, priority cap, checklists | KanbanBoard, EisenhowerMatrix, GanttView |
| `habits/` | Suivi d'habitudes, streaks, goal linking | HabitCard, StreakDisplay, HabitModal |
| `goals/` | Objectifs SMART, progress tracking | GoalCard, SMARTIndicator, GoalModal |
| `focus/` | Timer Pomodoro, anti-procrastination, CBT | FocusMode, MicroCommitment, FocusTaskPicker |
| `wellness/` | Chronotype, energy, journal, rituals | ChronotypeQuiz, EnergyOverlay, MCIIFlow |
| `intelligence/` | IA scheduler, rules engine, experiments | PlanMyDay, RuleModal, ExperimentsList |
| `analytics/` | Dashboard, workload, meeting load | 10+ widgets, ContributionHeatmap |
| `notifications/` | Push notifications, préférences | NotificationSettings |
| `sync/` | Sync Google/Microsoft Calendar | SyncConflictModal, SyncStatus |
| `collaboration/` | Partage, commentaires | (server-only) |
| `auth/` | Onboarding, export, suppression compte | OnboardingFlow, DeleteAccountDialog |
| `home/` | Dashboard home, landing page | DailyOverview, 6 mockups, 8 sections landing |

---

## Infrastructure (`src/infrastructure/`)

```
infrastructure/
├── api/
│   └── root.ts                 # AppRouter (agrège les 25 routers)
├── auth/
│   └── config.ts               # NextAuth v5 (5 providers OAuth + Credentials)
├── db/
│   └── client.ts               # Prisma client singleton
└── trpc/
    ├── client.ts               # Client tRPC (React Query)
    ├── context.ts              # Contexte tRPC (session, db)
    ├── procedures.ts           # Procédures avec rate limiting
    └── server.ts               # Caller RSC côté serveur
```

---

## Shared (`src/shared/`)

```
shared/
├── components/
│   ├── command/                # CommandPalette (Cmd+K)
│   ├── language/               # LanguageToggle (FR/EN)
│   ├── layout/                 # DashboardClient, Sidebar, MobileNav
│   ├── theme/                  # ThemeProvider, ThemeToggle (dark/light)
│   ├── ui/                     # 20+ composants UI (Button, Input, Dialog, etc.)
│   └── providers.tsx           # Global providers wrapper
├── hooks/
│   ├── useDateRange.ts         # Gestion de plages de dates
│   ├── useHydration.ts         # Sécurité SSR hydration
│   └── useMediaQuery.ts        # Détection responsive
└── lib/
    ├── nlp-parser.ts           # Parser langage naturel (FR/EN)
    └── utils.ts                # cn() - Tailwind class merging
```

---

## Stores Zustand (`src/stores/`)

| Store | Fichier | Persistance | Description |
|-------|---------|-------------|-------------|
| Calendar | `calendar.store.ts` | Oui (partiel) | Date courante, vue active, filtres calendrier |
| Task | `task.store.ts` | Oui (partiel) | Vue tâches, filtres, tri, sélection |
| Habit | `habit.store.ts` | Oui (filtres) | Filtres habitudes, modal state |
| Layout | `layout.store.ts` | Oui | Tailles des panneaux, états collapse |
| UI | `ui.store.ts` | Non | Modals, command palette, sidebar |

---

## Tests (`tests/`)

```
tests/
├── helpers/
│   └── trpc-test-utils.ts      # Mock DB, tRPC test instance
├── routers/
│   ├── calendar.test.ts        # 22 tests
│   ├── event.test.ts           # 42 tests
│   ├── habit.test.ts           # 24 tests
│   ├── task.test.ts            # 45 tests
│   └── user.test.ts            # 18 tests
├── utils/
│   ├── nlp-parser.test.ts      # 11 tests
│   └── recurrence.test.ts      # 14 tests
├── aiScheduler.test.ts         # 10 tests
├── chronotype.test.ts          # 15 tests
├── crypto.test.ts              # 5 tests
├── focusBlock.test.ts          # 5 tests
├── rateLimit.test.ts           # 5 tests
├── setup.ts                    # Configuration Vitest
└── syncConflict.test.ts        # 5 tests
```

**Total : 222 tests** (221 passing, 1 faux négatif timezone)

---

## Lib (`src/lib/`)

| Fichier/Dossier | Description |
|-----------------|-------------|
| `crypto.ts` | Chiffrement AES-256-GCM pour tokens OAuth |
| `rateLimit.ts` | Rate limiter in-memory (sliding window) |
| `calendar/` | Utilitaires calendrier (récurrence, positioning, formatting) |
| `google/` | Intégration Google Calendar API |
| `microsoft/` | Intégration Microsoft Graph API |
