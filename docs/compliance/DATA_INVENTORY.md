# Inventaire des données personnelles — DPM Calendar

> **Obligation :** Loi 25 du Québec + PIPEDA — Inventaire des renseignements personnels collectés, fins d'utilisation, base légale, durée de conservation, et partage.

---

## Données collectées

| Donnée | Modèle Prisma | Fin / Usage | Base légale | Conservation | Partagé avec |
|--------|--------------|-------------|-------------|--------------|-------------|
| Email | User.email | Identification, communication | Consentement + Contrat | Durée du compte + 30j après suppression | Supabase (stockage) |
| Nom | User.name | Affichage, personnalisation | Consentement | Durée du compte | Supabase |
| Photo de profil | User.image | Affichage | Consentement | Durée du compte | Supabase |
| Fuseau horaire | User.timezone | Calculs horaires | Contrat (fonctionnement du service) | Durée du compte | Supabase |
| Chronotype | User.chronotype | Suggestions de planification | Consentement | Durée du compte | Supabase |
| Événements calendrier | Event.* | Fonctionnement du calendrier | Contrat | Durée du compte | Supabase, Google (si sync), Microsoft (si sync) |
| Tâches | Task.* | Gestion des tâches | Contrat | Durée du compte | Supabase |
| Habitudes | Habit.*, HabitLog.* | Suivi d'habitudes, streaks | Consentement | Durée du compte | Supabase |
| Objectifs | Goal.*, GoalProgress.* | Suivi de progression | Consentement | Durée du compte | Supabase |
| Entrées journal | JournalEntry.* | Bien-être, réflexion | Consentement | Durée du compte | Supabase |
| Niveaux d'énergie | EnergyLog.* | Analytics bien-être | Consentement | Durée du compte | Supabase |
| Tokens OAuth | CalendarAccount.accessToken, .refreshToken | Synchronisation calendriers externes | Consentement | Durée de la connexion, supprimés à la déconnexion | Supabase (chiffré AES-256-GCM) |
| Sessions | Session.* | Authentification | Contrat | Expiration automatique | Supabase |
| Préférences | UserPreferences.* | Personnalisation UI | Contrat | Durée du compte | Supabase |
| Notifications | Notification.* | Rappels, alertes | Consentement | 90 jours | Supabase |
| Statistiques quotidiennes | DailyStats.* | Analytics productivité | Consentement | Durée du compte | Supabase |
| Sessions focus | FocusSession.* | Suivi Pomodoro | Consentement | Durée du compte | Supabase |
| Règles d'automatisation | Rule.*, RuleExecution.* | Automatisation personnalisée | Consentement | Durée du compte | Supabase |
| Suggestions | Suggestion.* | Recommandations IA | Consentement | 30 jours après dismissal | Supabase |
| Commentaires événements | EventComment.* | Collaboration | Consentement | Durée de l'événement | Supabase |
| Sondages réunion | MeetingPoll.*, MeetingPollResponse.* | Planification collaborative | Consentement | 90 jours après clôture | Supabase |
| Liens de partage | ShareLink.* | Partage de calendrier | Consentement | Jusqu'à révocation | Supabase |
| Expériences N-of-1 | Experiment.* | Auto-expérimentation | Consentement | Durée du compte | Supabase |
| Adresse IP | Logs serveur | Sécurité, rate limiting | Intérêt légitime | 30 jours | Vercel (logs) |
| User-Agent | Logs serveur | Débogage, compatibilité | Intérêt légitime | 30 jours | Vercel (logs) |

## Sous-traitants

| Fournisseur | Données traitées | Localisation | Mesures de protection |
|-------------|-----------------|--------------|----------------------|
| Supabase | Toutes les données applicatives | Configurable (US par défaut) | Chiffrement at rest, TLS, SOC 2 |
| Vercel | Logs serveur, assets statiques | Global (Edge) | TLS, SOC 2, RGPD DPA disponible |
| Google | Événements calendrier (si sync activée) | US/Global | OAuth 2.0, API scopes limités |
| Microsoft | Événements calendrier (si sync activée) | US/Global | OAuth 2.0, API scopes limités |

## Flux de données

```
Utilisateur → [TLS 1.3] → Vercel Edge → [TLS] → Supabase PostgreSQL
                                                    ↕ (si sync activée)
                                              Google Calendar API
                                              Microsoft Graph API
```

---

**Dernière révision :** 2026-04-05
**Prochaine révision :** 2026-07-05 (trimestrielle)
