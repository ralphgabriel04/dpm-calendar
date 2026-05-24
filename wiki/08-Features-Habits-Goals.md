# 🎯 Habitudes & Objectifs

## Habitudes

### Vue d'ensemble

Le système d'habitudes permet de suivre des comportements récurrents avec **streaks**, **heatmaps**, et **linking vers les objectifs**. Trois types d'habitudes sont supportés pour s'adapter aux différents styles de vie.

### Types d'habitudes

| Type | Description | Exemple |
|------|-------------|---------|
| **FIXED** | Horaire fixe, non déplaçable | Méditation à 7h tous les matins |
| **FLEXIBLE** | À faire dans la journée, timing flexible | Boire 2L d'eau |
| **CONDITIONAL** | Déclenchée par un contexte | Étirer après chaque réunion >1h |

### Fréquences

| Fréquence | Description |
|-----------|-------------|
| DAILY | Tous les jours |
| WEEKLY | Chaque semaine |
| MONTHLY | Chaque mois |
| CUSTOM | Jours spécifiques (preferredDays: 0-6) |

### Composants

| Composant | Rôle |
|-----------|------|
| `HabitCard.tsx` | Carte avec nom, couleur, streak actuel, bouton de complétion |
| `HabitModal.tsx` | Formulaire création/édition complet |
| `StreakDisplay.tsx` | Affichage visuel du streak (flamme + compteur) |

### Streaks

Le streak est calculé automatiquement lors du logging :
- **currentStreak** : Nombre de jours consécutifs complétés
- **longestStreak** : Meilleur streak historique
- Le streak est mis à jour à chaque appel de `habit.log`

### Heatmap

La procédure `habit.getHeatmap` retourne les données pour une visualisation type GitHub :
- Plage de dates configurable
- Pour chaque jour : `{ date, count, completed }`
- Les jours manquants sont remplis avec des valeurs par défaut

### Habitudes protégées

Les habitudes marquées `isProtected: true` sont exclues de la re-planification par l'AI Scheduler. Utile pour les rituels importants.

---

## Objectifs SMART

### Vue d'ensemble

Les objectifs suivent le framework **SMART** (Specific, Measurable, Achievable, Relevant, Time-bound) avec un validateur intégré.

### Validateur SMART

`src/features/goals/lib/smart-validation.ts` évalue chaque objectif :

| Critère | Condition |
|---------|-----------|
| **S**pecific | Titre >= 10 caractères, description >= 20 caractères |
| **M**easurable | Valeur cible numérique + unité définie |
| **A**chievable | Cible entre 1 et 10 000 |
| **R**elevant | Catégorie assignée |
| **T**ime-bound | Dates de début et fin définies (fin > début) |

Retourne un **score SMART** (0-100) et des **suggestions** d'amélioration.

### Types d'objectifs

| Type | Description | Exemple |
|------|-------------|---------|
| CUMULATIVE | Accumuler une valeur | Courir 100 km ce mois |
| STREAK | Maintenir un streak | 30 jours consécutifs de méditation |
| COMPLETION | Binaire (fait/pas fait) | Terminer le cours en ligne |

### Statuts

| Statut | Description |
|--------|-------------|
| ACTIVE | En cours |
| COMPLETED | Atteint (auto-détecté quand currentValue >= targetValue) |
| PAUSED | Mis en pause |
| ABANDONED | Abandonné |

### Composants

| Composant | Rôle |
|-----------|------|
| `GoalCard.tsx` | Carte avec barre de progression, jours restants |
| `GoalModal.tsx` | Formulaire création/édition |
| `SMARTIndicator.tsx` | Indicateur visuel des 5 critères SMART |

### Linking Habits → Goals

Les habitudes peuvent être liées à un objectif via `goal.linkHabit`. La progression de l'objectif est automatiquement mise à jour via `goal.logProgress`.

---

## Modèles Prisma

| Modèle | Description |
|--------|-------------|
| **Habit** | Définition (type, fréquence, couleur, streak) |
| **HabitLog** | Log quotidien (completed, count, mood) |
| **HabitBlock** | Bloc planifié dans le calendrier |
| **Goal** | Objectif avec type, valeur cible, progression |
| **GoalProgress** | Log de progression par date |
| **DailyStats** | Statistiques quotidiennes agrégées |

---

## Routers tRPC

### `habit` (8 procédures)

- `list` : Habitudes avec logs des 30 derniers jours
- `get` : Détail avec 90 jours de logs
- `create`, `update`, `delete` : CRUD
- `log` : Logger une complétion (upsert), mettre à jour le streak
- `getTodayStatus` : Statut du jour pour les habitudes actives
- `getHeatmap` : Données heatmap pour visualisation

### `goal` (8 procédures)

- `list`, `get` : Avec habitudes et progress logs
- `create`, `update`, `delete` : CRUD
- `logProgress` : Logger progression (auto-update currentValue et status)
- `linkHabit` : Lier une habitude
- `getCategories` : Catégories uniques

---

## Store Zustand : `useHabitStore`

| State | Type | Persiste |
|-------|------|----------|
| filters | `{ search, showInactive, goalId }` | Oui |
| habitModalOpen | boolean | Non |
| editingHabitId | string \| null | Non |
| selectedDate | Date | Non |

---

## Issues ouvertes liées

| # | Titre | Priorité |
|---|-------|----------|
| #105 | Habit Scheduling dans le calendrier | P1 |
| #106 | Goal ↔ Task linking | P1 |
| #126 | Goals SMART complet (Milestones, catégories) | P1 |
