# DPM Calendar — Structure visuelle

**Version** : 1.0

---

## 1. Carte de navigation

```
                          ┌─────────────┐
                          │   Landing   │ (public)
                          │  page.tsx   │
                          └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐ ┌───▼───┐  ┌────▼────┐
              │   Login   │ │Privacy│  │  Terms  │
              │ /login    │ │       │  │         │
              └─────┬─────┘ └───────┘  └─────────┘
                    │
          ┌─────────┼──────────── Auth Guard ─────────────────┐
          │         │                                          │
    ┌─────▼─────┐   │                                          │
    │Onboarding │   │                                          │
    │(first-time)   │                                          │
    └───────────┘   │                                          │
                    ▼                                           │
    ┌───────────────────────────────────────────────────────┐  │
    │                   DASHBOARD SHELL                      │  │
    │  ┌─────────┐ ┌──────────────────────┐ ┌───────────┐  │  │
    │  │ Sidebar │ │     Main Content     │ │ Right Bar │  │  │
    │  └─────────┘ └──────────────────────┘ └───────────┘  │  │
    │                                                       │  │
    │  Routes internes :                                    │  │
    │                                                       │  │
    │  ┌─────────────── DAILY FLOW ──────────────────┐     │  │
    │  │                                             │     │  │
    │  │  /home ──→ /daily-planning ──→ /planner    │     │  │
    │  │  (overview)  (guided setup)    (execution)  │     │  │
    │  └─────────────────────────────────────────────┘     │  │
    │                                                       │  │
    │  ┌─────────── PRODUCTIVITY ────────────────────┐     │  │
    │  │                                             │     │  │
    │  │  /calendar   /tasks   /habits   /goals     │     │  │
    │  │  (time)      (work)   (rituals) (north)    │     │  │
    │  └─────────────────────────────────────────────┘     │  │
    │                                                       │  │
    │  ┌─────────── INSIGHTS ────────────────────────┐     │  │
    │  │                                             │     │  │
    │  │  /dashboard   /analytics   /matrix          │     │  │
    │  │  (metrics)    (trends)     (prioritize)     │     │  │
    │  └─────────────────────────────────────────────┘     │  │
    │                                                       │  │
    │  ┌─────────── SYSTEM ──────────────────────────┐     │  │
    │  │                                             │     │  │
    │  │  /rules       /settings                     │     │  │
    │  │  (automation) (config)                      │     │  │
    │  └─────────────────────────────────────────────┘     │  │
    │                                                       │  │
    └───────────────────────────────────────────────────────┘  │
                                                               │
    └──────────────────────────────────────────────────────────┘
```

---

## 2. Patterns réutilisables

### 2.1 Pattern "Page de liste"

Utilisé par : `/tasks`, `/habits`, `/goals`, `/rules`

```
┌────────────────────────────────────────────────────────┐
│ PAGE HEADER                                            │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Titre page          [Filtres] [Vue toggle] [+ New] │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ CONTENT AREA (flex-1 overflow-auto)                    │
│                                                        │
│ Variante A: List View                                  │
│ ┌──────────────────────────────────────────────┐       │
│ │ Row item (task-card pattern)                 │       │
│ ├──────────────────────────────────────────────┤       │
│ │ Row item                                     │       │
│ ├──────────────────────────────────────────────┤       │
│ │ ...                                          │       │
│ └──────────────────────────────────────────────┘       │
│                                                        │
│ Variante B: Grid/Kanban View                           │
│ ┌───────┐ ┌───────┐ ┌───────┐                        │
│ │ Col 1 │ │ Col 2 │ │ Col 3 │                        │
│ │       │ │       │ │       │                        │
│ └───────┘ └───────┘ └───────┘                        │
│                                                        │
│ État vide:                                             │
│         ┌─────────────────────┐                       │
│         │   [Icon 48x48]      │                       │
│         │   Aucun élément     │                       │
│         │   Créez votre       │                       │
│         │   premier(ère) ...  │                       │
│         │   [+ Créer]         │                       │
│         └─────────────────────┘                       │
└────────────────────────────────────────────────────────┘
```

### 2.2 Pattern "Page analytique"

Utilisé par : `/dashboard`, `/analytics`

```
┌────────────────────────────────────────────────────────┐
│ HEADER: Titre + TimeRangeSelector                      │
├────────────────────────────────────────────────────────┤
│ STAT CARDS ROW (grid-cols-4 → 2 → 2)                  │
├────────────────────────────────────────────────────────┤
│ CHART ROW 1 (grid-cols-3 → 1)                         │
├────────────────────────────────────────────────────────┤
│ CHART ROW 2 (grid-cols-2 → 1)                         │
├────────────────────────────────────────────────────────┤
│ TABLE / LIST (full-width)                              │
└────────────────────────────────────────────────────────┘
```

### 2.3 Pattern "Page outil principal"

Utilisé par : `/calendar`, `/planner`

```
┌────────────────────────────────────────────────────────┐
│ TOOLBAR (compact, h-12 to h-14)                        │
│ [Nav] [Actions] [View toggles] [Panel toggles]         │
├──────────┬──────────────────────────────┬──────────────┤
│ OPT      │       MAIN CANVAS           │ OPT          │
│ LEFT     │                              │ RIGHT        │
│ PANEL    │  (full-height, overflow)     │ PANEL        │
│          │                              │              │
│ Resizable│  Calendar grid / Planner     │ Resizable    │
│          │                              │              │
└──────────┴──────────────────────────────┴──────────────┘
```

### 2.4 Pattern "Modal de création/édition"

Utilisé par : EventModal, TaskModal, HabitModal, GoalModal, RuleModal

```
┌──────────────────────────────────────────┐
│ OVERLAY (bg-black/50 backdrop-blur-sm)   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ HEADER                    [✕]    │   │
│   │ Titre du modal                   │   │
│   ├──────────────────────────────────┤   │
│   │ BODY (overflow-auto max-h-[80vh])│   │
│   │                                  │   │
│   │ Form fields...                   │   │
│   │                                  │   │
│   ├──────────────────────────────────┤   │
│   │ FOOTER                           │   │
│   │      [Annuler] [Sauvegarder]     │   │
│   └──────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

---

## 3. Règles de cohérence inter-écrans

### 3.1 Éléments constants

| Élément | Règle |
|---------|-------|
| Sidebar gauche | Identique sur toutes les pages dashboard — jamais redéfini par page |
| Bottom nav mobile | 5 items fixes : Home, Planner, Calendar, Tasks, Stats |
| Page padding | `p-4 md:p-6` systématique |
| Content max-width | `max-w-7xl mx-auto` sauf pages full-bleed (calendar, planner) |
| Section spacing | `space-y-6` entre les blocs principaux |
| Card style | `rounded-xl border bg-card p-4 md:p-5` partout |
| Section title | `text-sm font-medium text-muted-foreground mb-3` partout |

### 3.2 Hiérarchie d'actions

| Niveau | Style | Exemple |
|--------|-------|---------|
| Action primaire | `Button default` (filled primary) | "Créer", "Sauvegarder" |
| Action secondaire | `Button outline` | "Annuler", "Voir tout" |
| Action tertiaire | `Button ghost` | Icônes toolbar, navigation |
| Action destructive | `Button destructive` | "Supprimer" (toujours avec confirmation) |

### 3.3 Patterns d'état cohérents

| État | Implémentation | Utilisé partout de la même façon |
|------|----------------|----------------------------------|
| Loading page | Skeleton layout (zones grises pulsantes) | Oui — même structure que le contenu final |
| Loading inline | `Loader2 animate-spin` + texte | Oui |
| Empty state | Icône + titre + sous-titre + CTA | Oui |
| Error toast | `toast.error(title, { description })` via Sonner | Oui |
| Success toast | `toast.success(title)` | Oui |
| Confirmation | Dialog modal avec texte + 2 boutons | Oui (suppression) |

### 3.4 Densité d'information

| Page | Densité | Justification |
|------|---------|---------------|
| Home | Moyenne | Overview rapide, pas de surcharge |
| Calendar | Élevée | Outil de travail principal, maximum d'info visible |
| Tasks | Moyenne→Élevée | Dépend de la vue (list = élevée, kanban = moyenne) |
| Dashboard | Élevée | Analytics = densité nécessaire |
| Settings | Faible | Formulaire, pas de cognitive load |
| Daily Planning | Faible | Focus sur une étape à la fois |

### 3.5 Transitions entre pages

- Navigation sidebar : instantanée (pas d'animation de page)
- Modaux : `animate-scale-in` (200ms)
- Sidebar collapse : `duration-300 ease-out`
- View toggle (tasks, calendar) : pas d'animation (swap instantané)

---

## 4. Responsive — Stratégie de dégradation

| Composant | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Left sidebar | Panneau resizable | Icônes seules (56px) | Overlay slide-in |
| Right sidebar | Panneau resizable | Hidden | Hidden |
| Calendar sidebar | Panneau | Hidden | Hidden |
| Multi-column grid | 3-4 cols | 2 cols | 1 col |
| Toolbar actions | Tous visibles | Icônes + overflow menu | Icônes minimales |
| View toggles | Labels texte | Icônes seules | 3 vues max |
| Data tables | Full width | Scroll horizontal | Card list view |

### Règle du "mobile-first content"

Sur mobile, prioriser :
1. L'**action en cours** (tâche courante, événement suivant)
2. Le **résumé du jour** (stats clés)
3. Les **actions rapides** (créer, naviguer)

Supprimer ou différer :
- Graphiques complexes (heatmap → "Voir sur desktop")
- Panneaux latéraux secondaires
- Vues multiples simultanées (Gantt, Timeline)
