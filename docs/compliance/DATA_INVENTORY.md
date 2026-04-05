# Data Inventory — Loi 25 Compliance

Inventaire des données personnelles collectées par DPM Calendar conformément à la **Loi 25** (Loi sur la protection des renseignements personnels dans le secteur privé du Québec).

> **Responsable de la protection des renseignements personnels**: À désigner
>
> **Dernière mise à jour**: 2024-04-05

---

## Table des matières

1. [Aperçu](#aperçu)
2. [Catégories de données](#catégories-de-données)
3. [Inventaire détaillé](#inventaire-détaillé)
4. [Flux de données](#flux-de-données)
5. [Conservation des données](#conservation-des-données)
6. [Partage avec des tiers](#partage-avec-des-tiers)
7. [Droits des utilisateurs](#droits-des-utilisateurs)
8. [Mesures de sécurité](#mesures-de-sécurité)

---

## Aperçu

### Finalités de la collecte

| Finalité | Description |
|----------|-------------|
| **Authentification** | Connexion sécurisée via OAuth (Google, GitHub, OIDC) |
| **Gestion du calendrier** | Création, modification, synchronisation d'événements |
| **Gestion des tâches** | Suivi des tâches, sous-tâches, blocs de temps |
| **Habitudes & Bien-être** | Suivi des habitudes, journal, niveaux d'énergie |
| **Intelligence** | Suggestions IA, règles d'automatisation |
| **Analyse** | Statistiques d'utilisation, récapitulatifs |
| **Notifications** | Rappels, alertes push |

### Base légale

- **Consentement explicite** : Obtenu lors de l'inscription
- **Exécution du contrat** : Nécessaire pour fournir le service
- **Intérêt légitime** : Amélioration du service (avec opt-out)

---

## Catégories de données

### 1. Données d'identification

| Donnée | Type | Sensibilité | Source |
|--------|------|-------------|--------|
| Nom | Chaîne | Faible | OAuth / Saisie utilisateur |
| Email | Chaîne | Moyenne | OAuth |
| Photo de profil | URL | Faible | OAuth |
| Identifiant utilisateur | CUID | Faible | Généré |

### 2. Données d'authentification

| Donnée | Type | Sensibilité | Chiffré |
|--------|------|-------------|---------|
| Token d'accès OAuth | JWT | Élevée | ✅ AES-256-GCM |
| Token de rafraîchissement | JWT | Élevée | ✅ AES-256-GCM |
| Token de session | Chaîne | Moyenne | Non (HttpOnly cookie) |
| Token de vérification | Chaîne | Moyenne | Non (éphémère) |

### 3. Données de comportement

| Donnée | Type | Sensibilité | Finalité |
|--------|------|-------------|----------|
| Chronotype | Enum | Moyenne | Planification optimale |
| Niveaux d'énergie | Int (1-5) | Moyenne | Bien-être |
| Humeur | Int (1-5) | Moyenne | Bien-être |
| Stress | Int (1-5) | Moyenne | Bien-être |
| Sessions de focus | Durée/Timestamp | Faible | Productivité |

### 4. Données de contenu

| Donnée | Type | Sensibilité | Chiffré |
|--------|------|-------------|---------|
| Événements | JSON | Moyenne | Non |
| Tâches | JSON | Moyenne | Non |
| Journal | Texte libre | Élevée | Non* |
| Habitudes | JSON | Faible | Non |
| Objectifs | JSON | Faible | Non |

*Note: Le chiffrement du journal est prévu pour v1.0.0

---

## Inventaire détaillé

### Modèle `User`

```
Table: User
Responsable: Système
Durée de conservation: Durée du compte + 30 jours
```

| Champ | Type | PII | Obligatoire | Notes |
|-------|------|-----|-------------|-------|
| id | cuid | Non | Oui | Identifiant technique |
| name | string | Oui | Non | Nom d'affichage |
| email | string | Oui | Oui | Identifiant unique |
| emailVerified | datetime | Non | Non | Date de vérification |
| image | url | Non | Non | URL externe (OAuth) |
| timezone | string | Non | Oui | Fuseau horaire |
| chronotype | enum | Oui | Oui | LARK/OWL/THIRD_BIRD/UNKNOWN |
| dailyPriorityCap | int | Non | Oui | Préférence utilisateur |
| dailyFocusGoalMins | int | Non | Oui | Objectif focus quotidien |
| createdAt | datetime | Non | Oui | Date création |
| updatedAt | datetime | Non | Oui | Dernière modification |

### Modèle `Account` (OAuth)

```
Table: Account
Responsable: NextAuth.js
Durée de conservation: Durée du compte
Chiffrement: AES-256-GCM pour tokens
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| provider | string | Non | Faible | google, github, oidc |
| providerAccountId | string | Oui | Moyenne | ID chez le fournisseur |
| access_token | text | Oui | Élevée | Chiffré au repos |
| refresh_token | text | Oui | Élevée | Chiffré au repos |
| expires_at | int | Non | Faible | Timestamp expiration |
| id_token | text | Oui | Élevée | Token OIDC |

### Modèle `Event`

```
Table: Event
Responsable: Utilisateur
Durée de conservation: Durée du compte
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| title | string | Potentiel | Moyenne | Peut contenir des noms |
| description | text | Potentiel | Moyenne | Contenu libre |
| location | string | Potentiel | Moyenne | Adresses possibles |
| startAt/endAt | datetime | Non | Faible | Horaires |
| attendees | relation | Oui | Moyenne | Emails des participants |

### Modèle `Task`

```
Table: Task
Responsable: Utilisateur
Durée de conservation: Durée du compte
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| title | string | Potentiel | Faible | Titre de tâche |
| description | text | Potentiel | Moyenne | Contenu libre |
| notes | text | Potentiel | Moyenne | Notes personnelles |
| url | string | Non | Faible | Liens externes |
| tags | array | Non | Faible | Catégorisation |

### Modèle `JournalEntry`

```
Table: JournalEntry
Responsable: Utilisateur
Durée de conservation: Durée du compte
Sensibilité: ÉLEVÉE
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| content | text | Oui | Élevée | Réflexions personnelles |
| mood | int | Oui | Moyenne | État émotionnel |
| tags | array | Potentiel | Moyenne | mcii, gratitude, etc. |

### Modèle `EnergyLog`

```
Table: EnergyLog
Responsable: Utilisateur
Durée de conservation: 2 ans
Sensibilité: Moyenne (données de santé)
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| energyLevel | int | Oui | Moyenne | 1-5, indicateur de santé |
| mood | int | Oui | Moyenne | État émotionnel |
| stress | int | Oui | Moyenne | Niveau de stress |
| focus | int | Oui | Moyenne | Capacité de concentration |
| notes | string | Potentiel | Moyenne | Contexte libre |

### Modèle `Habit` & `HabitLog`

```
Table: Habit, HabitLog
Responsable: Utilisateur
Durée de conservation: Durée du compte
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| name | string | Non | Faible | Nom de l'habitude |
| completed | boolean | Non | Faible | Statut journalier |
| mood | int | Oui | Moyenne | Humeur lors de completion |

### Modèle `PushSubscription`

```
Table: PushSubscription
Responsable: Système
Durée de conservation: Jusqu'à désinscription
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| endpoint | text | Oui | Moyenne | URL du service push |
| p256dh | string | Non | Moyenne | Clé publique ECDH |
| auth | string | Non | Élevée | Secret d'authentification |

### Modèle `Experiment`

```
Table: Experiment
Responsable: Utilisateur
Durée de conservation: Durée du compte
```

| Champ | Type | PII | Sensibilité | Notes |
|-------|------|-----|-------------|-------|
| hypothesis | text | Potentiel | Moyenne | Hypothèse personnelle |
| metric | string | Non | Faible | Métrique mesurée |
| notes | text | Potentiel | Moyenne | Observations |

---

## Flux de données

### Authentification OAuth

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Utilisateur │────▶│  DPM Calendar │────▶│ Google/GitHub│
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Supabase   │
                    │  (PostgreSQL)│
                    └──────────────┘
```

**Données transmises**:
- Email, nom, photo de profil (lecture seule)
- Tokens OAuth (stockage chiffré)

### Synchronisation Google Calendar

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Utilisateur │────▶│  DPM Calendar │◀───▶│ Google Cal  │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Données échangées**:
- Événements (titre, description, horaires, participants)
- Calendriers (noms, couleurs)
- Token de synchronisation

### Notifications Push

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Navigateur │◀────│  DPM Calendar │────▶│ Push Service│
└─────────────┘     └──────────────┘     │  (FCM/APNS) │
                                         └─────────────┘
```

**Données transmises**:
- Endpoint de notification
- Titre et corps du message (pas de PII)

---

## Conservation des données

### Politique de rétention

| Catégorie | Durée | Justification |
|-----------|-------|---------------|
| Données de compte | Durée du compte + 30 jours | Suppression sur demande |
| Tokens OAuth | Durée du compte | Requis pour sync |
| Événements | Durée du compte | Service principal |
| Journal | Durée du compte | Contenu utilisateur |
| Logs d'énergie | 2 ans | Analyse tendances |
| Sessions | 30 jours | Sécurité |
| Logs système | 90 jours | Débogage |

### Suppression automatique

- **Sessions expirées**: Supprimées après 30 jours
- **Tokens de vérification**: Supprimés après 24h
- **Notifications lues**: Archivées après 30 jours

### Suppression sur demande

L'utilisateur peut demander la suppression complète de ses données via:
1. Paramètres > Supprimer mon compte
2. Email à privacy@dpmcalendar.com

Délai de traitement: **72 heures maximum**

---

## Partage avec des tiers

### Sous-traitants

| Fournisseur | Localisation | Données | Finalité |
|-------------|--------------|---------|----------|
| **Supabase** | USA (AWS) | Toutes les données | Hébergement BDD |
| **Vercel** | USA | Logs d'accès | Hébergement app |
| **Google** | USA | Calendriers | Synchronisation |
| **GitHub** | USA | Email, nom | Authentification |

### Garanties

- Tous les fournisseurs sont certifiés SOC 2
- Contrats de traitement de données (DPA) en place
- Transferts UE-USA couverts par les SCC

### Données non partagées

- ❌ Contenu du journal
- ❌ Données d'énergie/humeur
- ❌ Habitudes personnelles
- ❌ Données de focus

---

## Droits des utilisateurs

### Droits Loi 25

| Droit | Implémentation | Délai |
|-------|----------------|-------|
| **Accès** | Export JSON dans Paramètres | Immédiat |
| **Rectification** | Modification dans l'interface | Immédiat |
| **Suppression** | Paramètres > Supprimer compte | 72h |
| **Portabilité** | Export JSON/ICS | Immédiat |
| **Opposition** | Désactivation par fonctionnalité | Immédiat |
| **Retrait consentement** | Paramètres de notifications | Immédiat |

### Exercice des droits

1. **En ligne**: Paramètres > Confidentialité
2. **Par email**: privacy@dpmcalendar.com
3. **Formulaire**: [Lien vers formulaire]

### Réclamations

Commission d'accès à l'information du Québec (CAI):
- Site: https://www.cai.gouv.qc.ca
- Téléphone: 1-888-528-7741

---

## Mesures de sécurité

### Chiffrement

| Couche | Méthode |
|--------|---------|
| Transit | TLS 1.3 |
| Repos (BDD) | AES-256 (Supabase) |
| Tokens OAuth | AES-256-GCM (application) |
| Mots de passe | N/A (OAuth uniquement) |

### Contrôle d'accès

- Authentification multi-facteurs disponible (via OAuth provider)
- Sessions avec expiration automatique (30 jours)
- Row Level Security (RLS) dans PostgreSQL
- Validation Zod sur toutes les entrées API

### Audit

- Logs d'accès conservés 90 jours
- Alertes sur activités suspectes
- Revue trimestrielle des accès

### Plan de réponse aux incidents

1. **Détection**: Monitoring continu (Vercel, Supabase)
2. **Confinement**: Révocation des tokens compromis
3. **Notification**: Utilisateurs informés sous 72h
4. **Correction**: Patch et analyse post-mortem

---

## Annexes

### A. Cartographie des modèles Prisma

```
User
├── Account (OAuth tokens)
├── Session (auth sessions)
├── Calendar
│   └── Event
│       ├── Attendee
│       └── EventComment
├── Task
│   ├── ChecklistItem
│   ├── TimeBlock
│   └── FocusSession
├── Habit
│   ├── HabitLog
│   └── HabitBlock
├── Goal
│   └── GoalProgress
├── Rule
│   └── RuleExecution
├── JournalEntry
├── EnergyLog
├── Notification
├── PushSubscription
├── NotificationPreference
├── UserPreferences
├── Experiment
└── DailyStats
```

### B. Historique des modifications

| Date | Version | Modifications |
|------|---------|---------------|
| 2024-04-05 | 1.0 | Création initiale |

---

## Documents connexes

- [Politique de confidentialité](../../legal/privacy-policy.md)
- [Conditions d'utilisation](../../legal/terms-of-service.md)
- [Politique de sécurité](../../SECURITY.md)
- [Guide de contribution](../../CONTRIBUTING.md)
