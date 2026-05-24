# DPM Calendar — Wireframes

**Version** : 1.0  
**Réfère** : DESIGN_SYSTEM.md pour les tokens, BUG_INVENTORY.md pour les bugs résolus

---

## 1. Shell Layout (toutes les pages dashboard)

> **Résout** : BUG F3 (grilles cassées), BUG F4 (widgets qui se chevauchent)

### 1.1 Desktop (1280px+)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    flex h-screen overflow-hidden                      │
├────────────┬──────────────────────────────────────────┬──────────────┤
│            │                                          │              │
│  LEFT      │           MAIN CONTENT                   │  RIGHT       │
│  SIDEBAR   │                                          │  SIDEBAR     │
│            │  ┌──────────────────────────────────┐    │              │
│  w: 15%    │  │ <header> (optional per page)     │    │  w: 18%     │
│  min: 4%   │  ├──────────────────────────────────┤    │  min: 3%    │
│  max: 30%  │  │                                  │    │  max: 35%   │
│            │  │  overflow-auto                    │    │              │
│  ┌──────┐  │  │  p-4 md:p-6                     │    │  ┌────────┐  │
│  │ Logo │  │  │                                  │    │  │ Icon   │  │
│  ├──────┤  │  │  max-w-7xl mx-auto              │    │  │ Menu   │  │
│  │ Main │  │  │                                  │    │  │        │  │
│  │ Nav  │  │  │  [Page-specific content]         │    │  │ Mini   │  │
│  ├──────┤  │  │                                  │    │  │ Cal    │  │
│  │ Sect │  │  │                                  │    │  │        │  │
│  │ ions │  │  │                                  │    │  │ Tasks  │  │
│  ├──────┤  │  │                                  │    │  │        │  │
│  │ Foot │  │  │                                  │    │  │ Notes  │  │
│  └──────┘  │  └──────────────────────────────────┘    │  └────────┘  │
├────────────┼──────────────────────────────────────────┼──────────────┤
│ Resizable  │          Resizable Handle               │  Resizable   │
│ Handle     │                                          │  Handle      │
└────────────┴──────────────────────────────────────────┴──────────────┘
```

**Règles anti-chevauchement** :
- Le `<main>` utilise `flex-1 overflow-auto` — JAMAIS `overflow-visible`
- Les grilles internes utilisent `gap-4` (jamais `margin` négatif)
- Les panels ont `min-size` enforced par `react-resizable-panels`
- Le contenu interne a `max-w-7xl mx-auto` pour ne pas s'étirer indéfiniment

### 1.2 Tablet (768px)

```
┌─────────────────────────────────────────┐
│ flex h-screen overflow-hidden           │
├────────────┬────────────────────────────┤
│  LEFT      │     MAIN CONTENT           │
│  SIDEBAR   │                            │
│  (collaps- │     overflow-auto          │
│   ible)    │     p-4                    │
│            │                            │
│  ~56px     │     [Page content]         │
│  collapsed │                            │
│  icons     │     Right sidebar hidden   │
│  only      │     or bottom sheet        │
│            │                            │
└────────────┴────────────────────────────┘
```

### 1.3 Mobile (375px)

```
┌─────────────────────────┐
│  <header> h-14          │
│  ┌───┐ DPM Cal  [sync] │
│  │ ≡ │                  │
│  └───┘                  │
├─────────────────────────┤
│                         │
│   MAIN CONTENT          │
│   overflow-auto         │
│   p-4 pb-20            │
│                         │
│   [Page content]        │
│                         │
│                         │
│                         │
├─────────────────────────┤
│  BOTTOM NAV (fixed)     │
│  h-16 safe-bottom       │
│  ┌───┬───┬───┬───┬───┐ │
│  │ 🏠│ 📋│ 📅│ ✓ │ 📊│ │
│  │Home│Plan│Cal│Task│Stat│
│  └───┴───┴───┴───┴───┘ │
└─────────────────────────┘

Sidebar = overlay (slide from left, z-50)
```

---

## 2. Home (`/home`)

### 2.1 Hiérarchie de l'information

1. **Greeting + heure** (contexte temporel immédiat)
2. **Charge de travail** (workload bar — réponse à "suis-je surchargé ?")
3. **Tâche en cours** (focus sur l'action immédiate)
4. **Aperçu du jour** (stats : tâches, réunions, focus, habitudes)
5. **Timeline des événements** (ce qui vient ensuite)
6. **Smart tips** (suggestions contextuelles)

### 2.2 Desktop Layout (1280px)

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER: Greeting + Energy Check                     border-b   │
│ ┌──────────────────────────────────────────┐  ┌─────────────┐ │
│ │ ☀️ Bonjour, Ralph !                      │  │ Energy: ⚡⚡⚡│ │
│ │ 14:32 · samedi 24 mai 2026               │  │ (1-5 scale) │ │
│ └──────────────────────────────────────────┘  └─────────────┘ │
├────────────────────────────────────────────────────────────────┤
│ WORKLOAD BAR: rounded-xl border bg-card p-5                    │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ████████░░░░░░░░░░░░░░ 3h20 / 8h disponibles            │   │
│ │ [tasks: ███] [meetings: ██] [available: ░░░░░░]          │   │
│ └──────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────┤
│ MAIN GRID: grid grid-cols-1 lg:grid-cols-3 gap-6              │
│                                                                │
│ ┌──────────────────────────────────┐  ┌─────────────────────┐ │
│ │ CURRENT TASK (lg:col-span-2)     │  │ TIMELINE            │ │
│ │                                  │  │                     │ │
│ │ ┌──────────────────────────────┐ │  │ 14:30 - Stand-up    │ │
│ │ │ 🟣 Finir la maquette login  │ │  │ 15:00 - Client call │ │
│ │ │ [Complete] [Skip] [45m]     │ │  │ 16:30 - Review PR   │ │
│ │ └──────────────────────────────┘ │  │                     │ │
│ │                                  │  ├─────────────────────┤ │
│ │ DAILY OVERVIEW                   │  │ TODAY'S TASKS (5)   │ │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │  │ · Maquette login    │ │
│ │ │3/5 │ │ 2  │ │2h  │ │1/3 │    │  │ · Review PR #42     │ │
│ │ │Task│ │Meet│ │Focus│ │Hab │    │  │ · Deploy staging    │ │
│ │ └────┘ └────┘ └────┘ └────┘    │  │                     │ │
│ │                                  │  ├─────────────────────┤ │
│ │ QUICK ACTIONS                    │  │ SMART TIPS          │ │
│ │ [+ Tâche] [📅] [🎯] [🔥] [📊] │  │ "2h de focus dispo" │ │
│ └──────────────────────────────────┘  └─────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 Mobile (375px)

```
┌─────────────────────────┐
│ ☀️ Bonjour, Ralph !     │
│ 14:32 · samedi 24 mai   │
│ ⚡ Energy: [1][2][3][4][5]│
├─────────────────────────┤
│ Workload: ████░░░░ 3/8h │
├─────────────────────────┤
│ CURRENT TASK            │
│ ┌─────────────────────┐ │
│ │ Finir maquette      │ │
│ │ [✓ Done] [→ Skip]   │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Daily Overview (2x2)    │
│ ┌────┐ ┌────┐          │
│ │3/5 │ │ 2  │          │
│ └────┘ └────┘          │
│ ┌────┐ ┌────┐          │
│ │2h  │ │1/3 │          │
│ └────┘ └────┘          │
├─────────────────────────┤
│ À venir (3 items)       │
├─────────────────────────┤
│ Quick Actions (scroll-x)│
└─────────────────────────┘
```

---

## 3. Calendar (`/calendar`)

### 3.1 Desktop (1280px)

> Structure 3-panels avec propre `react-resizable-panels` Group

```
┌─────────────────────────────────────────────────────────────────────┐
│ CALENDAR HEADER: nav + view toggle + hours mode            border-b │
│ [◀][Aujourd'hui][▶] Mai 2026   [Jour|Sem|Mois|📋|⏱|📊] [👁 24h] │
├──────────┬────────────────────────────────────────────┬─────────────┤
│ CAL      │              CALENDAR VIEW                  │ UNSCHEDULED │
│ SIDEBAR  │                                            │ TASKS       │
│          │  ┌───┬───┬───┬───┬───┬───┬───┐           │             │
│ Mini     │  │Lun│Mar│Mer│Jeu│Ven│Sam│Dim│           │ ┌─────────┐ │
│ Calendar │  ├───┼───┼───┼───┼───┼───┼───┤           │ │ Task 1  │ │
│          │  │   │   │   │   │   │   │   │ ← scroll  │ │ 30m     │ │
│ My       │  │06 │   │   │   │   │   │   │   vert    │ ├─────────┤ │
│ Calendars│  │07 │   │███│   │   │   │   │           │ │ Task 2  │ │
│          │  │08 │███│███│   │   │   │   │           │ │ 1h      │ │
│ Sections │  │09 │███│   │   │███│   │   │           │ ├─────────┤ │
│          │  │10 │   │   │███│███│   │   │           │ │ Task 3  │ │
│ [+ Cal]  │  │...│   │   │   │   │   │   │           │ │ 45m     │ │
│          │  └───┴───┴───┴───┴───┴───┴───┘           │ └─────────┘ │
│          │                                            │             │
│ 20%      │              Flexible (60%+)               │    18%      │
├──────────┴────────────────────────────────────────────┴─────────────┤
│                    Drag & Drop: task → calendar = time block         │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile (375px)

```
┌─────────────────────────┐
│ HEADER                  │
│ [◀][Auj.][▶] Mai 2026  │
│ [J|S|M] [+ Événement]  │
├─────────────────────────┤
│                         │
│ CALENDAR VIEW           │
│ (full height scroll)    │
│                         │
│ Left/right sidebars     │
│ hidden on mobile        │
│ (accessible via         │
│  toggle buttons)        │
│                         │
└─────────────────────────┘
```

---

## 4. Tasks (`/tasks`)

### 4.1 Desktop Layout

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER: Filters + View Toggle + Search                         │
│ [Status ▾] [Priority ▾] [Tags ▾]  🔍    [List|Kanban|Gantt|📊]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ VIEW CONTENT (switches based on toggle):                       │
│                                                                │
│ ═══ LIST VIEW ═══                                              │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ ○ Task title                  HIGH   30m   24 mai    │       │
│ │ ○ Another task                MED    1h    25 mai    │       │
│ │ ● Completed task (struck)     LOW    15m   23 mai    │       │
│ └──────────────────────────────────────────────────────┘       │
│                                                                │
│ ═══ KANBAN VIEW ═══                                            │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│ │ TO DO  │ │IN PROG │ │ DONE   │ │CANCEL  │                  │
│ │ (12)   │ │ (3)    │ │ (8)    │ │ (1)    │                  │
│ │        │ │        │ │        │ │        │                  │
│ │ ┌────┐ │ │ ┌────┐ │ │ ┌────┐ │ │        │                  │
│ │ │Card│ │ │ │Card│ │ │ │Card│ │ │        │                  │
│ │ └────┘ │ │ └────┘ │ │ └────┘ │ │        │                  │
│ │ ┌────┐ │ │ ┌────┐ │ │        │ │        │                  │
│ │ │Card│ │ │ │Card│ │ │        │ │        │                  │
│ │ └────┘ │ │ └────┘ │ │        │ │        │                  │
│ └────────┘ └────────┘ └────────┘ └────────┘                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Mobile

- Kanban : scroll horizontal (colonnes ~280px)
- List : full-width cards
- Gantt : message "Voir sur desktop" + link

---

## 5. Dashboard (`/dashboard`)

> **Résout** : BUG F4 (widgets overlap) — pas d'overlap possible avec `grid gap-4`

### 5.1 Desktop (1280px)

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER: TimeRangeSelector                                      │
│ Dashboard Analytique     [Today|Week|Month|Quarter|Year]       │
├────────────────────────────────────────────────────────────────┤
│ STAT CARDS: grid grid-cols-2 lg:grid-cols-4 gap-4              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ 24.5h    │ │ 15/20    │ │ 75%      │ │ 8.2      │          │
│ │ Heures   │ │ Tâches   │ │ Complet  │ │ Score    │          │
│ │ ▲ +12%   │ │ ▲ +3     │ │ ▲ +5%   │ │ ▲ +0.4  │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────────────────┤
│ HEATMAP: contribution grid (6 months)                          │
│ ┌──────────────────────────────────────────────────────┐       │
│ │ ░░█░░░█░░░░░░░████░░░░░░░░░░░████░░░░░░░░░░░░███░░ │       │
│ └──────────────────────────────────────────────────────┘       │
├────────────────────────────────────────────────────────────────┤
│ MIDDLE ROW: grid grid-cols-1 lg:grid-cols-3 gap-4             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│ │ Productivity │ │ Time Distrib │ │ Habit Streaks│           │
│ │ Score Ring   │ │ (Pie chart)  │ │ 🔥 7j Med   │           │
│ │              │ │ Focus 40%    │ │ 🔥 12j Run  │           │
│ │   7.8/10    │ │ Meeting 30%  │ │ 🔥 3j Read  │           │
│ └──────────────┘ └──────────────┘ └──────────────┘           │
├────────────────────────────────────────────────────────────────┤
│ GOALS ROW: grid grid-cols-1 lg:grid-cols-2 gap-4             │
│ ┌────────────────────────┐ ┌────────────────────────┐         │
│ │ Goal Progress          │ │ Upcoming Deadlines     │         │
│ │ ████████░░ 65% Read    │ │ · Task A — 2 jours    │         │
│ │ ██████░░░░ 40% Sport   │ │ · Task B — 5 jours    │         │
│ └────────────────────────┘ └────────────────────────┘         │
├────────────────────────────────────────────────────────────────┤
│ BOTTOM ROW: grid grid-cols-1 lg:grid-cols-2 gap-4            │
│ ┌────────────────────────┐ ┌────────────────────────┐         │
│ │ Workload Balance       │ │ Meeting Load           │         │
│ │ (Bar chart per day)    │ │ (Weekly distribution)  │         │
│ └────────────────────────┘ └────────────────────────┘         │
└────────────────────────────────────────────────────────────────┘
```

**Pourquoi pas d'overlap** :
- Chaque section est un `div` avec `grid` + `gap-4`
- Aucun widget n'utilise `position: absolute` au niveau grille
- `overflow-hidden` sur le conteneur de scroll empêche les débordements
- `max-w-7xl mx-auto` contient la largeur

### 5.2 Mobile (375px)

- Stat cards : `grid-cols-2 gap-3`
- Tous les autres : `grid-cols-1 gap-4` (empilés verticalement)
- Heatmap : scroll horizontal avec indicateur

---

## 6. Daily Planning (`/daily-planning`)

### 6.1 Structure (wizard multi-étapes)

```
┌────────────────────────────────────────────────────────────────┐
│ STEP PROGRESS: flex items-center justify-center border-b       │
│ (1)──(2)──(●3)──(4)──(5)──(6)                                │
│ Add  Estim  Fill  Prior  Sched  Doc                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ STEP CONTENT (changes per step):                               │
│                                                                │
│ Step 1: Add Task                                               │
│ ┌──────────────────────────────────────────┐                  │
│ │ [Input: titre de la tâche          ] [+] │                  │
│ │                                          │                  │
│ │ · Tâche existante 1                      │                  │
│ │ · Tâche existante 2                      │                  │
│ └──────────────────────────────────────────┘                  │
│                                                                │
│ Step 5: Schedule (split view)                                  │
│ ┌───────────────────┐ ┌───────────────────┐                  │
│ │ Task list (left)  │ │ Day calendar view │                  │
│ │ (draggable)       │ │ (droppable)       │                  │
│ └───────────────────┘ └───────────────────┘                  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ FOOTER: flex justify-between p-4 border-t                      │
│ [← Précédent]                    [Suivant →] or [✓ Terminer] │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Login (`/login`)

### 7.1 Desktop (split layout)

```
┌──────────────────────────────┬──────────────────────────────┐
│        LEFT (50%)            │          RIGHT (50%)          │
│                              │                               │
│  ┌─────────────────────┐    │   bg-gradient (violet)        │
│  │ [Logo] DPM Calendar │    │                               │
│  │                     │    │   "Gérez votre temps          │
│  │ Bienvenue !         │    │    intelligemment"            │
│  │                     │    │                               │
│  │ [Google    ]        │    │   ┌─────────────────────┐    │
│  │ [Microsoft ]        │    │   │  App Preview        │    │
│  │ [GitHub    ]        │    │   │  (Calendar mockup)  │    │
│  │ [Apple     ]        │    │   └─────────────────────┘    │
│  │ --- SSO ---         │    │                               │
│  │ [SSO Entreprise]    │    │   Trust badge                 │
│  │ --- ou email ---    │    │                               │
│  │ [email input   ]    │    │                               │
│  │ [Continuer     ]    │    │                               │
│  │                     │    │                               │
│  │ Terms + Privacy     │    │                               │
│  └─────────────────────┘    │                               │
│                              │                               │
└──────────────────────────────┴──────────────────────────────┘
```

### 7.2 Mobile (375px)

- Right side hidden (`lg:flex lg:w-1/2`)
- Form takes full width
- OAuth buttons stacked vertically
- Touch targets 48px height

---

## 8. Settings (`/settings`)

### Layout (toutes tailles)

```
┌────────────────────────────────────────────────────────────────┐
│ flex-1 overflow-auto p-4 md:p-6                                │
│                                                                │
│ max-w-2xl mx-auto space-y-8                                   │
│                                                                │
│ ┌──────────────────────────────────────────┐                  │
│ │ SECTION: Connexions calendrier           │                  │
│ │ ┌────────────────────────────────┐       │                  │
│ │ │ Google Calendar  [✓ Connecté]  │       │                  │
│ │ │ Last sync: 14:20  [🔄] [✕]    │       │                  │
│ │ ├────────────────────────────────┤       │                  │
│ │ │ Microsoft Outlook [Connecter]  │       │                  │
│ │ └────────────────────────────────┘       │                  │
│ └──────────────────────────────────────────┘                  │
│                                                                │
│ ┌──────────────────────────────────────────┐                  │
│ │ SECTION: Préférences                     │                  │
│ │ Priority cap: [3] ▾                      │                  │
│ │ Work hours: 09:00 - 18:00                │                  │
│ └──────────────────────────────────────────┘                  │
│                                                                │
│ ┌──────────────────────────────────────────┐                  │
│ │ SECTION: Conflits de sync                │                  │
│ │ (SyncConflictList component)             │                  │
│ └──────────────────────────────────────────┘                  │
│                                                                │
│ ┌──────────────────────────────────────────┐                  │
│ │ DANGER ZONE (border-destructive)         │                  │
│ │ [Exporter mes données] [Supprimer compte]│                  │
│ └──────────────────────────────────────────┘                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Patterns responsive récurrents

### Widget card (utilisé partout)

```
<div class="rounded-xl border bg-card p-4 md:p-5">
  <h3 class="text-sm font-medium text-muted-foreground mb-3">
    {title}
  </h3>
  {content}
</div>
```

### Page wrapper (toutes les pages dashboard)

```
<div class="flex-1 overflow-auto p-4 md:p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    {/* Header */}
    {/* Content grids */}
  </div>
</div>
```

### Grid collapse pattern

```
Desktop:  grid grid-cols-3 gap-4
Tablet:   grid grid-cols-2 gap-4  (via lg: prefix)
Mobile:   grid grid-cols-1 gap-4  (default)
```

Jamais de `position: absolute` pour placer un widget dans une grille.
Jamais de `margin` négatif pour compenser un gap.
