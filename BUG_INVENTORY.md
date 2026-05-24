# BUG INVENTORY — DPM Calendar

**Date** : 2026-05-24  
**Branche** : `wave-3-p2-batch`  
**Méthode** : Analyse statique du code + vérification des fichiers publics + tsc --noEmit

---

## Bugs rapportés par le fondateur

| ID | Sévérité | Titre | Repro | Fichier:ligne | Cause racine | Catégorie | Fix proposé |
|----|----------|-------|-------|---------------|--------------|-----------|-------------|
| F1 | P1 | OAuth Apple ne fonctionne pas | REPRODUIT (statique) | `src/infrastructure/auth/config.ts:64` + `.env` | Variables `APPLE_ID` et `APPLE_SECRET` absentes du `.env` — le provider n'est jamais ajouté à la liste (`hasAppleOAuth` = false) | [CONFIG EXTERNE → Ralph] | Créer Apple Service ID + générer le secret JWT sur Apple Developer Portal, ajouter les variables à `.env` et Vercel env |
| F2 | P2 | Logo disparaît (landing page, dark mode) | REPRODUIT (statique) | `src/features/home/components/landing/Navigation.tsx:18` | Le fichier `lightLogoFinal.png` est un logo clair utilisé inconditionnellement — en dark mode il perd tout contraste. Le Sidebar fait correctement `resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png"` mais la landing ne le fait pas. | [BUG CODE] | Ajouter la logique `useTheme()` + conditionnel dark/light comme dans `Sidebar.tsx:224` |
| F3 | P2 | Grilles/layouts qui se cassent | NON REPRODUIT | — | L'architecture CSS est saine (`flex h-screen overflow-hidden`, `react-resizable-panels` v4.2.1 avec API `%` correcte, Tailwind responsive). Aucun breakage structurel identifiable en lecture statique. Possible cause : un state localStorage corrompu dans `dpm-layout-storage` avec des tailles de panel invalides. | ⚫ | Demander à Ralph les conditions exactes de repro (device, breakpoint, route concernée). Tester en supprimant `localStorage.removeItem("dpm-layout-storage")` |
| F4 | P2 | Widgets dashboard se chevauchent | NON REPRODUIT | `src/app/(dashboard)/dashboard/page.tsx:144-179` | Les grilles utilisent `grid grid-cols-1 lg:grid-cols-3 gap-4` — pattern standard sans overlap possible. Le seul cas possible serait un widget avec `position: absolute` ou `negative margin`, aucun n'est trouvé. | ⚫ | Demander à Ralph : quel viewport ? quel widget spécifiquement ? Tester avec DevTools responsive |
| F5 | P1 | Autres providers OAuth ne fonctionnent pas | PARTIEL | `src/infrastructure/auth/config.ts` + `.env` | Google, Microsoft, GitHub sont configurés dans `.env` (variables présentes). Apple et SSO ne le sont pas. Si "d'autres providers" = Apple → voir F1. Si Microsoft common tenant → peut nécessiter config Azure AD (redirect URIs). | [CONFIG EXTERNE → Ralph] | Vérifier les redirect URIs dans Google Cloud Console et Azure AD correspondent à l'URL de prod |

---

## Bugs découverts (chasse systématique)

| ID | Sévérité | Titre | Repro | Fichier:ligne | Cause racine | Catégorie | Fix proposé |
|----|----------|-------|-------|---------------|--------------|-----------|-------------|
| B1 | P0 | Erreurs TS infra — tRPC server caller mal typé | REPRODUIT (tsc) | `src/infrastructure/trpc/context.ts:43` + `src/infrastructure/trpc/server.ts:23` | `createServerContext` retourne un type `CreateContextOptions` avec `session` typé comme retour de `auth()` (`Session | null`), mais le type attendu par `createCallerFactory` est le contexte du fetch adapter qui type session différemment. | [BUG CODE] | Aligner le type `CreateContextOptions.session` sur `Awaited<ReturnType<typeof auth>>` et s'assurer que c'est le même type que dans `createTRPCContext` |
| B2 | P1 | Mood note jamais sauvegardée en DB | REPRODUIT (code) | `src/app/(dashboard)/home/HomeClient.tsx:96` | `handleSaveMoodNote` est un no-op avec commentaire `// TODO: Save to database`. L'utilisateur entre une note après le mood check mais rien n'est persisté. | [BUG CODE] | Connecter à `trpc.energy.log.useMutation()` qui accepte déjà un champ `notes` |
| B3 | P1 | ESLint non configuré — CI lint cassée | REPRODUIT | Racine du projet | Aucun fichier `.eslintrc.*` présent. Le script `next lint` demande une config interactive. Le workflow `lint.yml` échoue silencieusement. | [BUG CODE] | Ajouter `.eslintrc.json` avec `extends: ["next/core-web-vitals"]` |
| B4 | P2 | Logo landing/footer/onboarding invisible en dark mode | REPRODUIT (statique) | `Navigation.tsx:18`, `FooterSection.tsx:18`, `OnboardingFlow.tsx:255`, `login/page.tsx:44` | Ces 4 fichiers utilisent un logo fixe (`/lightLogoFinal.png` ou `/logo.png`) sans basculer en dark. | [BUG CODE] | Extraire un composant `<AppLogo />` avec `useTheme()` et l'utiliser partout |
| B5 | P2 | 70+ chaînes FR hardcodées contournant next-intl | REPRODUIT | 33 fichiers dans `src/features/` | Textes comme "Ajouter", "Supprimer", "Calendrier", "Tâches" écrits directement en JSX au lieu de passer par `useTranslations()`. L'app affiche du FR même quand la locale est EN. | [BUG CODE] | Extraire progressivement vers les fichiers `messages/{en,fr}.json`. Prioriser les composants les plus visibles. |
| B6 | P2 | Tests TS cassés — suite Vitest non exécutable en CI | REPRODUIT (tsc) | `tests/routers/task.test.ts`, `calendar.test.ts`, `event.test.ts` | Mocks incomplets : `updateMany`, `aggregate`, `checklistItem` non déclarés dans les helpers. 13 erreurs TS au total dans les tests. | [BUG CODE] | Mettre à jour `tests/helpers/trpc-test-utils.ts` pour inclure tous les modèles Prisma utilisés |
| B7 | P2 | `react-resizable-panels` — API `defaultSize` type string | NON BUG | `ResizableLayout.tsx:37-38` | Vérifié : v4.2.1 accepte bien les strings avec `%` suffix. Le code `"4%"` est valide. Pas de bug ici. | — | — |
| B8 | P3 | Login page toujours en FR | — | `src/app/login/page.tsx` | Toute la page (`Bienvenue !`, `Connectez-vous ou créez un compte`, `Continuer avec Google`, etc.) est en français hardcodé sans utiliser `useTranslations`. | [BUG CODE] | Migrer vers `useTranslations("login")` + ajouter les clés dans messages |
| B9 | P3 | Fichiers logo morts dans `/public` | — | `public/light-mode-logo.png`, `logo-full.png`, `logo-full-new.png` | Non référencés dans le code, prennent de l'espace. | [BUG CODE] | Supprimer les fichiers non utilisés |
| B10 | P3 | `!hover:bg-transparent` invalide en Tailwind | — | `src/shared/components/layout/ResizableHandle.tsx:25` | La syntaxe `!hover:bg-transparent` n'est pas valide en Tailwind. Le `!` (important) ne se combine pas avec `hover:` de cette façon. Devrait être `hover:!bg-transparent` ou mieux, `hover:bg-transparent` avec specificity. | [BUG CODE] | Remplacer par `disabled && "cursor-default pointer-events-none"` (le `pointer-events-none` rend le hover superflu) |
| B11 | P3 | `MobileNav` texte "Taches" sans accent | — | `src/shared/components/layout/MobileNav.tsx:13` | `"Taches"` au lieu de `"Tâches"` — devrait utiliser i18n de toute façon | [BUG CODE] | Migrer vers `useTranslations` |
| B12 | P2 | Calendar page — `viewRange` memo dépend de `getViewRange` sans dépendance stable | — | `src/app/(dashboard)/calendar/page.tsx:203` | `useMemo(() => getViewRange(), [currentDate, viewType, getViewRange])` — `getViewRange` est recréée à chaque render (Zustand `get()` pattern). Cela cause potentiellement des re-renders excessifs et des re-fetch inutiles. | [BUG CODE] | Remplacer par un sélecteur Zustand memoïsé ou calculer `viewRange` directement dans le memo sans `getViewRange` en dépendance |
| B13 | P3 | `HomeClient` — timer qui update chaque seconde | — | `src/app/(dashboard)/home/HomeClient.tsx:114-118` | `setInterval` de 1s pour `currentTime` cause un re-render complet du composant Home chaque seconde. L'heure n'est affichée qu'en `HH:mm` (pas de secondes). | [BUG CODE] | Réduire l'intervalle à 60s ou extraire l'horloge dans un sous-composant isolé |

---

## Décompte par sévérité

| Sévérité | Nombre |
|----------|--------|
| P0 (crash/sécurité/data loss) | 1 |
| P1 (fonctionnel cassé) | 4 |
| P2 (perf/UX) | 6 |
| P3 (cosmétique) | 4 |
| **Total** | **15** |

---

## Actions [CONFIG EXTERNE] pour Ralph

Ces bugs ne peuvent pas être fixés par un agent — ils nécessitent une action manuelle dans des portails externes :

1. **Apple OAuth (F1)** :
   - Aller sur https://developer.apple.com/account/resources/identifiers
   - Créer un Service ID pour Sign in with Apple
   - Générer le client secret (JWT basé sur la clé privée)
   - Ajouter `APPLE_ID` et `APPLE_SECRET` dans `.env` local + Vercel env vars
   - Configurer le redirect URI : `https://<domain>/api/auth/callback/apple`

2. **Google OAuth redirect URIs (F5)** :
   - Vérifier dans Google Cloud Console que les redirect URIs incluent le domaine de production
   - URI attendue : `https://<domain>/api/auth/callback/google`

3. **Microsoft OAuth (F5)** :
   - Vérifier dans Azure AD que le redirect URI de production est enregistré
   - Le tenant `common` est correct pour multi-tenant
   - URI attendue : `https://<domain>/api/auth/callback/microsoft-entra-id`

4. **ESLint CI (B3)** :
   - Le workflow `lint.yml` échouera tant qu'il n'y a pas de `.eslintrc.json`
   - Alternative : désactiver le workflow jusqu'à ce que la config soit prête
