# Procédure de réponse aux incidents de confidentialité

> **Loi 25 du Québec** — Ce runbook décrit la procédure à suivre en cas d'incident de confidentialité impliquant des renseignements personnels.

---

## Étape 1 — Détection et confinement (0-2 heures)

- [ ] Identifier la nature de l'incident (accès non autorisé, fuite, perte, erreur humaine)
- [ ] Confiner l'incident immédiatement :
  - Révoquer les accès compromis
  - Désactiver les comptes affectés si nécessaire
  - Isoler les systèmes touchés
- [ ] Documenter l'heure de découverte et les premières observations
- [ ] Préserver les preuves (logs, captures, communications)

## Étape 2 — Évaluation (2-24 heures)

- [ ] Déterminer les renseignements personnels touchés
- [ ] Estimer le nombre de personnes affectées
- [ ] Identifier la cause (technique, humaine, tiers)
- [ ] **Évaluer le risque de préjudice sérieux** selon les 3 critères de la Loi 25 :
  1. Sensibilité des renseignements
  2. Conséquences anticipées de l'utilisation
  3. Probabilité d'utilisation malveillante
- [ ] Consigner l'évaluation dans le registre (docs/compliance/INCIDENT_REGISTER.md)

## Étape 3 — Notification (si risque de préjudice sérieux)

### 3a. Notification à la CAI
- [ ] Remplir le formulaire de déclaration : https://www.cai.gouv.qc.ca/
- [ ] Inclure : description, renseignements concernés, nombre de personnes, mesures prises
- [ ] Envoyer dans les meilleurs délais

### 3b. Notification aux personnes touchées
- [ ] Rédiger l'avis de notification (template ci-dessous)
- [ ] Envoyer par email à chaque personne touchée
- [ ] Documenter la date et la méthode d'envoi

### Template de notification

```
Objet : Avis d'incident de confidentialité — DPM Calendar

Bonjour [Nom],

Nous vous informons qu'un incident de confidentialité a été détecté le [DATE] 
concernant vos renseignements personnels suivants : [TYPES DE DONNÉES].

[DESCRIPTION DE L'INCIDENT]

Mesures prises :
- [MESURE 1]
- [MESURE 2]

Nous vous recommandons de :
- Modifier votre mot de passe si applicable
- Surveiller toute activité suspecte sur vos comptes

Pour toute question : privacy@dpmcalendar.com

Responsable de la protection des renseignements personnels :
Ralph Christian Gabriel
privacy@dpmcalendar.com
```

## Étape 4 — Résolution et clôture

- [ ] Implémenter les correctifs techniques
- [ ] Tester que la vulnérabilité est corrigée
- [ ] Mettre à jour le registre d'incidents avec le statut FERMÉ
- [ ] Documenter les leçons apprises
- [ ] Planifier les améliorations préventives

## Étape 5 — Revue post-incident (7-14 jours après)

- [ ] Revue post-mortem : qu'est-ce qui a fonctionné, qu'est-ce qui n'a pas fonctionné
- [ ] Mise à jour des procédures si nécessaire
- [ ] Communication interne des leçons apprises

---

## Contacts d'urgence

| Rôle | Contact |
|------|--------|
| Responsable vie privée | Ralph Christian Gabriel — privacy@dpmcalendar.com |
| CAI (Commission d'accès à l'information) | https://www.cai.gouv.qc.ca/ |
| Supabase support | https://supabase.com/support |
| Vercel support | https://vercel.com/support |

---

**Dernière révision :** 2026-04-05
