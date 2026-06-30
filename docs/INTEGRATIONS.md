# Guide des intégrations (Centre de synchronisation)

Ce guide explique comment configurer chaque source que l'on peut connecter
depuis la page **Centre de synchronisation** (`/integrations`).

## État actuel des fournisseurs

| Fournisseur | Type | État |
|-------------|------|------|
| ICS (fichier + URL) | Pas d'OAuth | **Fonctionnel** |
| CalDAV (Apple Calendar) | Identifiants utilisateur | Configuration requise (flux OAuth/CalDAV à finaliser) |
| Notion | OAuth | Flux OAuth implémenté ; définir `NOTION_CLIENT_ID`/`SECRET` + enregistrer l'URL de callback pour activer |
| Todoist | OAuth | Configuration requise (échafaudage du flux OAuth à finaliser) |
| TickTick | OAuth | Flux OAuth implémenté ; définir `TICKTICK_CLIENT_ID`/`SECRET` + enregistrer l'URL de callback pour activer |

> Honnêteté technique : seul **ICS** importe réellement des événements
> aujourd'hui. Les fournisseurs OAuth (Notion, Todoist, TickTick) et CalDAV
> affichent « Configuration requise » et n'effectuent pas encore de
> synchronisation tant que le flux d'authentification correspondant n'est pas
> branché côté serveur.

Dans tout ce document, remplacez `YOUR_DOMAIN` par votre domaine de production
(p. ex. `app.exemple.com`) ou `localhost:3000` en développement.

---

## ICS — fichier et abonnement par URL

**Aucune configuration requise.** Aucune variable d'environnement, aucune
inscription d'application.

Deux façons d'importer :

1. **Importer un fichier `.ics`** — exportez un calendrier depuis n'importe
   quelle application (Google Agenda, Outlook, Apple Calendar…) au format
   iCalendar, puis téléversez-le. Le fichier est lu côté client et son contenu
   est envoyé à `integration.importIcsText`.
2. **S'abonner à une URL `.ics`** — collez l'URL publique d'un calendrier
   (lien « secret » iCal). L'application crée un abonnement
   (`integration.connectIcsUrl`) puis lance une synchronisation immédiate.
   Vous pouvez resynchroniser à tout moment avec « Synchroniser ».

---

## CalDAV — Apple Calendar (iCloud)

**État : configuration requise (flux CalDAV à finaliser).**

CalDAV n'utilise pas d'OAuth : l'utilisateur fournit ses propres identifiants.

- **Identifiant** : votre identifiant Apple (adresse e-mail iCloud).
- **Mot de passe** : un **mot de passe pour application** dédié — n'utilisez
  jamais votre mot de passe Apple principal.
  Générez-le depuis votre compte Apple :
  <https://support.apple.com/en-us/102654>
- Aucune variable d'environnement n'est requise : ces identifiants sont saisis
  par l'utilisateur et stockés chiffrés.

---

## Notion (OAuth)

**État : flux OAuth implémenté ; définissez `NOTION_CLIENT_ID` /
`NOTION_CLIENT_SECRET` et enregistrez l'URL de callback ci-dessous pour
activer.** Tant que ces deux variables sont absentes, la route d'autorisation
renvoie une réponse « non configuré » claire (jamais un faux succès).

1. Créez une intégration publique (OAuth) sur
   <https://www.notion.so/my-integrations>.
2. **URL de redirection (callback)** à déclarer (exacte) :
   `${AUTH_URL}/api/integrations/oauth/notion/callback`
3. **Scopes / capacités** : Notion n'utilise pas de scopes OAuth ; le flux passe
   `owner=user` + `response_type=code`. Les capacités (lecture du contenu) se
   configurent côté intégration Notion.
4. **Variables d'environnement** à définir :
   - `NOTION_CLIENT_ID`
   - `NOTION_CLIENT_SECRET`

---

## Todoist (OAuth)

**État : configuration requise (échafaudage du flux OAuth à finaliser).**

1. Créez une application sur
   <https://developer.todoist.com/appconsole.html>.
2. **URL de redirection (callback)** à déclarer :
   `https://YOUR_DOMAIN/api/auth/todoist/callback`
3. **Scopes** : `data:read` (lecture des tâches et projets).
4. **Variables d'environnement** à définir :
   - `TODOIST_CLIENT_ID`
   - `TODOIST_CLIENT_SECRET`

---

## TickTick (OAuth)

**État : flux OAuth implémenté ; définissez `TICKTICK_CLIENT_ID` /
`TICKTICK_CLIENT_SECRET` et enregistrez l'URL de callback ci-dessous pour
activer.** Tant que ces deux variables sont absentes, la route d'autorisation
renvoie une réponse « non configuré » claire (jamais un faux succès).

1. Créez une application sur
   <https://developer.ticktick.com/manage>.
2. **URL de redirection (callback)** à déclarer (exacte) :
   `${AUTH_URL}/api/integrations/oauth/ticktick/callback`
3. **Scopes** : `tasks:read tasks:write`.
4. **Variables d'environnement** à définir :
   - `TICKTICK_CLIENT_ID`
   - `TICKTICK_CLIENT_SECRET`

---

## Résumé des variables d'environnement

Voir aussi `.env.example`.

```env
# ICS et CalDAV : aucune variable (identifiants saisis par l'utilisateur)

NOTION_CLIENT_ID=""
NOTION_CLIENT_SECRET=""

TODOIST_CLIENT_ID=""
TODOIST_CLIENT_SECRET=""

TICKTICK_CLIENT_ID=""
TICKTICK_CLIENT_SECRET=""
```

Tant que les deux variables d'un fournisseur OAuth ne sont pas renseignées,
celui-ci apparaît comme « Configuration requise » dans le Centre de
synchronisation.
