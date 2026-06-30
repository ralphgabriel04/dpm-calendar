# Facturation (Stripe)

La facturation est **optionnelle**. Tant que Stripe n'est pas configuré, la page
**Abonnement** affiche « Configuration requise », aucun bouton d'amélioration
n'est actif, et **tout le monde reste sur le plan FREE**. L'application est
pleinement fonctionnelle sans configuration.

Suivez les étapes ci-dessous pour activer les abonnements payants (PRO / TEAM).

## 1. Créer un compte Stripe

Inscrivez-vous sur [https://dashboard.stripe.com](https://dashboard.stripe.com).
Utilisez le mode **Test** pour le développement, puis le mode **Live** en
production.

## 2. Créer les produits et prix PRO et TEAM

Dans **Product catalog → Add product**, créez deux produits :

- **PRO** — avec un **prix récurrent** (mensuel).
- **TEAM** — avec un **prix récurrent** (mensuel).

Pour chaque produit, copiez l'identifiant du prix (format `price_…`) et
renseignez-le dans `.env` :

```bash
STRIPE_PRICE_PRO="price_xxxxxxxxxxxxx"
STRIPE_PRICE_TEAM="price_yyyyyyyyyyyyy"
```

## 3. Clés API

Dans **Developers → API keys**, copiez :

```bash
STRIPE_SECRET_KEY="sk_test_…"                 # ou sk_live_… en production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_…" # ou pk_live_…
```

## 4. Configurer le webhook

Dans **Developers → Webhooks → Add endpoint**, créez un endpoint pointant vers :

```
https://VOTRE_DOMAINE/api/stripe/webhook
```

Abonnez-le aux événements suivants :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copiez le **signing secret** de l'endpoint (format `whsec_…`) dans `.env` :

```bash
STRIPE_WEBHOOK_SECRET="whsec_…"
```

## 5. Test en local avec la Stripe CLI

En local, il n'y a pas d'URL publique. Utilisez la
[Stripe CLI](https://docs.stripe.com/stripe-cli) pour relayer les webhooks :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

La commande affiche un `whsec_…` temporaire à utiliser comme
`STRIPE_WEBHOOK_SECRET` pendant le développement local.

## Récapitulatif des variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_…`). |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook (`whsec_…`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (`pk_…`). |
| `STRIPE_PRICE_PRO` | Identifiant du prix récurrent PRO (`price_…`). |
| `STRIPE_PRICE_TEAM` | Identifiant du prix récurrent TEAM (`price_…`). |

Une fois ces variables définies et l'application redémarrée, la page
**Abonnement** affiche les plans avec les boutons « Améliorer » actifs et, pour
les abonnés, un bouton « Gérer mon abonnement ».
