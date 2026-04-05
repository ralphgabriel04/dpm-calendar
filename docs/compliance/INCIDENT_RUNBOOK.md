# Runbook — Gestion d'un incident de confidentialité

> **Objectif** : fournir une procédure étape par étape pour répondre à un incident de confidentialité conformément à la Loi 25 (Québec) et au RGPD.
> **Déclencheur** : suspicion ou confirmation qu'un renseignement personnel a été consulté, utilisé, communiqué, perdu, ou qu'il y a eu accès non autorisé.
> **Horloge** : le délai de 72h pour notifier le CAI commence à la **prise de conscience** de l'incident, pas à la détection technique.

## Étape 1 — Containment immédiat (0-2h)

1. **Identifier le vecteur** : quelle composante a failli ? (DB, API tRPC, token OAuth, sync worker, session, etc.)
2. **Isoler** :
   - Révoquer les sessions actives si compromission de session suspectée : `DELETE FROM "Session" WHERE "userId" IN (...)`.
   - Révoquer les tokens OAuth : forcer reconnexion Google/Microsoft pour les users touchés.
   - Si fuite côté code : rollback Vercel immédiat vers le dernier déploiement sain.
3. **Préserver les preuves** : snapshot DB, logs Vercel (derniers 7 jours exportés), logs Supabase, git log.
4. **Créer un canal dédié** : branche Git `incident/YYYY-MM-DD-<slug>`, répertoire `docs/incidents/YYYY-MM-DD-<slug>/` pour centraliser les artefacts.

## Étape 2 — Évaluation du risque de préjudice sérieux (2-24h)

Appliquer les 3 critères Loi 25 art. 3.7 (voir `INCIDENT_REGISTER.md`) :

- Sensibilité des RP
- Conséquences appréhendées
- Probabilité d'utilisation malveillante

**Décision** :
- Risque sérieux confirmé → **passer à l'étape 3** (notifications obligatoires).
- Risque sérieux écarté → passer directement à l'étape 5 (enregistrement uniquement).

Documenter la décision et le raisonnement dans l'artefact d'incident.

## Étape 3 — Notification au CAI (dans les 72h si risque sérieux)

**Canal** : formulaire en ligne sur le site de la Commission d'accès à l'information du Québec (<https://www.cai.gouv.qc.ca>).

**Contenu obligatoire** :
- Description de l'incident
- Date ou période de l'incident
- Nature des RP concernés
- Nombre de personnes touchées (ou estimation)
- Mesures prises ou envisagées pour diminuer les risques
- Coordonnées du responsable de la protection des RP

Conserver l'accusé de réception CAI dans le dossier d'incident.

## Étape 4 — Notification aux personnes touchées (dans le même délai)

**Canal** : email direct aux adresses des comptes touchés.

**Contenu obligatoire** :
- Description de l'incident (en termes accessibles)
- Nature des RP touchés
- Mesures prises
- Mesures que la personne peut prendre pour se protéger (changement de mot de passe, surveillance de compte, etc.)
- Coordonnées pour obtenir plus d'info

**Template** : voir `docs/compliance/templates/notification-email.md` (à créer lors du premier incident).

## Étape 5 — Enregistrement au registre + clôture

1. Ajouter une ligne dans `docs/compliance/INCIDENT_REGISTER.md` avec les 10 champs requis.
2. Rédiger un post-mortem dans `docs/incidents/YYYY-MM-DD-<slug>/POSTMORTEM.md` :
   - Timeline détaillée
   - Cause racine
   - Actions correctives (court, moyen, long terme)
   - Leçons apprises
3. **Conserver le dossier complet au minimum 5 ans** après clôture.
4. Créer les tickets GitHub pour les actions correctives long terme.

## Contacts

- **Responsable de la protection des RP** : Ralph Christian Gabriel
- **CAI (Québec)** : <https://www.cai.gouv.qc.ca> / 1-888-528-7741
- **Supabase support** (si incident côté DB managée) : via dashboard
- **Vercel support** (si incident côté hébergement) : via dashboard

## Références

- Loi 25 : articles 3.5 à 3.8 (obligations en cas d'incident de confidentialité)
- RGPD : articles 33 et 34 (notification aux autorités et aux personnes concernées)
- CAI — Guide sur les incidents de confidentialité : <https://www.cai.gouv.qc.ca>
