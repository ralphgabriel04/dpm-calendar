# 🏗️ Architecture

## Vue d'ensemble

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        React["React 18 + Next.js 14"]
        Zustand["Zustand Stores (UI State)"]
        TQ["TanStack Query (Server State)"]
    end

    subgraph Edge["Edge Runtime"]
        MW["Middleware (Auth Guard)"]
    end

    subgraph Server["Next.js Server"]
        RSC["React Server Components"]
        TRPC["tRPC v11.8 (25 routers)"]
        Auth["NextAuth v5"]
        Cron["Vercel Cron (sync /5min)"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma 5.22 ORM"]
        PG["PostgreSQL (Supabase)"]
    end

    subgraph External["External APIs"]
        Google["Google Calendar API"]
        Microsoft["Microsoft Graph API"]
    end

    React --> TQ
    TQ --> TRPC
    React --> Zustand
    MW --> RSC
    RSC --> TRPC
    TRPC --> Prisma
    Prisma --> PG
    Auth --> PG
    TRPC --> Auth
    Cron --> Google
    Cron --> Microsoft
    Cron --> Prisma
```

---

## Patterns architecturaux

### 1. Feature-First Architecture (Vertical Slices)

Le code est organisé par **domaine métier**, pas par couche technique. Chaque feature est autonome et contient ses propres composants, routers, services et types.

```
src/features/
├── calendar/        # Composants + server + types pour le calendrier
├── tasks/           # Composants + server + types pour les tâches
├── habits/          # Composants + server + types pour les habitudes
├── goals/           # Composants + server + types pour les objectifs
├── focus/           # Timer, anti-procrastination, CBT
├── wellness/        # Chronotype, energy, journal, rituals
├── intelligence/    # IA scheduler, rules engine, experiments
├── analytics/       # Dashboard, workload, meeting load
├── notifications/   # Push notifications, preferences
├── sync/            # Google/Microsoft Calendar sync
├── collaboration/   # Sharing, comments
├── auth/            # Onboarding, user management
└── home/            # Home dashboard, landing page
```

> **ADR-001** : Cette décision est documentée dans `docs/decisions/001-feature-first-architecture.md`.

### 2. Router Thin / Service Fat

Les routers tRPC restent légers (validation + délégation). La logique métier complexe est extraite dans des services (ex : `aiScheduler.service.ts`).

### 3. Séparation Server State / UI State

| Type | Outil | Usage |
|------|-------|-------|
| Server State | tRPC + TanStack Query | Données persistées (events, tasks, habits) |
| UI State | Zustand | État éphémère (modals, filtres, vue active) |

### 4. Edge Middleware pour l'Auth

Le middleware Next.js s'exécute en Edge Runtime. Il vérifie la **présence** d'un cookie de session (pas sa validité) pour rediriger rapidement les visiteurs non authentifiés. La validation complète se fait dans le layout dashboard côté serveur.

### 5. Internationalization (i18n)

- `next-intl` avec support serveur et client
- Français par défaut, anglais supporté
- Fichiers de messages dans `/message/`
- Plugin configuré dans `next.config.mjs`

---

## Data Flow : requête typique

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Component
    participant TQ as TanStack Query
    participant T as tRPC Client
    participant S as tRPC Server
    participant P as Prisma
    participant DB as PostgreSQL

    U->>R: Action (ex: créer un event)
    R->>TQ: useMutation()
    TQ->>T: event.create(input)
    T->>S: POST /api/trpc/event.create
    S->>S: Auth check (protectedProcedure)
    S->>S: Rate limit check (100 mutations/min)
    S->>S: Zod validation
    S->>P: db.event.create(data)
    P->>DB: INSERT INTO Event
    DB-->>P: Event row
    P-->>S: Event object
    S-->>T: SuperJSON response
    T-->>TQ: Parsed result
    TQ-->>R: data + invalidateQueries
    R-->>U: UI update
```

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichiers composants | PascalCase | `EventModal.tsx` |
| Fichiers utilitaires | camelCase | `nlp-parser.ts` |
| Routers tRPC | camelCase.router.ts | `event.router.ts` |
| Stores Zustand | camelCase.store.ts | `calendar.store.ts` |
| Modèles Prisma | PascalCase | `CalendarSection` |
| Enums Prisma | SCREAMING_SNAKE | `PENDING_PUSH` |
| Variables d'env | SCREAMING_SNAKE | `ENCRYPTION_KEY` |
| Branches Git | kebab-case | `wave-3-p2-batch` |

---

## Infrastructure de déploiement

| Service | Rôle |
|---------|------|
| **Vercel** | Hébergement Next.js, Edge Functions, Cron Jobs |
| **Supabase** | PostgreSQL managé, Row Level Security |
| **GitHub Actions** | CI (build + lint + tests) |

### Cron Jobs

| Job | Fréquence | Endpoint |
|-----|-----------|----------|
| Calendar Sync | Toutes les 5 minutes | `/api/cron/sync` |

Ce job synchronise les calendriers externes (Google, Microsoft) : refresh des tokens expirés, pull des events, push des events locaux, détection de conflits.
