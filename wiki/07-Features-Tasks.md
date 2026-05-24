# ✅ Tâches

## Vue d'ensemble

Le module de tâches offre **6 vues** pour gérer les tâches, avec des fonctionnalités avancées : **priority cap** quotidien, **checklists**, **time blocking**, **tags**, **estimation d'énergie**, et conversion en events calendrier.

---

## 6 vues tâches

| Vue | Description | Composant |
|-----|-------------|-----------|
| **List** | Liste triable avec filtres | `TaskListView.tsx` |
| **Kanban** | Board drag-and-drop par statut | `KanbanBoard.tsx` |
| **Calendar** | Tâches sur le calendrier | `TaskCalendarView.tsx` |
| **Gantt** | Timeline Gantt | `GanttView.tsx` |
| **Dashboard** | Vue analytique | `DashboardView.tsx` |
| **Workload** | Distribution de charge | `WorkloadView.tsx` |

### Kanban

Le Kanban utilise `@dnd-kit` pour le drag-and-drop. Composants :
- `KanbanColumn.tsx` : Colonne par statut (TODO, IN_PROGRESS, DONE)
- `DraggableTaskCard.tsx` : Carte draggable
- `KanbanBoard.tsx` : Orchestrateur

---

## Priority Cap quotidien

Science-backed feature (#142) qui limite le nombre de tâches HIGH/URGENT par jour.

- **Défaut** : 3 tâches prioritaires par jour
- **Configurable** : 1 à 5 via `user.updateDailyPriorityCap`
- **Enforcement** : Avertissement lors de la création si le cap est atteint
- **UI** : `PriorityCapModal.tsx` pour alerter l'utilisateur
- **Raison scientifique** : Prévenir la surcharge cognitive et forcer la priorisation

---

## Matrice d'Eisenhower

`EisenhowerMatrix.tsx` organise les tâches en 4 quadrants :

| | Urgent | Non Urgent |
|---|--------|-----------|
| **Important** | Q1 : Faire maintenant | Q2 : Planifier |
| **Non important** | Q3 : Déléguer | Q4 : Éliminer |

L'accent est mis sur le **Quadrant 2** (planification stratégique).

---

## Composants clés

| Composant | Rôle |
|-----------|------|
| `TaskForm.tsx` | Formulaire création/édition |
| `TaskModal.tsx` | Modal complet |
| `TaskDetailModal.tsx` | Vue détaillée |
| `TaskCard.tsx` | Carte résumée |
| `TaskRow.tsx` | Ligne dans la vue liste |
| `PriorityCapModal.tsx` | Alerte dépassement de cap |

---

## Modèles Prisma

| Modèle | Description |
|--------|-------------|
| **Task** | Tâche avec priorité, status, tags, énergie, durée |
| **ChecklistItem** | Sous-item de tâche (position ordonnée) |
| **TimeBlock** | Bloc de temps planifié (startAt → endAt) |
| **FocusSession** | Session de focus liée à une tâche |

---

## Router tRPC : `task`

20 procédures couvrant :

- **CRUD** : list, get, create, update, delete
- **Quick actions** : toggle (DONE/TODO), deferTask (+1 jour)
- **Scheduling** : scheduleTask, convertToEvent, getTimeBlocks, getUnscheduled
- **Checklists** : addChecklistItem, toggleChecklistItem, deleteChecklistItem, getChecklistItems
- **Organisation** : reorder, getTags, getTodayPriorities
- **Tracking** : updateActualDuration (incrémente depuis le focus timer)

### Filtres disponibles

```typescript
{
  status?: TaskStatus[];      // TODO, IN_PROGRESS, DONE, CANCELLED
  priority?: Priority[];      // LOW, MEDIUM, HIGH, URGENT
  tags?: string[];
  search?: string;            // Recherche dans le titre
  dueBefore?: Date;
  dueAfter?: Date;
  parentTaskId?: string;      // Filtrer les subtasks
  includeCompleted?: boolean;
}
```

---

## Time Blocking

Les tâches peuvent être planifiées dans le calendrier via `scheduleTask` :

1. Crée un `TimeBlock` avec startAt/endAt
2. Optionnellement crée un `Event` calendrier associé
3. La tâche apparaît dans la vue calendrier
4. Les blocs sont considérés comme "occupés" par l'AI Scheduler

---

## Estimation d'énergie

Chaque tâche peut spécifier un niveau d'énergie requis :

| Niveau | Description | Utilisation |
|--------|-------------|------------|
| LOW | Tâche légère | Planifiée en période de basse énergie |
| MEDIUM | Effort modéré | Flexible |
| HIGH | Deep work | Planifiée en période de pic énergie |

L'AI Scheduler utilise ces niveaux combinés avec la courbe énergétique du chronotype pour placer les tâches au bon moment.

---

## Store Zustand : `useTaskStore`

| State | Type | Description |
|-------|------|-------------|
| viewType | string | Vue active (list, kanban, calendar, etc.) |
| filters | TaskFilters | Filtres actifs |
| sortBy | string | Champ de tri (dueAt, priority, createdAt, title) |
| sortOrder | string | asc / desc |
| selectedTaskIds | string[] | Tâches sélectionnées |

**Persiste** : viewType, filters, sortBy, sortOrder

---

## Issues ouvertes liées

| # | Titre | Priorité |
|---|-------|----------|
| #98 | Task Templates & Recurring Tasks | P1 |
| #97 | Time Tracking UI (Planned vs Actual) | P1 |
| #107 | Quick Capture NLP | P1 |
