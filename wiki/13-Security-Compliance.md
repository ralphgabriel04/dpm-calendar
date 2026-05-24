# 🔐 Sécurité & Conformité

## Authentification

### NextAuth v5

DPM utilise **NextAuth.js v5** (beta 30) avec l'adaptateur Prisma.

### Providers supportés

| Provider | Type | Scopes |
|----------|------|--------|
| **Google** | OAuth 2.0 | openid, email, profile, calendar, calendar.events |
| **Microsoft Entra ID** | OAuth 2.0 | openid, email, profile, User.Read, Calendars.ReadWrite |
| **GitHub** | OAuth 2.0 | (défaut) |
| **Apple** | OAuth 2.0 | (défaut) |
| **Enterprise SSO** | OIDC | openid, email, profile |
| **Credentials** | Demo (dev only) | - |

### Stratégie de session

| Configuration | Avec OAuth | Sans OAuth |
|---------------|-----------|-----------|
| Adaptateur | PrismaAdapter | Aucun |
| Stratégie | Database sessions | JWT |
| Stockage | Table `Session` | Token signé |

### Sécurité du provider Credentials

Le provider Credentials est **désactivé en production** (`NODE_ENV !== "production"`) pour prévenir les accès non autorisés. Il est réservé au développement et aux démos.

> **ADR-002** : Documentée dans `docs/decisions/002-authentication-strategy.md`

---

## Edge Middleware

Le middleware (`src/middleware.ts`) s'exécute en **Edge Runtime** :

1. Vérifie la **présence** d'un cookie de session NextAuth
2. Redirige vers `/login` si absent
3. Préserve l'URL de callback pour post-login
4. Ne valide **pas** la session (trop coûteux en Edge)
5. La validation complète est faite dans le layout dashboard

### Routes protégées

```
/home, /calendar, /tasks, /habits, /goals, /dashboard,
/analytics, /rules, /planner, /matrix, /daily-planning,
/settings, /onboarding
```

---

## Chiffrement des tokens OAuth

### AES-256-GCM

Les tokens OAuth stockés en base de données sont chiffrés avec **AES-256-GCM** (`src/lib/crypto.ts`).

| Propriété | Valeur |
|-----------|--------|
| Algorithme | AES-256-GCM |
| Clé | Dérivée de `ENCRYPTION_KEY` via SHA-256 |
| IV | 12 bytes aléatoires par encryption |
| Auth Tag | 16 bytes |
| Format | `enc:v1:<iv>:<authTag>:<ciphertext>` |

### Backward compatibility

- Les tokens en clair (legacy) sont transparentement passés à travers `decrypt()`
- `encryptToken()` est idempotent (n'encrypte pas un token déjà encrypté)
- Migration progressive via `scripts/encrypt-existing-tokens.ts`

### Tests : 5 tests unitaires couvrant roundtrip, prefix, backward compat, idempotence, null handling

---

## Rate Limiting

### Implémentation

Rate limiter **in-memory** avec algorithme **sliding window** (`src/lib/rateLimit.ts`).

### Limites

| Type | Limite | Fenêtre | Usage |
|------|--------|---------|-------|
| `query` | 300 requêtes | 1 minute | Toutes les queries |
| `mutation` | 100 requêtes | 1 minute | Toutes les mutations |
| `sync` | 10 requêtes | 5 minutes | Opérations de sync |
| `login` | 5 requêtes | 15 minutes | Brute force protection |

### Identifiant

- **Authentifié** : `user:{userId}` (précision par utilisateur)
- **Non authentifié** : `ip:{x-forwarded-for}` (précision par IP)

### Tests : 5 tests unitaires couvrant limites, buckets indépendants, fenêtre temporelle, reset

---

## Headers de sécurité

Configurés dans `next.config.mjs` :

| Header | Valeur | Protection |
|--------|--------|-----------|
| `X-Frame-Options` | DENY | Clickjacking |
| `X-Content-Type-Options` | nosniff | MIME sniffing |
| `Referrer-Policy` | strict-origin-when-cross-origin | Fuite de referrer |
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload | Downgrade attacks |
| `Permissions-Policy` | camera=(), microphone=(self), geolocation=() | API browser |
| `X-DNS-Prefetch-Control` | on | Performance |
| `Content-Security-Policy-Report-Only` | (voir ci-dessous) | XSS, injection |

### CSP (Content Security Policy)

Mode **Report-Only** actuellement (pas de blocage, collecte de violations) :

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com data:
img-src 'self' data: blob: https:
connect-src 'self' https://*.supabase.co https://*.vercel.app wss:
frame-src 'self' https://accounts.google.com https://login.microsoftonline.com
frame-ancestors 'none'
```

---

## Conformité

### Loi 25 (Québec)

La Loi 25 (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) s'applique à DPM.

| Exigence | Statut | Implémentation |
|----------|--------|---------------|
| Politique de confidentialité | ✅ | `/privacy` |
| Conditions d'utilisation | ✅ | `/terms` |
| Inventaire des données | ✅ | `docs/compliance/DATA_INVENTORY.md` |
| Registre des incidents | ✅ | `docs/compliance/INCIDENT_REGISTER.md` |
| Runbook des incidents | ✅ | `docs/compliance/INCIDENT_RUNBOOK.md` |
| Responsable PRP | ✅ | Désigné |
| Consentement explicite | ✅ | OAuth consent flow |
| Droit de suppression | ✅ | `user.deleteMyAccount` |
| Droit d'exportation | ✅ | `user.exportMyData` |
| Notification CAI (72h) | ✅ | Runbook documenté |

### RGPD (Europe)

| Article | Exigence | Implémentation |
|---------|----------|---------------|
| Art. 6 | Base légale | Consentement (OAuth) + contrat |
| Art. 17 | Droit à l'effacement | `user.deleteMyAccount` |
| Art. 20 | Portabilité des données | `user.exportMyData` (JSON) |
| Art. 25 | Privacy by design | Encryption, rate limiting |
| Art. 32 | Sécurité du traitement | AES-256-GCM, HTTPS, HSTS |

### PIPEDA (Canada fédéral)

| Principe | Implémentation |
|----------|---------------|
| Responsabilité | Responsable PRP désigné |
| Consentement | OAuth consent explicite |
| Limitation de la collecte | Minimum nécessaire |
| Conservation | Retention policies définies |
| Exactitude | User peut modifier ses données |
| Mesures de sécurité | Encryption, rate limiting, auth |
| Transparence | Politique de confidentialité |
| Accès individuel | Export des données |

---

## Audit Log

Le modèle `AuditLog` enregistre les actions sensibles :

| Champ | Description |
|-------|-------------|
| userId | Utilisateur concerné |
| userEmail | Email |
| action | Type d'action |
| metadata | Détails (Json) |
| ipAddress | Adresse IP |
| userAgent | Navigateur |
| createdAt | Horodatage |

---

## CI/CD Security

### GitHub Actions

| Workflow | Déclencheur | Actions |
|----------|-----------|---------|
| `ci.yml` | Push main, PRs | Build + TypeScript + Prisma validate + Tests |
| `lint.yml` | Push main, PRs | ESLint |

### Environnement CI

Les secrets sont des valeurs factices pour le build :
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dpm
NEXTAUTH_SECRET=ci-dummy-secret-...
ENCRYPTION_KEY=ci-encryption-key-...
```

---

## Recommandations ouvertes

| Point | Priorité | Description |
|-------|----------|-------------|
| CSP en mode enforce | P1 | Passer de Report-Only à enforce |
| Audit de scopes Google | P2 | Vérifier les scopes minimaux |
| Rate limiting distribué | P2 | Remplacer in-memory par Redis pour le multi-instance |
| 2FA | P2 | Ajouter l'authentification à deux facteurs |
