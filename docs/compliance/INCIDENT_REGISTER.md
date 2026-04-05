# Registre des incidents de confidentialité

> **Conformité** : Loi 25 (Québec) article 3.5, RGPD article 33-34
> **Conservation** : Les entrées de ce registre doivent être conservées **au minimum 5 ans** à compter de la date de clôture de l'incident.
> **Responsable** : Ralph Christian Gabriel (responsable de la protection des renseignements personnels)

## Obligations légales

- **Loi 25** : obligation de tenir un registre de tous les incidents de confidentialité, peu importe le niveau de risque.
- **CAI** : notification obligatoire à la Commission d'accès à l'information du Québec si l'incident présente un **risque de préjudice sérieux** pour les personnes concernées.
- **Personnes touchées** : notification individuelle obligatoire dans le même cas.
- **Délai** : notification « avec diligence » (interprété comme 72h par la doctrine, à l'image du RGPD).

## Format d'entrée

Chaque incident doit comporter les 10 champs suivants. Ajouter les nouvelles entrées en bas du tableau, jamais écraser une ligne existante.

| # | Date détection (ISO) | Description | Nature des RP concernés | Circonstances | Nb personnes touchées | Évaluation risque préjudice sérieux | Mesures de mitigation | Notification CAI (oui/non + date) | Notification personnes (oui/non + date) |
|---|---|---|---|---|---|---|---|---|---|
| _(vide)_ | | | | | | | | | |

## Critères d'évaluation du risque de préjudice sérieux (Loi 25 art. 3.7)

Prendre en considération :

1. **Sensibilité des renseignements** : données financières, de santé, d'identification (SIN, permis), authentification (mots de passe, tokens).
2. **Conséquences appréhendées** : vol d'identité, fraude, atteinte à la réputation, discrimination, perte financière.
3. **Probabilité d'utilisation malveillante** : les renseignements ont-ils été exfiltrés ? Publiés ? Chiffrés ? Récupérables ?

Si **au moins un** de ces critères indique un risque sérieux → notification CAI + personnes touchées obligatoire.

## Champs détaillés

### Description
Résumé factuel en 2-4 phrases : quoi, quand, comment découvert.

### Nature des RP concernés
Catégories précises : email, nom, tokens OAuth chiffrés, événements de calendrier, habitudes, journaux personnels, etc.

### Circonstances
Vecteur d'attaque suspecté : fuite accidentelle, accès non autorisé, perte de dispositif, vulnérabilité exploitée, erreur de configuration, etc.

### Mesures de mitigation
- Actions immédiates (containment)
- Correctifs techniques déployés
- Changements de procédure
- Notifications effectuées
