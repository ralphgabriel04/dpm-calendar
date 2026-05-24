# 📅 Calendrier

## Vue d'ensemble

Le calendrier est le coeur de DPM Calendar. Il offre **6 vues** différentes, le support de la **récurrence** (RFC 5545), la **synchronisation** bi-directionnelle avec Google Calendar et Microsoft Outlook, et le **drag-and-drop** pour réorganiser les événements.

---

## 6 vues calendrier

| Vue | Description | Composant |
|-----|-------------|-----------|
| **Day** | Vue 24h avec time slots | `DayView.tsx` |
| **Week** | Grille 7 jours | `WeekView.tsx` |
| **Month** | Grille mensuelle | `MonthView.tsx` |
| **Agenda** | Liste chronologique des events | `AgendaView.tsx` |
| **Timeline** | Timeline horizontale | `TimelineView.tsx` |
| **Workload** | Heatmap de charge | `WorkloadView.tsx` |

L'état de la vue active est géré par `useCalendarStore` (Zustand) et persiste dans localStorage.

---

## Composants clés

### Grille et navigation

| Composant | Rôle |
|-----------|------|
| `CalendarHeader` | Navigation (prev/next/today), sélecteur de vue |
| `CalendarSidebar` | Liste des calendriers, toggle visibilité |
| `MiniCalendar` | Petit calendrier pour navigation rapide |
| `TimeColumn` | Colonne horaire (00:00 - 23:00) |
| `DayColumn` | Colonne de jour avec time slots |
| `AllDayRow` | Bande pour events toute la journée |
| `CurrentTimeIndicator` | Ligne rouge animée indiquant l'heure actuelle |

### Events

| Composant | Rôle |
|-----------|------|
| `EventBlock` | Rendu d'un event dans la grille |
| `EventForm` | Formulaire création/édition |
| `EventModal` | Modal pour le formulaire |
| `EventPopover` | Preview rapide au survol |
| `RecurrenceSelector` | Configuration de récurrence (RRULE) |
| `EventComments` | Commentaires collaboratifs sur un event |

### Drag and Drop

| Composant | Rôle |
|-----------|------|
| `DraggableEventBlock` | Event draggable |
| `DraggableTaskMini` | Tâche draggable vers le calendrier |
| `DroppableTimeSlot` | Zone de dépôt pour planifier |

### Widgets

| Composant | Rôle |
|-----------|------|
| `UnscheduledTasksSidebar` | Tâches sans time block (prêt à drag) |
| `UpcomingEventsWidget` | Prochains events |
| `TimeBreakdownWidget` | Répartition du temps |

---

## Modèles Prisma impliqués

- **Calendar** : Calendrier avec couleur, visibilité, provider
- **CalendarSection** : Groupement de calendriers
- **Event** : Événement avec récurrence, sync, attendees
- **Attendee** : Participants avec statut (PENDING, ACCEPTED, DECLINED)
- **CalendarAccount** : Compte externe (Google, Microsoft)

---

## Routers tRPC

| Router | Procédures principales |
|--------|----------------------|
| `event` | list, create, update, delete, move |
| `calendar` | list, create, update, delete, toggleVisibility |
| `calendarSection` | list, create, reorder, moveCalendar |
| `sync` | triggerSync, listAccounts, resolveConflict |

---

## Récurrence

DPM supporte les règles de récurrence **RFC 5545** (RRULE) via la librairie `rrule`.

### Formats supportés

| Règle | Exemple |
|-------|---------|
| FREQ | DAILY, WEEKLY, MONTHLY, YEARLY |
| INTERVAL | Tous les 2 jours : `FREQ=DAILY;INTERVAL=2` |
| COUNT | 10 occurrences : `FREQ=WEEKLY;COUNT=10` |
| UNTIL | Jusqu'au 30 juin : `FREQ=DAILY;UNTIL=20240630` |
| BYDAY | Lun/Mer/Ven : `FREQ=WEEKLY;BYDAY=MO,WE,FR` |
| BYMONTHDAY | Le 15 du mois : `FREQ=MONTHLY;BYMONTHDAY=15` |

### Expansion

La fonction `expandRecurringEvents(events, rangeStart, rangeEnd)` dans `src/lib/calendar/recurrence.ts` :
1. Filtre les events récurrents (ceux avec `rrule` et sans `parentEventId`)
2. Parse le RRULE et génère les occurrences dans la plage
3. Crée des instances virtuelles avec IDs uniques (`originalId_timestamp`)
4. Préserve les propriétés de l'event parent (titre, description, durée)
5. Retourne un tableau trié par date de début

---

## Synchronisation

### Providers supportés

| Provider | Login | Calendar Sync | API |
|----------|-------|--------------|-----|
| Google | OAuth 2.0 | Bi-directionnelle | Google Calendar API |
| Microsoft | OAuth 2.0 | Bi-directionnelle | Microsoft Graph API |
| Local | - | - | - |

### Flux de sync

1. **Cron Job** (toutes les 5 min) : `/api/cron/sync`
2. **Pull** : Récupérer les events externes (30j passé → 90j futur)
3. **Push** : Pousser les events `PENDING_PUSH` vers le provider
4. **Conflits** : Détectés automatiquement, résolvables dans l'UI

### Résolution de conflits

| Type | Description | Résolutions |
|------|-------------|-------------|
| UPDATE_CONFLICT | Modifié localement ET à distance | USE_LOCAL, USE_REMOTE, MERGE |
| DELETE_CONFLICT | Supprimé à distance, modifié localement | USE_LOCAL, USE_REMOTE, SKIP |
| CREATE_CONFLICT | Créé aux deux endroits | MERGE, SKIP |

### Sécurité des tokens

Les tokens OAuth sont chiffrés en base de données avec **AES-256-GCM** (`src/lib/crypto.ts`).
Format : `enc:v1:<iv>:<authTag>:<ciphertext>` (tout en base64).

---

## Issues ouvertes liées

| # | Titre | Priorité |
|---|-------|----------|
| #88 | AI Adaptive Rescheduling | P0 |
| #84 | Remplacer données mockées par données réelles | P1 |
