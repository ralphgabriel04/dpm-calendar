# 🔬 Features Science-Backed

## Vue d'ensemble

DPM Calendar se différencie en implémentant **7 mécanismes scientifiques prouvés** directement dans le produit. Aucun concurrent ne combine ces approches.

---

## 1. Chronotype Engine (Rythme circadien)

### Science

La recherche en chronobiologie montre que chaque individu a un **chronotype** génétiquement déterminé qui influence ses pics de performance cognitive. Le questionnaire de morningness-eveningness (Horne & Ostberg, 1976) identifie ces profils avec une fiabilité test-retest de 0.85+.

**Taille d'effet** : Les performances cognitives varient de 20-30% entre le pic et le creux circadien.

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Quiz** | 12 questions Likert (5 points) |
| **Chronotypes** | LARK, OWL, THIRD_BIRD, UNKNOWN |
| **Courbes** | Multiplicateurs 0.0-1.5 par heure (24h) |
| **Intégration** | AI Scheduler place les tâches HIGH energy aux pics |
| **Modèles** | `User.chronotype`, `chronotype.router` |
| **Tests** | 15 tests unitaires |

### Courbes énergétiques

| Heure | LARK | OWL | THIRD_BIRD |
|-------|------|-----|-----------|
| 6h | 0.7 | 0.3 | 0.5 |
| 8h | 1.4 | 0.5 | 0.8 |
| 10h | 1.3 | 0.7 | 1.2 |
| 14h | 0.8 | 0.9 | 1.0 |
| 18h | 0.5 | 1.2 | 0.8 |
| 21h | 0.3 | 1.4 | 0.5 |

---

## 2. Estimation Calibration (Biais de planification)

### Science

Le **planning fallacy** (Kahneman & Tversky, 1979) montre que les humains sous-estiment systématiquement le temps requis de 25-50%. La méthode de **reference class forecasting** corrige ce biais en utilisant des données historiques.

**Taille d'effet** : Réduction de 30-40% des dépassements après calibration.

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Calibration** | `getCalibratedEstimate` compare planned vs actual |
| **Factor** | Ratio moyen `actualDuration / plannedDuration` |
| **Feedback** | "Vous sous-estimez de X% — ajuster" |
| **Stats** | Précision, over/under count, tendances |
| **Router** | `aiScheduler.recordActualDuration`, `aiScheduler.getStats` |
| **Tests** | 10 tests unitaires |

---

## 3. Attention Shield (Focus blocks immovables)

### Science

La recherche sur l'**attention résiduelle** (Leroy, 2009) montre qu'après un changement de contexte, 20-50% de l'attention reste sur la tâche précédente pendant 10-25 minutes. Protéger des blocs de travail ininterrompu augmente la productivité de 40%.

**Taille d'effet** : +40% de productivité avec des blocs de 90 minutes protégés.

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Focus blocks** | Créneaux immovables dans le calendrier |
| **Protection** | L'AI Scheduler ne les déplace jamais |
| **Détection** | Rejet automatique des conflits |
| **Durée** | 15-240 minutes |
| **Router** | `aiScheduler.createFocusBlock`, `aiScheduler.getFocusBlocks` |
| **Tests** | 5 tests unitaires |

---

## 4. Anti-Procrastination CBT (Thérapie cognitive)

### Science

La **CBT** (Beck, 1960s) est le traitement le plus étudié pour la procrastination. Les distorsions cognitives (perfectionnisme, catastrophisation, évitement) sont identifiées et recadrées. Les **micro-commitments** (2-10 min) exploitent le **Zeigarnik effect** : une tâche commencée crée une tension qui motive la continuation.

**Taille d'effet** : Réduction de 30-50% de la procrastination avec CBT structurée.

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Détection** | 5 types : perfectionism, overwhelm, avoidance, fear_of_failure, generic |
| **Reframes** | 18 reframes structurés (distortion + reframe + microAction) |
| **Micro-sessions** | 5-30 minutes avec option de continuation |
| **Patterns** | Analyse sur 30 jours (heure productive, évitements, tendances) |
| **Router** | `antiProcrastination` (7 procédures) |
| **Librairie** | `cbtReframes.ts` |

---

## 5. Morning MCII Ritual (Implementation intentions)

### Science

Le protocole **MCII** (Oettingen, 2012) — Mental Contrasting with Implementation Intentions — combine la visualisation positive avec la planification de contingence. Les études montrent un **doublement du taux de réussite** des objectifs par rapport à la simple fixation d'objectifs.

**Taille d'effet** : +100% de taux d'atteinte d'objectifs (méta-analyse Gollwitzer & Sheeran, 2006).

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Flow** | Wish → Outcome → Obstacle → Plan (if-then) |
| **Intégration** | Rituel du matin avec sélection des 3 priorités |
| **Composant** | `MCIIFlow.tsx`, `MorningRitual.tsx` |
| **Fermeture** | `EveningShutdown.tsx` pour close-the-loop |

---

## 6. Daily Priority Cap (Charge cognitive)

### Science

La recherche sur la **capacité de la mémoire de travail** (Miller, 1956; Cowan, 2001) montre que les humains ne peuvent gérer efficacement que **3-5 items** simultanément. Au-delà, la qualité de décision décline de 40%.

**Taille d'effet** : -40% de qualité décisionnelle avec >5 priorités simultanées.

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Cap** | 3 tâches HIGH/URGENT par jour (configurable 1-5) |
| **Enforcement** | Warning lors de la création au-delà du cap |
| **UI** | `PriorityCapModal.tsx` |
| **Router** | `user.getDailyPriorityCap`, `user.updateDailyPriorityCap` |
| **Tests** | Intégré dans les tests du task router |

---

## 7. N-of-1 Experiment Lab (Évidence personnalisée)

### Science

Les **études N-of-1** sont la méthode gold standard en médecine personnalisée pour déterminer ce qui fonctionne pour un individu spécifique. Appliquées à la productivité, elles permettent de valider des stratégies personnelles avec des données.

### Implémentation dans DPM

| Élément | Détail |
|---------|--------|
| **Workflow** | Hypothèse → Métrique → Baseline → Intervention → Résultat |
| **Résultats** | SUCCESS, FAILURE, INCONCLUSIVE, PENDING |
| **Modèle** | `Experiment` (hypothesis, metric, baselineValue, interventionValue) |
| **Router** | `experiment` (4 procédures) |
| **Composant** | `ExperimentsList.tsx` |
| **Tests** | Validé via les tests du experiment router |

### Exemples d'expériences

| Hypothèse | Métrique | Baseline | Intervention |
|-----------|---------|----------|-------------|
| "Le journaling du matin augmente ma focus" | Heures de focus/jour | Semaine sans journal | Semaine avec journal |
| "Les micro-pauses de 5min/h améliorent ma productivité" | Tâches complétées/jour | Sans pauses | Avec pauses toutes les heures |

---

## Résumé : Pourquoi aucun concurrent ne fait ça

| Feature | Motion | Sunsama | Reclaim | DPM |
|---------|--------|---------|---------|-----|
| Chronotype Engine | - | - | - | ✅ |
| Calibration estimations | Partiel | - | - | ✅ |
| Focus blocks immovables | - | - | ✅ | ✅ |
| Anti-procrastination CBT | - | - | - | ✅ |
| MCII Ritual | - | Partiel | - | ✅ |
| Priority Cap | - | ✅ | - | ✅ |
| N-of-1 Experiments | - | - | - | ✅ |

**DPM est le seul produit qui combine les 7 mécanismes** dans une expérience intégrée.
