# 📡 Référence API (tRPC)

> **25 routers**, **150+ procedures**, entièrement type-safe de bout en bout.

## Infrastructure tRPC

### Authentification et rate limiting

| Procedure | Auth requise | Rate Limit |
|-----------|-------------|-----------|
| `publicProcedure` | Non | 300 req/min par IP |
| `loginProcedure` | Non | 5 req/15min par IP |
| `protectedProcedure` | Oui | 300 queries/min par user |
| `protectedMutationProcedure` | Oui | 100 mutations/min par user |
| `protectedSyncProcedure` | Oui | 10 syncs/5min par user |

### Client-side usage

```typescript
import { trpc } from "@/infrastructure/trpc/client";

// Query
const { data } = trpc.event.list.useQuery({ startDate, endDate });

// Mutation
const mutation = trpc.event.create.useMutation();
await mutation.mutateAsync({ title: "Meeting", calendarId, startAt, endAt });
```

### Endpoint

- **URL** : `/api/trpc/[procedure]`
- **Méthodes** : GET (queries), POST (mutations)
- **Sérialisation** : SuperJSON (dates, BigInt, etc.)
- **Erreurs** : Zod validation automatique avec détails

---

## 1. Event Router (`event`)

Gestion des événements calendrier avec récurrence.

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Lister les events dans une plage (expanse les récurrents) |
| `get` | query | Obtenir un event avec calendar, tasks, parent |
| `create` | mutation | Créer un event (durée calculée automatiquement) |
| `update` | mutation | Modifier un event |
| `delete` | mutation | Soft delete (status → CANCELLED) |
| `move` | mutation | Drag & drop (déplacer start/end) |

**Inputs principaux :**
- `list` : `{ calendarIds?: string[], startDate: Date, endDate: Date }`
- `create` : `{ calendarId, title, startAt, endAt, description?, location?, isAllDay?, timezone?, rrule?, color?, reminderMinutes? }`
- `delete` : `{ id, deleteType?: "single" | "this_and_future" | "all" }`

---

## 2. Calendar Router (`calendar`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Lister les calendriers (crée un défaut si aucun) |
| `get` | query | Obtenir un calendrier |
| `create` | mutation | Créer un calendrier |
| `update` | mutation | Modifier (nom, couleur, visibilité) |
| `delete` | mutation | Supprimer (interdit si calendrier par défaut) |
| `toggleVisibility` | mutation | Afficher/masquer |

---

## 3. Calendar Section Router (`calendarSection`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Lister les sections avec calendriers |
| `get` | query | Obtenir une section |
| `create` | mutation | Créer une section |
| `update` | mutation | Modifier |
| `delete` | mutation | Supprimer (déplace les calendriers) |
| `reorder` | mutation | Réordonner les sections |
| `moveCalendar` | mutation | Déplacer un calendrier entre sections |

---

## 4. Task Router (`task`)

Gestion des tâches avec priority cap, checklists, et time blocking.

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Filtrer les tâches (status, priority, tags, search, dates) |
| `get` | query | Tâche avec subtasks, event link, checklist |
| `create` | mutation | Créer (enforce daily priority cap de 3) |
| `update` | mutation | Modifier (ajoute completedAt si status=DONE) |
| `delete` | mutation | Hard delete |
| `toggle` | mutation | Quick toggle DONE/TODO |
| `convertToEvent` | mutation | Convertir tâche en event calendrier |
| `scheduleTask` | mutation | Planifier avec time block + event optionnel |
| `getTimeBlocks` | query | Time blocks dans une plage |
| `getUnscheduled` | query | Tâches sans plannedStartAt |
| `reorder` | mutation | Réordonner subtasks |
| `updateActualDuration` | mutation | Incrémenter durée réelle (focus timer) |
| `getTags` | query | Tags uniques |
| `getTodayPriorities` | query | Tâches HIGH/URGENT du jour + cap |
| `deferTask` | mutation | Reporter (+1 jour, baisser priorité) |
| `addChecklistItem` | mutation | Ajouter un item checklist |
| `toggleChecklistItem` | mutation | Toggle completion |
| `deleteChecklistItem` | mutation | Supprimer item |
| `getChecklistItems` | query | Items d'une tâche |

---

## 5. Habit Router (`habit`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Habitudes avec logs des 30 derniers jours |
| `get` | query | Habitude avec 90 jours de logs |
| `create` | mutation | Créer (type, fréquence, jours préférés, goal link) |
| `update` | mutation | Modifier |
| `delete` | mutation | Supprimer |
| `log` | mutation | Logger une complétion (upsert), met à jour le streak |
| `getTodayStatus` | query | Statut du jour (completedToday, todayCount) |
| `getHeatmap` | query | Données heatmap pour visualisation |

---

## 6. Goal Router (`goal`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Objectifs avec habitudes et progress logs |
| `get` | query | Objectif complet |
| `create` | mutation | Créer (CUMULATIVE, STREAK, COMPLETION) |
| `update` | mutation | Modifier |
| `delete` | mutation | Supprimer |
| `logProgress` | mutation | Logger progression, auto-update status |
| `linkHabit` | mutation | Lier une habitude à un objectif |
| `getCategories` | query | Catégories uniques |

---

## 7. Rule Router (`rule`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Règles avec execution counts |
| `get` | query | Règle avec 20 dernières exécutions |
| `create` | mutation | Créer (PROTECTION, AUTO_SCHEDULE, BREAK, CONDITIONAL) |
| `update` | mutation | Modifier |
| `delete` | mutation | Supprimer |
| `toggle` | mutation | Activer/désactiver |
| `execute` | mutation | Exécution manuelle |
| `getTemplates` | query | Templates pré-construits (focus time, lunch break, buffer) |

---

## 8. AI Scheduler Router (`aiScheduler`)

Planification intelligente energy-aware.

| Procedure | Type | Description |
|-----------|------|-------------|
| `planDay` | query | Générer un plan optimal (tâches non planifiées) |
| `acceptPlan` | mutation | Créer les time blocks du plan |
| `replan` | mutation | Re-planifier après un déplacement |
| `applyReplan` | mutation | Appliquer la re-planification |
| `getCalibratedEstimate` | query | Estimation calibrée avec historique |
| `recordActualDuration` | mutation | Enregistrer durée réelle (calibration) |
| `getFocusBlocks` | query | Blocs focus immovables du jour |
| `createFocusBlock` | mutation | Créer un bloc focus immovable |
| `getStats` | query | Statistiques de précision des estimations |

---

## 9. Focus Session Router (`focusSession`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `start` | mutation | Démarrer (pomodoro_25_5, pomodoro_50_10, deep_90, custom) |
| `stop` | mutation | Arrêter, calcule actualMins |
| `pause` | mutation | Pause (incrémente interruptions) |
| `resume` | mutation | Reprendre |
| `list` | query | Sessions récentes |
| `todayStats` | query | Stats du jour (totalMins, sessions, streak, % objectif) |

---

## 10. Anti-Procrastination Router (`antiProcrastination`)

Moteur anti-procrastination basé sur la CBT.

| Procedure | Type | Description |
|-----------|------|-------------|
| `getQuickStarts` | query | Micro-commitments pour tâches en attente |
| `startMicroSession` | mutation | Démarrer micro-session (5-30 min) |
| `completeMicroSession` | mutation | Compléter, option de continuation |
| `reportAvoidance` | mutation | Reporter évitement, obtenir reframe CBT |
| `getReframe` | query | Obtenir un reframe CBT à la demande |
| `getPatterns` | query | Patterns de procrastination (30 jours) |
| `checkIn` | query | Tâches qui tiennent dans le temps disponible |

---

## 11. Chronotype Router (`chronotype`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `submitQuiz` | mutation | Soumettre le quiz 12 questions → chronotype + courbe |
| `get` | query | Obtenir chronotype et courbe énergie |
| `getEnergyCurve` | query | Multiplicateurs par heure (0.0-1.5) |

---

## 12. Energy Router (`energy`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `log` | mutation | Logger énergie (1-5), mood, stress, focus |
| `list` | query | Logs dans une plage |
| `getToday` | query | Logs du jour |
| `getWeeklyAverage` | query | Moyenne de la semaine |
| `getPatterns` | query | Patterns (meilleure/pire heure, tendance, recommandations) |
| `delete` | mutation | Supprimer un log |

---

## 13. Sync Router (`sync`)

Rate limit : `protectedSyncProcedure` (10/5min)

| Procedure | Type | Description |
|-----------|------|-------------|
| `listAccounts` | query | Comptes connectés avec conflits |
| `getConflicts` | query | Conflits non résolus |
| `resolveConflict` | mutation | Résoudre (USE_LOCAL, USE_REMOTE, MERGE, SKIP) |
| `updateAccount` | mutation | Modifier paramètres sync |
| `deleteAccount` | mutation | Déconnecter un compte |
| `getLogs` | query | Historique de sync |
| `triggerSync` | mutation | Sync manuelle |
| `disconnectGoogle` | mutation | Déconnecter Google |
| `refreshGoogleCalendars` | mutation | Rafraîchir calendriers Google |
| `disconnectMicrosoft` | mutation | Déconnecter Microsoft |
| `refreshMicrosoftCalendars` | mutation | Rafraîchir calendriers Microsoft |

---

## 14. Dashboard Router (`dashboard`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `getOverview` | query | Stats par période (heures, tâches, score productivité) |
| `getHeatmapData` | query | Données heatmap (hours, tasks, overload) |
| `getTimeDistribution` | query | Répartition focus/meeting/break |
| `getUpcomingDeadlines` | query | Prochaines échéances |
| `getWorkloadBalance` | query | Charge quotidienne (light/normal/heavy/overloaded) |
| `getHabitStreaks` | query | Top 5 streaks actifs |
| `getProductivityScore` | query | Score pondéré (30% tâches, 30% focus, 20% habitudes, 20% équilibre) |
| `getGoalProgress` | query | Progression des objectifs actifs |

---

## 15. Workload Router (`workload`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `getDailyWorkload` | query | Charge quotidienne (480 min/jour = 100%) |
| `getCriticalWeeks` | query | Semaines critiques (>90% capacité) |
| `getPerceivedUrgency` | query | Score d'urgence perçue (0-100) |
| `getAlerts` | query | Alertes surcharge (critical, warning, info) |

---

## 16. Meeting Load Router (`meetingLoad`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `weeklyMeetingLoad` | query | Analyse meetings 7 prochains jours (seuil: 15h) |
| `backToBackBuffers` | query | Meetings dos-à-dos (<15min gap) |
| `insertBuffer` | mutation | Insérer un buffer entre meetings |
| `insertAllBuffers` | mutation | Insérer tous les buffers en batch |

---

## 17. Notification Router (`notification`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Lister notifications |
| `getUnreadCount` | query | Compteur non lues |
| `markAsRead` | mutation | Marquer lue |
| `markAllAsRead` | mutation | Tout marquer lu |
| `dismiss` | mutation | Rejeter |
| `getPreferences` | query | Préférences (crée si manquante) |
| `updatePreferences` | mutation | Modifier préférences |
| `create` | mutation | Créer notification |
| `subscribePush` | mutation | S'abonner push |
| `unsubscribePush` | mutation | Se désabonner |
| `testPush` | mutation | Tester push |
| `getPushSubscriptions` | query | Abonnements actifs |

---

## 18. User Router (`user`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `me` | query | Profil avec préférences |
| `checkOnboarding` | query | Statut onboarding |
| `completeOnboarding` | mutation | Terminer onboarding, créer calendrier défaut |
| `updatePreferences` | mutation | Modifier préférences |
| `getPreferences` | query | Obtenir préférences |
| `getDailyPriorityCap` | query | Limite priorités quotidiennes |
| `updateDailyPriorityCap` | mutation | Modifier limite (1-5) |
| `deleteMyAccount` | mutation | Supprimer compte (RGPD Art. 17) |
| `exportMyData` | mutation | Exporter données (RGPD Art. 20) |

---

## 19. Sharing Router (`sharing`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `createLink` | mutation | Créer lien de partage |
| `listLinks` | query | Liens actifs |
| `revokeLink` | mutation | Révoquer un lien |
| `getSharedContent` | query (public) | Accéder au contenu partagé |
| `createPoll` | mutation | Créer sondage de créneau |
| `listPolls` | query | Lister sondages |
| `getPoll` | query (public) | Voir un sondage |
| `votePoll` | mutation (public) | Voter sur un sondage |
| `finalizePoll` | mutation | Finaliser un sondage |
| `getPreferences` | query | Préférences affichage |
| `updatePreferences` | mutation | Modifier préférences affichage |

---

## 20. Recap Router (`recap`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `get` | query | Obtenir ou auto-générer un recap |
| `list` | query | Lister recaps passés |
| `update` | mutation | Ajouter notes/rating |
| `getDailyStats` | query | Stats quotidiennes dans une plage |
| `compare` | query | Comparer deux périodes |

---

## 21. Journal Router (`journal`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `list` | query | Lister entrées |
| `getByDate` | query | Entrée par date |
| `upsert` | mutation | Créer ou modifier entrée du jour |
| `delete` | mutation | Supprimer entrée |
| `logEnergy` | mutation | Logger énergie (legacy) |
| `getEnergyLogs` | query | Logs énergie (legacy) |
| `getPrompts` | query | Suggestions de prompts journal |
| `getTags` | query | Tags uniques |

---

## 22. Emotional Memory Router (`emotionalMemory`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `create` | mutation | Créer un souvenir émotionnel |
| `list` | query | Lister souvenirs |
| `getRelevant` | query | Souvenirs pertinents au contexte actuel |
| `get` | query | Obtenir un souvenir |
| `update` | mutation | Modifier |
| `delete` | mutation | Supprimer |
| `getSuggestedContexts` | query | Contextes suggérés |
| `checkForReminder` | query | Vérifier si des souvenirs pertinents existent |

---

## 23. Comment Router (`comment`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `listForEvent` | query | Commentaires d'un event |
| `create` | mutation | Commenter (1-5000 chars) |
| `update` | mutation | Modifier commentaire |
| `delete` | mutation | Supprimer |
| `getCounts` | query | Compteurs pour plusieurs events |

---

## 24. Suggestion Router (`suggestion`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `getOptimalSlots` | query | Top 5 créneaux optimaux avec scoring |
| `respond` | mutation | Accepter ou rejeter suggestion |
| `list` | query | Lister suggestions |
| `createSchedulingSuggestion` | mutation | Créer suggestion de planification |

---

## 25. Experiment Router (`experiment`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `create` | mutation | Créer expérience N-of-1 |
| `list` | query | Lister expériences |
| `complete` | mutation | Compléter avec résultat |
| `delete` | mutation | Supprimer |

---

## Cron Job : Calendar Sync

| Propriété | Valeur |
|-----------|--------|
| **Endpoint** | `GET /api/cron/sync` |
| **Fréquence** | Toutes les 5 minutes |
| **Auth** | Bearer token via `CRON_SECRET` |
| **Opérations** | Refresh tokens expirés, pull events (30j passé, 90j futur), push events PENDING_PUSH, détecter conflits |
| **Retour** | `{ success, duration, results[], summary }` |
