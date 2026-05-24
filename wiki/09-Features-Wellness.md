# 🧘 Bien-être

## Vue d'ensemble

Le module de bien-être couvre le **suivi d'énergie**, le **journal**, les **recaps**, la **mémoire émotionnelle**, et les **rituels** (matin/soir). Il s'intègre avec le moteur de chronotype pour une planification alignée avec les cycles circadiens.

---

## Chronotype Engine

### Quiz de 12 questions

Le quiz (`ChronotypeQuiz.tsx`) évalue le chronotype via 12 questions Likert (échelle 1-5) :
- Questions 1-6 : Tendance matinale (morningness)
- Questions 7-12 : Tendance vespérale (eveningness)

### Algorithme

`computeChronotype(answers)` dans `src/features/wellness/lib/chronotype.ts` :

1. Calcule `morningnessScore` (questions 1-6, normalisées)
2. Calcule `eveningnessScore` (questions 7-12, normalisées)
3. Détermine le type :

| Score | Chronotype |
|-------|-----------|
| Morningness > 0.6 | **LARK** (alouette) |
| Eveningness > 0.6 | **OWL** (hibou) |
| Sinon | **THIRD_BIRD** (intermédiaire, majorité) |

### Courbes d'énergie

Chaque chronotype a un profil de multiplicateurs par heure (0.0 à 1.5) :

| Chronotype | Pic | Creux | Profil |
|-----------|-----|-------|--------|
| **LARK** | 8h-10h (1.4) | Après 16h (0.5) | Matinal |
| **OWL** | 18h-22h (1.4) | Matin (0.5) | Vespéral |
| **THIRD_BIRD** | 10h-15h (1.2) | Plat | Intermédiaire |
| **UNKNOWN** | Plat (1.0) | Plat | Pas de quiz complété |

Ces multiplicateurs sont utilisés par l'AI Scheduler pour placer les tâches HIGH energy en période de pic.

---

## Energy Tracking

### EnergyTracker

Composant pour logger l'énergie, le mood, le stress et le focus (échelle 1-5) plusieurs fois par jour.

### EnergyOverlay

Surcouche sur le calendrier qui affiche les niveaux d'énergie par heure, permettant de visualiser la corrélation entre énergie et planification.

### Router `energy` (6 procédures)

- `log` : Logger énergie + mood + stress + focus
- `getToday` : Logs du jour
- `getWeeklyAverage` : Moyennes de la semaine
- `getPatterns` : Analyse (meilleure/pire heure, tendance, recommandations)

---

## Journal

Journaling quotidien avec prompts et tags.

### Router `journal` (8 procédures)

- `upsert` : Créer ou modifier l'entrée du jour (une par date)
- `getByDate` : Entrée pour une date spécifique
- `list` : Filtrer par dates et tags
- `getPrompts` : Suggestions de prompts de réflexion
- `getTags` : Tags uniques

---

## Recaps

Récapitulatifs automatiques (quotidiens, hebdomadaires, mensuels).

### Contenu d'un recap

| Champ | Description |
|-------|-------------|
| summary | Statistiques agrégées (Json) |
| highlights | Points forts de la période |
| improvements | Axes d'amélioration |
| insights | Observations automatiques |
| userNotes | Notes personnelles |
| rating | Note 1-5 donnée par l'utilisateur |

### Router `recap` (5 procédures)

- `get` : Obtenir ou auto-générer un recap pour une période
- `list` : Recaps passés
- `compare` : Comparer deux périodes
- `getDailyStats` : Stats quotidiennes détaillées

---

## Mémoire émotionnelle

Système pour capturer et retrouver des souvenirs liés à des émotions ou contextes spécifiques.

### Router `emotionalMemory` (8 procédures)

- `create` : Créer un souvenir avec contenu, tags, mood
- `getRelevant` : Récupérer les souvenirs pertinents au contexte actuel
- `checkForReminder` : Vérifier si des souvenirs existent pour le contexte
- `getSuggestedContexts` : Contextes suggérés basés sur l'historique

---

## Rituels

### Ritual du matin (`MorningRitual.tsx`)

- Checklist de routine matinale
- Sélection des 3 priorités du jour
- Intégration avec le **MCII Flow** (voir [[12-Science-Backed-Features]])

### Ritual du soir (`EveningShutdown.tsx`, `ShutdownRoutine.tsx`)

- Revue de la journée
- Gratitudes
- Close-the-loop (tâches ouvertes → planifier ou reporter)

### MCII Flow (`MCIIFlow.tsx`)

Implémentation du protocole **Mental Contrasting with Implementation Intentions** :

| Étape | Description |
|-------|-------------|
| **W**ish | L'objectif du jour |
| **O**utcome | Le résultat désiré |
| **O**bstacle | La barrière anticipée |
| **P**lan | Plan if-then de contingence |

---

## Composants

| Composant | Module | Rôle |
|-----------|--------|------|
| `ChronotypeQuiz` | chronotype/ | Quiz 12 questions |
| `EnergyTracker` | energy/ | Logger énergie |
| `EnergyOverlay` | energy/ | Overlay calendrier |
| `RecapWidget` | recap/ | Widget recap |
| `EmotionalMemory` | emotionalMemory/ | Capture émotions |
| `MorningRitual` | rituals/ | Routine matinale |
| `EveningShutdown` | rituals/ | Routine du soir |
| `ShutdownRoutine` | rituals/ | Fermeture guidée |
| `MCIIFlow` | rituals/ | Protocole MCII |

---

## Issues ouvertes liées

| # | Titre | Priorité |
|---|-------|----------|
| #99 | Workload Limit Warnings | P1 |
| #109 | Weekly/Monthly Review auto | P2 |
| #125 | Emotional Memory — Modèle Prisma dédié | P1 |
