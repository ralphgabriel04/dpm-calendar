# 🚀 Démarrage rapide

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ (ou Supabase) |
| Git | 2.30+ |

---

## Installation

### 1. Cloner le repo

```bash
git clone https://github.com/ralphgabriel04/dpm-calendar.git
cd dpm-calendar
```

### 2. Installer les dépendances

```bash
npm install
```

> `postinstall` exécute automatiquement `prisma generate`.

### 3. Configurer les variables d'environnement

Copier le fichier template :

```bash
cp .env.example .env.local
```

### Variables requises

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DATABASE_URL` | URL PostgreSQL (Supabase recommandé) | Oui |
| `DIRECT_URL` | URL directe PostgreSQL (pour les migrations) | Oui |
| `AUTH_SECRET` | Clé secrète NextAuth (générer avec `openssl rand -base64 32`) | Oui |
| `AUTH_URL` | URL de l'application (`http://localhost:3000` en dev) | Oui |
| `ENCRYPTION_KEY` | Clé AES-256-GCM pour chiffrer les tokens OAuth. Générer avec : `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. **Ne jamais changer en production.** | Oui |

### Variables optionnelles (OAuth providers)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google (login + Calendar sync). [Console Google](https://console.cloud.google.com/apis/credentials) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | OAuth Microsoft (login + Outlook sync). [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth GitHub (login uniquement). [GitHub Developers](https://github.com/settings/developers) |
| `APPLE_ID` / `APPLE_SECRET` | OAuth Apple (login uniquement). [Apple Developer](https://developer.apple.com/account/resources/identifiers) |
| `SSO_CLIENT_ID` / `SSO_CLIENT_SECRET` / `SSO_ISSUER` | Enterprise SSO via OIDC (Okta, Auth0, OneLogin, Azure AD) |
| `SSO_PROVIDER_NAME` | Nom affiché pour le provider SSO (défaut : "SSO Entreprise") |
| `RESEND_API_KEY` / `EMAIL_FROM` | Envoi d'emails via Resend |

> **Note** : Si aucun provider OAuth n'est configuré, un provider `Credentials` (démo) est activé automatiquement en mode développement. Ce provider est **désactivé en production** pour des raisons de sécurité.

### 4. Configurer la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npm run db:studio
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

---

## Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `next dev` | Serveur de développement avec hot reload |
| `build` | `prisma generate && next build` | Build de production |
| `start` | `next start` | Démarrer le serveur de production |
| `lint` | `next lint` | Linter ESLint |
| `db:generate` | `prisma generate` | Générer le client Prisma |
| `db:push` | `prisma db push` | Pousser le schéma sans migration |
| `db:migrate` | `prisma migrate dev` | Créer et appliquer une migration |
| `db:studio` | `prisma studio` | Interface visuelle de la base de données |
| `test` | `vitest run` | Exécuter les tests (run unique) |
| `test:watch` | `vitest` | Exécuter les tests en mode watch |

---

## Troubleshooting

### Erreur `prisma generate` échoue

Vérifier que `DATABASE_URL` est correctement configuré dans `.env.local` et que la base de données est accessible.

### Erreur d'authentification

Si aucun provider OAuth n'est configuré, vérifier que `NODE_ENV !== "production"` pour que le provider Credentials (démo) soit disponible.

### Port 3000 déjà utilisé

```bash
npx kill-port 3000
npm run dev
```

### Erreur de décryptage des tokens

Si `ENCRYPTION_KEY` a changé, les tokens OAuth existants ne peuvent plus être décryptés. Exécuter le script de migration :

```bash
npx ts-node scripts/encrypt-existing-tokens.ts
```
