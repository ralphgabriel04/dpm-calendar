# DPM Calendar — Brief Design Complet pour Maquettes

> **À donner tel quel à Claude Design** pour produire des wireframes et maquettes HTML.
> Ce document contient TOUT ce qu'un designer a besoin de savoir pour créer des maquettes
> fidèles au produit et intégrables dans l'application.

---

## 1. IDENTITÉ DU PRODUIT

### 1.1 Qu'est-ce que DPM Calendar ?

**DPM Calendar** est une application de productivité tout-en-un qui combine :
- Calendrier (multi-calendriers, sync Google/Microsoft/Apple)
- Gestion de tâches (Kanban, Liste, Gantt, Matrice d'Eisenhower)
- Habitudes et streaks
- Objectifs SMART avec suivi de progression
- Analytics et métriques de productivité
- Bien-être (énergie, chronotype, rituels, focus sessions)
- Planification intelligente (IA, règles d'automatisation)

**Slogan** : « Votre temps, mérite mieux. »

**Public cible** : Professionnels et étudiants qui veulent optimiser leur temps avec une approche holistique (pas juste un calendrier, pas juste un task manager — les deux unifiés avec du well-being).

**Concurrents** : Motion, Sunsama, Akiflow, Reclaim.ai — DPM se distingue par l'aspect bien-être/énergie intégré.

**Langue** : Bilingue FR/EN (maquettes en français)

### 1.2 Stack technique (pour comprendre les contraintes d'intégration)

- **Framework** : Next.js 14 (App Router)
- **UI** : React 18 + Tailwind CSS 3.4 + Radix UI (headless)
- **Composants** : Design system custom (pas shadcn/ui tel quel, mais inspiré)
- **State** : Zustand (UI) + tRPC/React Query (server state)
- **Panneaux redimensionnables** : `react-resizable-panels`
- **Drag & Drop** : `@dnd-kit`
- **Charts** : Recharts (SVG-based)
- **Thème** : `next-themes` (dark/light toggle)

---

## 2. PALETTE DE COULEURS (à respecter exactement)

### 2.1 Mode Dark (par défaut, priorité #1)

| Usage | Hex | HSL | Token |
|-------|-----|-----|-------|
| **Fond principal** | `#020817` | 222.2 84% 4.9% | `--background` |
| **Cartes/panneaux** | `#0a0f1e` | 222.2 84% 6% | `--card` |
| **Surfaces subtiles** | `#1e293b` | 217.2 32.6% 17.5% | `--muted` |
| **Bordures** | `#1e293b` | 217.2 32.6% 17.5% | `--border` |
| **Texte principal** | `#f8fafc` | 210 40% 98% | `--foreground` |
| **Texte secondaire** | `#94a3b8` | 215 20.2% 65.1% | `--muted-foreground` |
| **Primary (violet)** | `#8b5cf6` | 263.4 70% 60% | `--primary` |
| **Primary sur fond** | `#1e1b4b` | 222.2 47.4% 11.2% | `--primary-foreground` |
| **Succès** | `#22c55e` | 142.1 70% 45% | `--success` |
| **Warning** | `#f59e0b` | 38 92% 50% | `--warning` |
| **Erreur** | `#7f1d1d` (fond) / `#ef4444` (texte) | — | `--destructive` |
| **Info** | `#3b82f6` | 217.2 91.2% 59.8% | `--info` |

### 2.2 Mode Light

| Usage | Hex | Token |
|-------|-----|-------|
| Fond principal | `#ffffff` | `--background` |
| Cartes | `#ffffff` | `--card` |
| Surfaces subtiles | `#f1f5f9` | `--muted` |
| Bordures | `#e2e8f0` | `--border` |
| Texte principal | `#020817` | `--foreground` |
| Texte secondaire | `#64748b` | `--muted-foreground` |
| Primary | `#7c3aed` (plus foncé) | `--primary` |

### 2.3 Couleurs fonctionnelles

| Fonction | Couleur | Contexte |
|----------|---------|----------|
| Événement calendrier | `#3b82f6` (blue) | Blocs dans le calendrier |
| Tâche time-blocked | `#8b5cf6` (violet) | Blocs tâche dans le calendrier |
| Focus / deep work | `#22c55e` (green) | Sessions focus |
| Personnel | `#f59e0b` (amber) | Événements perso |
| Priorité URGENT | `#ef4444` (red) | Dot + border-left |
| Priorité HIGH | `#f97316` (orange) | Dot + border-left |
| Priorité MEDIUM | `#eab308` (yellow) | Dot + border-left |
| Priorité LOW | `#22c55e` (green) | Dot + border-left |

### 2.4 Gradient signature

```css
background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%);
/* Utilisé pour : hero landing, accents, gradient-text */
```

---

## 3. TYPOGRAPHIE

**Font** : Inter (Google Fonts)

| Niveau | Taille | Poids | Usage |
|--------|--------|-------|-------|
| Display | 36px | Bold (700) | Landing page hero |
| H1 | 30px | Bold (700) | Titres de page |
| H2 | 24px | Semibold (600) | Sous-titres |
| H3 | 20px | Semibold (600) | Titres de carte |
| H4 / Section | 16px | Semibold (600) | Labels de section |
| Body | 14px | Regular (400) | Texte courant dans l'app |
| Small | 13px | Regular (400) | Texte secondaire |
| Caption | 12px | Medium (500) | Badges, labels, metadata |
| Overline | 11px | Semibold (600) + UPPERCASE | Headers de section sidebar |

---

## 4. ESPACEMENT ET DIMENSIONS

- **Base** : 4px
- **Padding carte** : 16px (mobile) / 20px (desktop)
- **Padding page** : 16px (mobile) / 24px (desktop)
- **Gap entre widgets** : 16px
- **Gap entre sections** : 24px
- **Border radius cartes** : 12px
- **Border radius boutons** : 8px
- **Border radius interne** : 6px
- **Touch targets** : minimum 44x44px

---

## 5. ARCHITECTURE DES PAGES (13 pages)

### 5.1 Layout Shell (commun à toutes les pages auth)

**Desktop (1280px+)** :
```
[Left Sidebar 15-20%] | [Main Content flex-1] | [Right Sidebar 15-18%]
```
- Left sidebar : Logo + navigation groupée + settings + toggle dark/light
- Main : contenu de la page avec scroll interne
- Right : mini-calendrier + tâches rapides + notes (collapsible)
- Tous les panneaux sont redimensionnables par drag

**Mobile (< 768px)** :
```
[Header h-14 avec hamburger]
[Main Content pleine largeur]
[Bottom Nav h-16 fixe : Home | Planner | Calendar | Tasks | Stats]
```
- Sidebar = overlay slide-in depuis la gauche
- Right sidebar = cachée

---

### 5.2 Page par page — Fonctionnalités détaillées

---

#### PAGE 1 : Landing Page (`/`)

**But** : Convaincre un visiteur de créer un compte.

**Sections** (de haut en bas) :
1. **Navigation fixe** : Logo + bouton Login + bouton "Essayer" (violet plein)
2. **Hero** : Titre accrocheur + sous-titre + badge "Early Access" + CTA + mockup de l'app
3. **How It Works** : 3 étapes illustrées (Planifiez → Exécutez → Analysez)
4. **Features** : 5 features clés avec mockups interactifs (calendrier multi-vues, focus mode, insights, multi-calendrier, objectifs)
5. **Personas** : 3 profils types (entrepreneur, étudiant, manager)
6. **Integrations** : Logos Google Calendar, Outlook, Apple Calendar, Todoist, etc.
7. **Security** : Chiffrement, RGPD, SOC2-ready
8. **CTA final** : Rappel + bouton
9. **Footer** : Liens produit/entreprise/légal + socials

**Ton visuel** : Premium, futuriste mais accessible. Gradients violet/rose subtils. Fond sombre.

---

#### PAGE 2 : Login (`/login`)

**But** : Se connecter ou créer un compte.

**Layout** : Split 50/50 (desktop), full-width form (mobile)

**Gauche** :
- Logo + "DPM Calendar"
- "Bienvenue !"
- Boutons OAuth empilés (48px hauteur) :
  - Google (logo officiel)
  - Microsoft (logo officiel)
  - GitHub (icône)
  - Apple (icône)
  - --- Séparateur "SSO Entreprise" ---
  - Bouton SSO (icône building, bordure violette)
- --- Séparateur "ou avec votre email" ---
- Input email + bouton "Continuer"
- Liens Conditions + Confidentialité

**Droite** (hidden mobile) :
- Gradient violet/rose
- Titre "Gérez votre temps intelligemment"
- Mini-preview de l'app (faux screenshot)
- 4 feature cards en grille 2x2

---

#### PAGE 3 : Onboarding (`/onboarding`)

**But** : Configurer le compte après inscription (4 étapes).

**Étapes** :
1. **Welcome** : Connecter un calendrier externe (Google/Microsoft)
2. **Tasks** : Ajouter 3 premières tâches
3. **Energy** : Sélectionner son chronotype (Alouette/Hibou/Troisième oiseau)
4. **Plan** : Choisir les heures de travail + préférences

**UI** : Progress bar en haut, contenu centré, boutons Précédent/Suivant.

---

#### PAGE 4 : Home (`/home`)

**But** : Vue d'ensemble du jour, point de départ de la journée.

**Composants** (dans l'ordre hiérarchique) :
1. **Header** : Greeting contextuel (Bonjour/Bon après-midi/Bonsoir) + heure + date + nom
2. **Energy Check** : Barre 1-5 pour logger son niveau d'énergie actuel
3. **Workload Bar** : Barre de progression horizontale colorée (tâches/réunions/disponible) avec ratio `X heures / Y heures disponibles`
4. **Current Task Card** : La tâche en cours mise en avant (titre, durée estimée, boutons Complete/Skip/Pick another)
5. **Daily Overview** : 4 mini-stat cards (Tâches X/Y, Réunions N, Focus Xh, Habitudes X/Y)
6. **Timeline** : Liste chronologique des événements à venir (prochaines heures)
7. **Quick Actions** : Boutons raccourcis (+ Tâche, Calendrier, Focus, Habitudes, Analytics)
8. **Smart Tips** : Suggestions contextuelles (ex: "Vous avez 2h de focus disponibles cet après-midi")
9. **Mood Modal** : Dialog qui s'ouvre après le energy check pour ajouter une note

---

#### PAGE 5 : Calendar (`/calendar`)

**But** : Outil de travail principal pour visualiser et gérer le temps.

**Layout** : 3 panneaux redimensionnables (propre au calendrier, pas la sidebar globale)

**Panneau gauche (Calendar Sidebar)** :
- Mini-calendrier mensuel (grille 7x6)
- Liste des calendriers avec toggle de visibilité + couleur
- Sections de calendrier (groupables, drag-to-reorder)
- Bouton "+ Calendrier" / "+ Section"
- Événements à venir (optionnel)

**Panneau central (Vues)** :
- **Toolbar** : Navigation date (◀ Aujourd'hui ▶) + titre mois + toggle de vues + mode heures
- **6 vues disponibles** :
  - **Jour** : Timeline verticale 24h avec blocs
  - **Semaine** : 7 colonnes × timeline (VUE PAR DÉFAUT)
  - **Mois** : Grille calendrier classique
  - **Agenda** : Liste chronologique (comme une inbox)
  - **Timeline** : Vue Gantt-like horizontale
  - **Charge** : Heatmap de la charge par jour
- **Blocs horaires** : Événements positionnés en absolute dans la colonne du jour, hauteur proportionnelle à la durée
- **Mode heures** : Toggle 24h / Heures bureau / Mes heures (personnalisé)
- **Drag & Drop** : Déplacer un événement = changer heure/jour

**Panneau droit (Unscheduled Tasks)** :
- Liste des tâches non planifiées
- Chaque tâche est draggable vers le calendrier
- Drop = crée un time block à l'heure ciblée
- Titre, durée estimée, priorité (dot coloré)

**Interactions clés** :
- Clic sur un créneau vide → ouvre modal création événement
- Clic sur un événement → ouvre detail/édition
- Drag tâche depuis panneau droit → calendrier = time blocking
- Drag événement existant → changer heure

---

#### PAGE 6 : Tasks (`/tasks`)

**But** : Gérer toutes ses tâches avec multiples perspectives.

**Header** : Filtres (status, priorité, tags) + recherche + toggle de vues

**5 vues** :
1. **Liste** : Tableau trié (titre, priorité, durée, deadline, statut)
2. **Kanban** : 4 colonnes (À faire, En cours, Terminé, Annulé) — cartes draggables
3. **Gantt** : Timeline horizontale par tâche (desktop only)
4. **Calendar** : Tâches sur un mini-calendrier
5. **Dashboard** : Stats résumées (graphiques circulaires, compteurs)

**Task Card** (dans Kanban) :
- Titre (tronqué 1 ligne)
- Badge priorité (dot coloré + texte)
- Durée estimée
- Date d'échéance
- Tags (pills)

**Task Row** (dans Liste) :
- Checkbox cercle
- Titre
- Colonne priorité (badge)
- Colonne durée
- Colonne deadline
- Menu actions (...)

**Création de tâche** (Modal) :
- Titre (obligatoire)
- Description (optional, markdown)
- Priorité (LOW/MEDIUM/HIGH/URGENT)
- Date d'échéance
- Durée estimée (presets 5min→2h)
- Tags
- Sous-tâches (checklist)
- Énergie estimée (LOW/MEDIUM/HIGH)
- Lier à un événement

---

#### PAGE 7 : Habits (`/habits`)

**But** : Suivre ses habitudes quotidiennes et voir ses streaks.

**Layout** : Grille de cartes d'habitudes

**Habit Card** :
- Nom + icône + couleur
- Type : Fixe (même heure) / Flexible (n'importe quand) / Conditionnel
- Fréquence : Daily / Weekly / Monthly
- Streak actuel (🔥 Xj)
- Bouton "Done" pour marquer aujourd'hui
- Mini-heatmap des 7 derniers jours (dots remplis/vides)

**Création** (Modal) :
- Nom, description, couleur, icône
- Type + fréquence
- Heure préférée
- Jours préférés
- Durée
- Lier à un objectif

---

#### PAGE 8 : Goals (`/goals`)

**But** : Définir et suivre des objectifs à long terme.

**Layout** : Liste de cartes d'objectifs

**Goal Card** :
- Titre + catégorie
- Barre de progression (currentValue / targetValue)
- Pourcentage
- Date de début → date de fin
- Statut (actif / complété / en pause / abandonné)
- Habitudes liées

**Indicateur SMART** : Badge visuel montrant quels critères SMART sont remplis (Spécifique, Mesurable, Atteignable, Réaliste, Temporel)

---

#### PAGE 9 : Dashboard (`/dashboard`)

**But** : Analytics détaillées de productivité.

**Composants** (grille) :
1. **Time Range Selector** : Aujourd'hui / Semaine / Mois / Trimestre / Année
2. **Stat Cards** (4 en ligne) : Heures totales, Tâches complétées, Taux de complétion, Score productivité — chacun avec % de changement
3. **Contribution Heatmap** : Grille GitHub-style (6 mois), couleur = heures travaillées
4. **Focus Progress Ring** : Anneau SVG avec minutes focus / objectif
5. **Productivity Score Widget** : Ring avec score /10 + breakdown
6. **Time Distribution** : Pie chart (Focus / Meetings / Breaks)
7. **Habit Streaks** : Liste des habitudes avec jours consécutifs
8. **Goal Progress** : Barres de progression pour chaque objectif
9. **Upcoming Deadlines** : Liste des tâches proches de leur deadline
10. **Workload Balance** : Bar chart par jour de la semaine
11. **Meeting Load** : Heures de réunion cette semaine + % du temps

---

#### PAGE 10 : Daily Planning (`/daily-planning`)

**But** : Workflow guidé pour planifier sa journée en 6 étapes.

**6 étapes** (wizard, une à la fois) :
1. **Ajouter des tâches** : Input + liste des tâches existantes à cocher
2. **Estimer le temps** : Pour chaque tâche, sélectionner une durée (presets boutons)
3. **Remplir la liste** : Voir le total vs temps disponible
4. **Prioriser** : Réordonner par drag (URGENT→HIGH→MED→LOW)
5. **Planifier** : Split view — tâches à gauche (draggable), calendrier du jour à droite (droppable)
6. **Documenter** : Résumé + notes libres

**UI** : Progress bar d'étapes en haut, contenu au milieu, boutons nav en bas.

---

#### PAGE 11 : Planner (`/planner`)

**But** : Vue "command center" combinant calendrier + tâches + focus.

**Layout** : Similaire au calendrier mais avec :
- Vue jour/semaine par défaut
- Liste de tâches draggable intégrée
- Mode Focus (Pomodoro) accessible depuis une tâche
- Popup de détail de tâche avec timer intégré

---

#### PAGE 12 : Matrix (`/matrix`)

**But** : Matrice d'Eisenhower pour prioriser.

**Layout** : Grille 2×2 :
- **Urgent + Important** (top-left) → Faire maintenant
- **Important + Non urgent** (top-right) → Planifier
- **Urgent + Non important** (bottom-left) → Déléguer
- **Non urgent + Non important** (bottom-right) → Éliminer

Chaque quadrant contient les tâches correspondantes (draggable entre quadrants).

---

#### PAGE 13 : Settings (`/settings`)

**But** : Configuration du compte.

**Sections** :
1. **Connexions calendrier** : Google Calendar (connecté/déconnecter), Microsoft Outlook, Apple Calendar — statut de sync + bouton sync manuelle
2. **Préférences** : Priority cap (nombre max de tâches urgentes/jour), heures de travail, format date/heure
3. **Conflits de sync** : Liste des conflits non résolus (local vs remote)
4. **Danger Zone** (bordure rouge) :
   - Exporter mes données (RGPD)
   - Supprimer mon compte (double confirmation : email + mot-clé)

---

## 6. COMPOSANTS RÉUTILISABLES (pour cohérence inter-pages)

### 6.1 Boutons

| Variante | Apparence | Quand l'utiliser |
|----------|-----------|------------------|
| Primary | Fond violet `#8b5cf6`, texte blanc | Action principale (1 seul par zone) |
| Secondary | Fond `#1e293b`, texte clair | Action secondaire |
| Outline | Bordure + fond transparent | Action tertiaire |
| Ghost | Aucun fond/bordure | Toolbar, icônes |
| Destructive | Fond/bordure rouge | Suppression uniquement |

### 6.2 Cards

- Toujours : `rounded-xl` (12px) + `border` (1px `#1e293b` dark) + fond `#0a0f1e`
- Padding : 16-20px
- Variante interactive : hover → border violet subtle + shadow

### 6.3 Inputs

- Hauteur : 40px (standard) / 48px (login)
- Bordure : 1px `#1e293b`, focus → ring violet 2px
- Label au-dessus (12px medium)
- Placeholder : couleur `muted-foreground`

### 6.4 Modals

- Overlay : fond noir 50% + backdrop-blur
- Conteneur : max-w-lg (512px), rounded-xl, border, shadow-xl
- 3 zones : Header (titre + close) / Body (scroll) / Footer (actions)

### 6.5 Badges/Pills

- Rounded-full, padding 4px 8px, text 12px
- Fond coloré à 10% opacity + texte coloré
- Variantes : primary (violet), success (green), warning (amber), danger (red)

### 6.6 Toast notifications

- Position : bottom-right
- Style : carte avec border-left colorée (success=green, error=red, info=blue)
- Auto-dismiss : 5s
- Bouton close

---

## 7. SIDEBAR GAUCHE (navigation principale)

### Structure :
```
Logo DPM Calendar
─────────────────
🏠 Accueil        ← /home
📋 Aujourd'hui    ← /planner
📅 Calendrier     ← /calendar
─────────────────
▾ RITUELS QUOTIDIENS
  🌅 Planification  ← /daily-planning
  🎯 Focus          ← /planner?focus=true
▾ RITUELS HEBDO
  📆 Revue semaine  ← /planner?view=week
  ⭐ Objectifs semaine ← /goals
▾ PRODUCTIVITÉ
  ✓ Tâches         ← /tasks
  ⊞ Matrice        ← /matrix
  🔥 Habitudes     ← /habits
  🎯 Objectifs     ← /goals
▾ AUTOMATION
  🛡 Règles        ← /rules
▾ INSIGHTS
  📊 Dashboard     ← /dashboard
  📈 Analytics     ← /analytics
─────────────────
⚙ Paramètres     ← /settings
─────────────────
[FR|EN] [🌙/☀️]  v0.1.0
```

### Comportement :
- Desktop : visible, collapsible (→ icônes seules ~56px)
- Mobile : overlay slide-in, fermé par défaut
- Item actif : fond violet, texte blanc
- Sections : collapsibles (chevron)

---

## 8. RIGHT SIDEBAR (panneau contextuel)

**Contenu** :
- Icônes verticales pour toggle les sections
- Mini-calendrier (mois en cours, highlight aujourd'hui)
- Tâches à venir (3-5 items)
- Notes rapides
- Événements du jour

**Comportement** :
- Desktop : visible, collapsible (→ barre d'icônes ~48px)
- Tablet/Mobile : caché

---

## 9. INTERACTIONS CLÉS À REPRÉSENTER

| Interaction | Pages concernées | Comment le montrer |
|-------------|------------------|-------------------|
| Drag & Drop tâche → calendrier | Calendar, Planner, Daily Planning | Tâche avec cursor grab + zone drop highlight |
| Toggle de vue | Tasks (List/Kanban), Calendar (6 vues) | Boutons toggle dans la toolbar |
| Modal création | Partout | Bouton "+" → modal s'ouvre |
| Energy check | Home | Barre 1-5 cliquable |
| Collapse sidebar | Shell | Bouton chevron → sidebar se réduit |
| Mark task done | Home, Tasks, Planner | Checkbox cercle → coché vert |
| Focus timer | Planner, Calendar (detail) | Anneau SVG countdown |

---

## 10. DONNÉES RÉALISTES (utiliser dans les maquettes)

### Tâches exemple :
- "Finaliser la proposition client Desjardins" — URGENT, 2h, demain
- "Review PR #142 — refactoring auth" — HIGH, 45min, aujourd'hui
- "Préparer présentation Q2 Board" — HIGH, 3h, vendredi
- "Répondre emails fournisseurs" — MEDIUM, 30min, aujourd'hui
- "Mise à jour documentation API" — LOW, 1h, semaine prochaine
- "Planifier sprint planning lundi" — MEDIUM, 15min, dimanche

### Événements exemple :
- "Stand-up équipe produit" — 09:00-09:15, récurrent lun-ven
- "1:1 avec Sarah (design)" — 10:00-10:30, mardi
- "Workshop architecture microservices" — 14:00-16:00, mercredi
- "Revue sprint" — 15:00-16:00, vendredi
- "Déjeuner avec Marc" — 12:00-13:00, jeudi (personnel)

### Habitudes exemple :
- "Méditation" — 10min, matin, 🔥 7 jours
- "Course à pied" — 30min, 3x/semaine, 🔥 12 jours
- "Lecture" — 20min, soir, 🔥 3 jours
- "Journaling" — 10min, soir, 🔥 5 jours
- "Étirements" — 15min, matin, 🔥 2 jours

### Objectifs exemple :
- "Lire 24 livres cette année" — 15/24 (62.5%)
- "Courir 50h par mois" — 32/50h (64%)
- "Apprendre Rust" — 8/30 sessions (27%)
- "Perdre 5kg" — 3/5kg (60%)

### Stats exemple :
- Heures planifiées cette semaine : 24.5h
- Tâches complétées : 15/20
- Score productivité : 7.8/10
- Meeting load : 6.2h (15.5% du temps)
- Focus time : 8h cette semaine

---

## 11. ÉTATS À MONTRER

Pour chaque page, montrer au minimum :
1. **État rempli** (données normales) — prioritaire
2. **État vide** (première utilisation) — au moins 1 par page
3. **État loading** (skeleton) — optionnel mais recommandé

### État vide pattern :
```
[Icône 48x48 en gris]
Titre explicatif
Sous-titre d'aide
[+ Bouton CTA primary]
```

---

## 12. RESPONSIVE (3 breakpoints)

| Breakpoint | Largeur | Comportement |
|------------|---------|--------------|
| Mobile | 375px | 1 colonne, bottom nav, sidebar overlay |
| Tablet | 768px | 2 colonnes, sidebar icônes, pas de right sidebar |
| Desktop | 1280px | 3 panneaux, toutes les colonnes, vues complètes |

### Ce qui change par breakpoint :
- **Grilles** : 4→2→1 colonnes (ou 3→2→1)
- **Sidebar** : Panel → Icônes → Overlay
- **Right sidebar** : Visible → Hidden → Hidden
- **Toolbar** : Labels → Icônes → Icônes minimales
- **Calendar** : 7 jours → 7 jours (scroll) → 1 jour par défaut

---

## 13. COMMENT INTÉGRER LES MAQUETTES DANS L'APP

### Structure des fichiers (pour le développeur) :

```
src/
├── app/(dashboard)/
│   ├── layout.tsx          ← Shell (sidebar + main + right)
│   ├── home/page.tsx       ← Page Home
│   ├── calendar/page.tsx   ← Page Calendar
│   ├── tasks/page.tsx      ← Page Tasks
│   ├── dashboard/page.tsx  ← Page Dashboard
│   └── ...
├── features/
│   ├── calendar/components/  ← Composants spécifiques calendrier
│   ├── tasks/components/     ← Composants spécifiques tâches
│   ├── home/components/      ← Composants page home
│   └── ...
├── shared/components/
│   ├── ui/                   ← Primitives (Button, Input, Card...)
│   ├── layout/               ← Shell, Sidebar, ResizableLayout
│   └── ...
└── stores/                   ← État UI (Zustand)
```

### Mapping maquette → code :

| Élément maquette | Fichier code | Notes |
|------------------|-------------|-------|
| Shell layout | `shared/components/layout/DashboardClient.tsx` | Le conteneur 3 panneaux |
| Sidebar navigation | `shared/components/layout/Sidebar.tsx` | Navigation groupée |
| Right sidebar | `shared/components/layout/RightSidebarMenu.tsx` | Mini-cal + tâches |
| Calendar week view | `features/calendar/components/calendar/views/WeekView.tsx` | La grille horaire |
| Task Kanban | `features/tasks/components/tasks/kanban/KanbanBoard.tsx` | Colonnes DnD |
| Dashboard widgets | `features/analytics/components/dashboard-v2/` | Chaque widget = 1 fichier |
| Modaux | `features/*/components/*Modal.tsx` | Radix Dialog |

### Pour intégrer un nouveau design :

1. **Traduire les couleurs** → déjà dans `globals.css` via CSS variables
2. **Respecter la structure** → les composants existent, on modifie leur contenu/style
3. **Tester responsive** → le shell gère déjà le responsive, focus sur le contenu
4. **Ajouter des animations** → `globals.css` layer utilities (keyframes)
5. **Nouvelles icônes** → package `lucide-react` (toutes les icônes dispo)

---

## 14. CE QUE LE DESIGNER EST LIBRE DE CHANGER

| Aspect | Liberté | Contrainte |
|--------|---------|------------|
| Layout des widgets dans une page | ✅ Libre | Doit rester en grid (pas de position absolute) |
| Forme des cartes | ✅ Libre | Garder 12px radius + border |
| Taille des typos | ✅ Libre | Rester dans l'échelle Inter |
| Disposition des boutons | ✅ Libre | Touch target ≥ 44px |
| Illustrations/icons | ✅ Libre | Style outline (Lucide-like) |
| Micro-animations | ✅ Libre | < 300ms, ease-out |
| Densité d'info | ✅ Libre | Mobile = prioriser, pas cacher tout |
| Couleur primary | ❌ Fixe | `#8b5cf6` (violet) |
| Fond dark mode | ❌ Fixe | `#020817` / `#0a0f1e` |
| Font | ❌ Fixe | Inter |
| Navigation sidebar | ⚠️ Semi-libre | Garder les mêmes routes, libre sur le style |
| Nombre de pages | ❌ Fixe | 13 pages dashboard + landing + login |

---

## 15. TONE & FEEL VISÉ

- **Premium mais accessible** — pas austère/corporate, pas non plus "fun/coloré"
- **Dark-first** — le mode sombre est la star, le light est un fallback propre
- **Violet signature** — le violet `#8b5cf6` est l'accent partout
- **Calme et structuré** — on gère le temps, donc le design doit inspirer le contrôle
- **Différencié des concurrents** : Motion est clean-minimaliste, Sunsama est warm-analog, Akiflow est dark-dense → DPM vise "elegant-dark-with-a-spark-of-violet"
- **Data-rich sans être overwhelm** — montrer beaucoup d'info mais hiérarchisée clairement

---

*Ce document est auto-suffisant. Un designer peut produire des maquettes fidèles au produit sans accès au code source.*
