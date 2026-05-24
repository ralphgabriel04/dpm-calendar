# FIX LOG — DPM Calendar Bug Fixes

**Date** : 2026-05-24  
**Branche** : `wave-3-p2-batch`

---

## Tableau de suivi

| ID Bug | Sévérité | Cause racine | Fichiers modifiés | Vérif faite | Statut |
|--------|----------|--------------|-------------------|-------------|--------|
| B1 | P0 | `auth()` overload résolvant vers `NextMiddleware` au lieu de `Session \| null` ; `req`/`resHeaders` optionnels ne matchent pas le context requis | `src/infrastructure/trpc/context.ts` | tsc --noEmit = 0 err | DONE |
| B2 | P1 | `handleSaveMoodNote` était un no-op (`// TODO`) | `src/app/(dashboard)/home/HomeClient.tsx` | tsc = 0 err | DONE |
| B3 | P1 | Aucun `.eslintrc.*` à la racine | `.eslintrc.json` (créé) | `next lint` = 0 err | DONE |
| B6 | P1 | Mocks test incomplets (`updateMany`, `aggregate`, `checklistItem`) | `tests/helpers/trpc-test-utils.ts`, `tests/routers/event.test.ts` | tsc = 0 err | DONE |
| B4 | P2 | Logo fixe sans switch dark/light dans 4 fichiers | `Navigation.tsx`, `FooterSection.tsx`, `login/page.tsx`, `OnboardingFlow.tsx` | tsc = 0 err | DONE |
| B12 | P2 | `getViewRange` en dépendance useMemo causait invalidation à chaque render | `src/app/(dashboard)/calendar/page.tsx` | tsc = 0 err | DONE |
| B13 | P2 | Timer 1s pour affichage HH:mm (sans secondes) | `src/app/(dashboard)/home/HomeClient.tsx` | tsc = 0 err | DONE |
| B10 | P3 | `!hover:bg-transparent` syntaxe Tailwind invalide | `src/shared/components/layout/ResizableHandle.tsx` | tsc = 0 err | DONE |
| B11 | P3 | "Taches" au lieu de "Tâches" | `src/shared/components/layout/MobileNav.tsx` | tsc = 0 err | DONE |

---

## Bugs NON traités (hors scope)

| ID | Raison |
|----|--------|
| F1/F5 | [CONFIG EXTERNE → Ralph] — Apple OAuth, redirect URIs |
| B5 | 70+ chaînes FR hardcodées — trop large pour cette session, nécessite un ticket dédié |
| B8 | Login page FR hardcodé — sous-ensemble de B5 |
| B9 | Fichiers logo morts — marqué 🔴 MORT, passe de cleanup dédiée |

---

## Auto-critique

| Critère | Score | Pour atteindre 9/10 |
|---------|-------|---------------------|
| Fonctionnalité | 8/10 | Manque la migration i18n complète (B5) |
| Performance | 8/10 | B13 fixé (60s), B12 fixé. Audit plus profond N+1 en phase 2 |
| Sécurité | 9/10 | Auth guard solide, rate limiting, CSP. Manque : Apple OAuth non testable |
| Accessibilité | 7/10 | Logo dark mode fixé. Manque : audit WCAG complet des contrastes |
| Maintenabilité | 8/10 | ESLint configuré, tests compilent. Manque : couverture tests + i18n systématique |
