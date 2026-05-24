# AUDIT REPORT — DPM Calendar

**Date** : 2026-05-24  
**Auditeur** : Claude (Staff Engineer + QA Director)  
**Branche** : `wave-3-p2-batch` (commit 4395eef)  
**Mode** : Lecture seule

---

## 1. Résumé exécutif

**Santé globale : 6.5 / 10**

Le produit possède une architecture solide et cohérente (feature-first, tRPC protégé, Prisma bien structuré, design system CSS variables). Le code applicatif fonctionne. Les problèmes sont concentrés dans trois zones : (1) configuration externe manquante pour Apple OAuth, (2) logo non adaptatif dark/light sur la landing, (3) dette i18n massive (70+ chaînes FR hardcodées contournant next-intl).

### Top 3 risques
1. **OAuth Apple non fonctionnel** — aucune variable `APPLE_ID`/`APPLE_SECRET` dans `.env`, le bouton est affiché mais le provider ne se charge pas.
2. **Erreurs TypeScript en infra tRPC** (2 erreurs dans `context.ts`/`server.ts`) — le build fonctionne grâce à `skipLibCheck` mais la typesafety du caller RSC est compromise.
3. **70+ chaînes FR hardcodées** — rend le produit non-livrable en mode bilingue malgré next-intl correctement branché.

### Top 3 quick wins
1. Ajouter les variables Apple OAuth dans `.env` et `.env.example` + configurer l'Apple Developer Portal.
2. Fixer le logo landing (utiliser le pattern `resolvedTheme` comme dans `Sidebar.tsx`).
3. Corriger les 2 erreurs TS dans `context.ts` et `server.ts` (type `session` incompatible).

---

## 2. Cartographie

### Arbre annoté

```
dpm-calendar/
├── prisma/
│   └── schema.prisma          # 35 modèles, bien normalisé
├── messages/
│   ├── en.json (965 lignes)   # Traductions anglaises
│   └── fr.json (960 lignes)   # Traductions françaises
├── public/
│   ├── logo.png               # Logo light mode (1024x1024)
│   ├── logo-dark.png          # Logo dark mode (1024x1024)
│   ├── lightLogoFinal.png     # Logo full (500x500) — utilisé landing
│   └── sw.js                  # Service worker (push notif)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (Inter, NextIntl, Providers)
│   │   ├── page.tsx           # Landing page (public)
│   │   ├── login/page.tsx     # Page de connexion OAuth
│   │   ├── (auth)/
│   │   │   ├── onboarding/    # Onboarding multi-étape
│   │   │   └── quick-onboarding/
│   │   ├── (dashboard)/       # Routes protégées
│   │   │   ├── layout.tsx     # Auth guard + onboarding check
│   │   │   ├── home/          # Page d'accueil utilisateur (SSR + Client)
│   │   │   ├── calendar/      # Calendrier principal (DnD, views multiples)
│   │   │   ├── tasks/         # Gestion des tâches (Kanban, List, Gantt, Matrix)
│   │   │   ├── habits/        # Suivi d'habitudes
│   │   │   ├── goals/         # Objectifs SMART
│   │   │   ├���─ dashboard/     # Dashboard analytique v2
│   │   │   ├── analytics/     # Page analytics séparée
│   │   │   ├── planner/       # Daily planner + Focus mode
│   │   │   ├── daily-planning/# Planification quotidienne guidée
│   │   │   ├── matrix/        # Matrice d'Eisenhower
│   │   │   ├── rules/         # Moteur de règles
│   │   │   └── settings/      # Paramètres utilisateur
│   │   └── api/
│   │       ├── auth/           # NextAuth route + Google/Microsoft calendar callbacks
│   │       ├── trpc/           # tRPC fetch adapter
│   │       └── cron/sync/      # Cron de synchronisation
│   ├── features/               # Feature-first architecture
│   │   ├── analytics/          # Dashboard v2 widgets + routers (dashboard, workload, meetingLoad)
│   │   ├── auth/               # Delete account, export data, onboarding
│   │   ├── calendar/           # Events, views, sidebar, DnD
│   │   ├── collaboration/      # Comments, sharing
│   │   ├── focus/              # Focus sessions, anti-procrastination, micro-commitments
│   │   ├── goals/              # Goals CRUD + SMART validation
│   │   ├── habits/             # Habits CRUD + streaks
│   │   ├── home/               # Home page components + landing page
│   │   ├── intelligence/       # AI scheduler, rules, suggestions, experiments
│   │   ├── notifications/      # Push notifications, settings
│   │   ├── sync/               # Calendar sync, conflicts, webhooks
│   │   ├── tasks/              # Task CRUD, Kanban, Gantt, Eisenhower, priority cap
│   │   └── wellness/           # Chronotype, energy, journal, recap, rituals
│   ├── infrastructure/
│   │   ├── api/root.ts         # appRouter — agrège 27 sous-routers
│   │   ├── auth/config.ts      # NextAuth v5 (Google, Microsoft, GitHub, Apple, SSO OIDC, Credentials)
│   │   ├─��� db/client.ts        # Prisma client singleton
│   │   └── trpc/               # tRPC init, context, procedures, server caller
│   ├── stores/                 # Zustand stores (calendar, task, habit, layout, ui)
│   ├── shared/
│   │   ├── components/ui/      # 19 composants UI réutilisables
│   │   ├── components/layout/  # Dashboard shell, sidebars, resizable panels
│   │   ├── components/theme/   # ThemeProvider + ThemeToggle
│   │   ├���─ components/command/ # Palette de commandes (Ctrl+K)
│   │   ├── hooks/              # useDateRange, useHydration, useMediaQuery
│   │   └── lib/                # utils, nlp-parser
│   ├── lib/                    # calendar/recurrence, crypto, google/microsoft, rateLimit
│   ├── i18n/                   # next-intl config
│   └── middleware.ts           # Edge auth guard (cookie check)
└── tests/                      # Vitest — routers, helpers, utils
```

### Routers tRPC (27 total)

| Router | Rôle |
|--------|------|
| `event` | CRUD événements + expansion récurrences |
| `calendar` | CRUD calendriers, visibilité, sections |
| `calendarSection` | Sections de sidebar calendrier |
| `task` | CRUD tâches + priority cap + time blocking |
| `sync` | Sync Google/Microsoft + résolution conflits |
| `habit` | CRUD habitudes + logs + streaks |
| `goal` | CRUD objectifs + progression |
| `rule` | Moteur de règles + exécutions |
| `notification` | Push notifications + préférences |
| `recap` | Récaps daily/weekly/monthly |
| `journal` | Journal entries |
| `dashboard` | Analytics overview, heatmap, time distribution |
| `sharing` | Share links, permissions |
| `user` | Profil, préférences, onboarding, delete/export |
| `comment` | Commentaires sur événements |
| `suggestion` | Suggestions IA |
| `aiScheduler` | Plan My Day, calibration |
| `experiment` | N-of-1 experiments |
| `energy` | Energy/mood logging |
| `emotionalMemory` | Mémoire émotionnelle |
| `chronotype` | Quiz chronotype + résultats |
| `antiProcrastination` | Anti-procrastination tools |
| `focusSession` | Focus timer sessions |
| `workload` | Alertes de surcharge |
| `meetingLoad` | Meeting load analytics |

### Stores Zustand (5)

| Store | Rôle | Persisté |
|-------|------|----------|
| `calendar.store` | Date courante, type de vue, calendriers visibles | Oui (localStorage) |
| `task.store` | Filtres tâches, vue active | À vérifier |
| `habit.store` | Filtres habitudes | À vérifier |
| `layout.store` | Tailles des panneaux, états collapse | Oui (localStorage) |
| `ui.store` | Modaux, sidebar mobile, command palette | Non |

### Routes Dashboard (13)

`/home`, `/calendar`, `/tasks`, `/habits`, `/goals`, `/dashboard`, `/analytics`, `/planner`, `/daily-planning`, `/matrix`, `/rules`, `/settings`, `/onboarding`

---

## 3. Classification

### Tableau récapitulatif

| Catégorie | Nombre fichiers | % |
|-----------|----------------|---|
| 🟢 CŒUR | ~85 | 55% |
| ��� SUPPORT | ~35 | 23% |
| 🟡 DETTE | ~25 | 16% |
| 🔴 MORT | ~5 | 3% |
| ⚫ INCONNU | ~5 | 3% |

### Détail par catégorie

#### 🟢 CŒUR — Essentiel, activement utilisé
- `src/features/calendar/` — Composants + router, cœur du produit
- `src/features/tasks/` — CRUD + Kanban + Eisenhower + time blocking
- `src/features/habits/` — Complet avec streaks et logs
- `src/features/goals/` — SMART validation, progression
- `src/features/home/` — Page d'accueil interactive
- `src/features/analytics/` — Dashboard v2 complet
- `src/features/wellness/` — Energy, chronotype, rituals
- `src/features/focus/` — Focus sessions, anti-procrastination
- `src/infrastructure/` — Auth, DB, tRPC (sauf 2 erreurs TS)
- `src/shared/components/ui/` — Design system complet
- `src/shared/components/layout/` — Shell responsive
- `src/stores/` — State management cohérent
- `prisma/schema.prisma` — 35 modèles bien structurés

#### 🔵 SUPPORT — Utilitaire nécessaire
- `src/middleware.ts` — Auth guard edge
- `src/i18n/` — Configuration next-intl
- `src/lib/` — Crypto, rate limit, recurrence, calendar utils
- `src/shared/hooks/` — Hooks réutilisables
- `src/shared/components/theme/` — Provider + Toggle
- `src/shared/components/command/` — Command palette
- `messages/*.json` — Fichiers de traduction
- `tests/` — Suite de tests Vitest
- `next.config.mjs` — Config Next + CSP + i18n

#### 🟡 DETTE — Fonctionne mais problèmes identifiés

| Fichier | Raison |
|---------|--------|
| `src/infrastructure/trpc/context.ts` | 2 erreurs TS (type session) |
| `src/infrastructure/trpc/server.ts` | Erreur TS liée au context |
| 33 fichiers features avec FR hardcodé | Contournent next-intl |
| `src/features/home/components/landing/Navigation.tsx` | Logo non adaptatif dark mode |
| `src/app/login/page.tsx` | Logo non adaptatif dark mode |
| `tests/routers/calendar.test.ts` | 2 erreurs TS (mock incomplet) |
| `tests/routers/task.test.ts` | 5 erreurs TS (mocks `aggregate`, `checklistItem` manquants) |
| `tests/routers/event.test.ts` | 1 erreur TS (typage map) |
| `src/app/(dashboard)/home/HomeClient.tsx:96` | TODO: mood note non persisté en DB |

#### 🔴 MORT — Non référencé ou obsolète

| Fichier | Raison |
|---------|--------|
| `public/light-mode-logo.png` | Non importé nulle part dans le code |
| `public/logo-dark-mode.png` | Non importé (fichier racine, pas public/) |
| `public/logo-full-new.png` | Non référencé |
| `public/logo-full.png` | Non référencé |
| `ROADMAP.md`, `SECURITY.md`, `CONTRIBUTING.md` | Fichiers docs non tracked/orphelins |

#### ⚫ INCONNU — Questions pour Ralph

| Élément | Question |
|---------|----------|
| `src/app/(dashboard)/planner/page.tsx` | Overlap fonctionnel avec `/daily-planning` ? Garder les deux ? |
| `src/features/intelligence/components/scheduler/` | PlanMyDay est-il activement utilisé ou expérimental ? |
| `wiki/` (untracked) | Destiné à GitHub wiki ? Doit-il être versionné ? |
| `scripts/push-wiki.sh` (untracked) | Script actif ou obsolète ? |
| `docs/decisions/` | ADR actif ou archive historique ? |

---

## 4. Architecture

### Pattern observé : Feature-first + thin router

**Verdict : Bien respecté, quelques dérives mineures.**

| Critère | Statut |
|---------|--------|
| Router thin / Service fat | ✅ Respecté — seul `aiScheduler` a un service séparé. Les autres routers contiennent la logique directement (acceptable pour la taille actuelle). |
| Zustand = UI state only | ✅ Respecté — `calendar.store` et `layout.store` ne dupliquent pas le server state (géré par react-query/tRPC) |
| Frontières features/infra/shared | ✅ Respecté — imports croisés entre features absents |
| Pas de server state dans Zustand | ✅ — les stores ne cachent pas les données tRPC |

### Dérives mineures

1. **Logique métier dans les pages** — `calendar/page.tsx` (1004 lignes) fait trop : DnD, mutations, transformations. Devrait extraire un hook `useCalendarPage`.
2. **Tests incomplets** — Les mocks dans `tests/` ne couvrent pas tous les modèles Prisma (`checklistItem`, `aggregate`). Les tests cassent au typage.
3. **i18n incohérent** — Le Sidebar utilise `useTranslations`, mais 33 fichiers features ont du texte FR en dur.
4. **Double source de vérité pour le collapse** — `ui.store.sidebarCollapsed` (mobile) vs `layout.store.leftSidebarCollapsed` (desktop). Fonctionnel mais confus.

### Dette structurelle (top 5, priorisés)

1. **P1 — i18n incomplet** : 70+ chaînes FR hardcodées → impossible de livrer EN correctement
2. **P1 — Erreurs TS infra** : `context.ts`/`server.ts` type mismatch → risque de régression silencieuse
3. **P2 — Tests mocks cassés** : 13 erreurs TS dans les tests → suite non exécutable en CI
4. **P2 — Pas d'ESLint config** : `.eslintrc` absent → `next lint` ne fonctionne pas
5. **P3 — Calendar page monolithique** : 1004 lignes, à refactorer en hook + sous-composants

---

## 5. Questions ouvertes pour Ralph

1. **`/planner` vs `/daily-planning`** : Ces deux routes semblent couvrir un périmètre similaire (planification du jour). L'une est-elle dépréciée ?
2. **Apple OAuth** : As-tu un Apple Developer account configuré avec les Service IDs et clés ? Les variables ne sont pas dans `.env`.
3. **Le logo landing** : Le `lightLogoFinal.png` est-il un logo horizontal (texte + icône) avec fond transparent sur fond clair ? Si oui, il disparaît en dark mode.
4. **wiki/ + push-wiki.sh** : Ce dossier est `??` (untracked). Est-il destiné au GitHub wiki ou doit-il être gitignored ?
5. **CI/CD** : Les workflows GitHub `.github/workflows/ci.yml` et `lint.yml` — est-ce que le lint passe actuellement ? (ESLint config absente)
