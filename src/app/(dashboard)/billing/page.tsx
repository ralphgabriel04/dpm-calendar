"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export default function BillingPage() {
  const t = useTranslations("billing");
  const formatPrice = (price: number): string =>
    price === 0 ? t("free") : t("perMonth", { price });
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState<Plan | "portal" | null>(null);

  const { data: status, isLoading: statusLoading } =
    trpc.billing.getStatus.useQuery();
  const { data: plansData, isLoading: plansLoading } =
    trpc.billing.getPlans.useQuery();

  // Success / canceled toast based on URL params
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success(t("subscriptionActivated"), {
        description: t("subscriptionActivatedDesc"),
      });
      window.history.replaceState({}, "", "/billing");
    }
    if (searchParams.get("canceled") === "1") {
      toast.info(t("paymentCanceled"), {
        description: t("paymentCanceledDesc"),
      });
      window.history.replaceState({}, "", "/billing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.error(t("checkoutError"), {
          description: d.error ?? t("retryLater"),
        });
        setRedirecting(null);
      }
    } catch {
      toast.error(t("networkError"), {
        description: t("networkErrorDesc"),
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
        toast.error(t("portalError"), {
          description: d.error ?? t("retryLater"),
        });
        setRedirecting(null);
      }
    } catch {
      toast.error(t("networkError"), {
        description: t("networkErrorDesc"),
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
        <h1 className="text-lg font-semibold">{t("title")}</h1>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <>
              {/* Not configured panel */}
              {!configured && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/5">
                  <div className="flex items-center gap-3 border-b border-amber-500/30 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="font-medium text-amber-700 dark:text-amber-400">
                      {t("notConfiguredTitle")}
                    </h2>
                  </div>
                  <div className="space-y-3 p-4 text-sm">
                    <p className="text-muted-foreground">
                      {t.rich("notConfiguredIntro", {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                    <p className="text-muted-foreground">
                      {t("notConfiguredEnv")}
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
                      {t("notConfiguredGuide")}{" "}
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
                      <p className="font-medium">
                        {t("subscriptionPlan", { plan: subscription.plan })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("statusLabel", { status: subscription.status })}
                        {subscription.cancelAtPeriodEnd &&
                          t("cancelScheduled")}
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
                        ? t("openingPortal")
                        : t("managePlan")}
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
                            {t("currentPlan")}
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
                            {t("configRequired")}
                          </Button>
                        ) : isCurrent ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full"
                          >
                            {t("currentPlan")}
                          </Button>
                        ) : isUpgrade ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckout(p.plan as Plan)}
                            disabled={redirecting === p.plan}
                            className="w-full gap-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            {redirecting === p.plan ? t("redirecting") : t("upgrade")}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full"
                          >
                            {t("included")}
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
