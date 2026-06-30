"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Check,
  AlertTriangle,
  Sparkles,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";

type Plan = "FREE" | "PRO" | "TEAM";

const REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_TEAM",
];

function formatPrice(price: number): string {
  if (price === 0) return "Gratuit";
  return `${price} €/mois`;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState<Plan | "portal" | null>(null);

  const { data: status, isLoading: statusLoading } =
    trpc.billing.getStatus.useQuery();
  const { data: plansData, isLoading: plansLoading } =
    trpc.billing.getPlans.useQuery();

  // Success / canceled toast based on URL params
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Abonnement activé", {
        description: "Merci ! Votre paiement a été confirmé.",
      });
      window.history.replaceState({}, "", "/billing");
    }
    if (searchParams.get("canceled") === "1") {
      toast.info("Paiement annulé", {
        description: "Aucun montant n'a été débité.",
      });
      window.history.replaceState({}, "", "/billing");
    }
  }, [searchParams]);

  const configured = status?.configured ?? false;
  const currentPlan: Plan = status?.plan ?? "FREE";
  const subscription = status?.subscription ?? null;
  const plans = plansData?.plans ?? [];

  const handleCheckout = async (plan: Plan) => {
    setRedirecting(plan);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        toast.error("Impossible de démarrer le paiement", {
          description: d.error ?? "Veuillez réessayer plus tard.",
        });
        setRedirecting(null);
      }
    } catch {
      toast.error("Erreur réseau", {
        description: "Impossible de contacter le service de paiement.",
      });
      setRedirecting(null);
    }
  };

  const handlePortal = async () => {
    setRedirecting("portal");
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        toast.error("Impossible d'ouvrir le portail", {
          description: d.error ?? "Veuillez réessayer plus tard.",
        });
        setRedirecting(null);
      }
    } catch {
      toast.error("Erreur réseau", {
        description: "Impossible de contacter le service de paiement.",
      });
      setRedirecting(null);
    }
  };

  const planRank: Record<Plan, number> = { FREE: 0, PRO: 1, TEAM: 2 };
  const isLoading = statusLoading || plansLoading;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Abonnement</h1>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <>
              {/* Not configured panel */}
              {!configured && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/5">
                  <div className="flex items-center gap-3 border-b border-amber-500/30 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="font-medium text-amber-700 dark:text-amber-400">
                      Facturation non configurée
                    </h2>
                  </div>
                  <div className="space-y-3 p-4 text-sm">
                    <p className="text-muted-foreground">
                      Les clés Stripe ne sont pas définies. L'application
                      fonctionne entièrement avec le plan{" "}
                      <strong>FREE</strong> — aucune action n'est requise pour
                      l'utiliser.
                    </p>
                    <p className="text-muted-foreground">
                      Pour activer les abonnements payants, définissez les
                      variables d'environnement suivantes :
                    </p>
                    <ul className="ml-2 list-inside list-disc space-y-1 text-muted-foreground">
                      {REQUIRED_ENV_VARS.map((v) => (
                        <li key={v}>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {v}
                          </code>
                        </li>
                      ))}
                    </ul>
                    <p className="text-muted-foreground">
                      Consultez le guide de configuration :{" "}
                      <a
                        href="https://github.com/RalphGabriel/dpm-calendar/blob/main/docs/BILLING.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        docs/BILLING.md
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Manage subscription */}
              {configured && subscription && (
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Abonnement {subscription.plan}</p>
                      <p className="text-sm text-muted-foreground">
                        Statut : {subscription.status}
                        {subscription.cancelAtPeriodEnd &&
                          " — annulation programmée en fin de période"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePortal}
                      disabled={redirecting === "portal"}
                      className="gap-2 shrink-0"
                    >
                      <Settings2 className="h-4 w-4" />
                      {redirecting === "portal"
                        ? "Ouverture…"
                        : "Gérer mon abonnement"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Plan cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {plans.map((p) => {
                  const isCurrent = p.plan === currentPlan;
                  const isUpgrade =
                    planRank[p.plan as Plan] > planRank[currentPlan];
                  return (
                    <div
                      key={p.plan}
                      className={cn(
                        "flex flex-col rounded-lg border bg-card p-5",
                        isCurrent && "ring-2 ring-primary",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold">{p.name}</h3>
                        {isCurrent && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Plan actuel
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-2xl font-bold">
                        {formatPrice(p.price)}
                      </p>
                      <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5">
                        {!configured ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full"
                          >
                            Configuration requise
                          </Button>
                        ) : isCurrent ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full"
                          >
                            Plan actuel
                          </Button>
                        ) : isUpgrade ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckout(p.plan as Plan)}
                            disabled={redirecting === p.plan}
                            className="w-full gap-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            {redirecting === p.plan ? "Redirection…" : "Améliorer"}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full"
                          >
                            Inclus
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
