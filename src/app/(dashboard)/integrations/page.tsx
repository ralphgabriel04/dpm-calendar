"use client";

import { useRef, useState } from "react";
import {
  RefreshCw,
  Unlink,
  Link2,
  CalendarClock,
  Globe,
  StickyNote,
  CheckSquare,
  ListTodo,
  Lock,
  AlertTriangle,
  Plug,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Provider = "ICS" | "CALDAV" | "NOTION" | "TODOIST" | "TICKTICK";

const PROVIDER_ICONS: Record<Provider, typeof Globe> = {
  ICS: CalendarClock,
  CALDAV: Globe,
  NOTION: StickyNote,
  TODOIST: CheckSquare,
  TICKTICK: ListTodo,
};

function providerIcon(provider: string) {
  return PROVIDER_ICONS[provider as Provider] ?? Plug;
}

export default function IntegrationsPage() {
  const utils = trpc.useUtils();

  const { data: providers, isLoading: providersLoading } =
    trpc.integration.providers.useQuery();
  const { data: integrations, isLoading: integrationsLoading } =
    trpc.integration.list.useQuery();

  const invalidate = () => {
    utils.integration.providers.invalidate();
    utils.integration.list.invalidate();
  };

  // ICS subscribe-by-URL state
  const [icsUrl, setIcsUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncNow = trpc.integration.syncNow.useMutation({
    onSuccess: (data) => {
      invalidate();
      toast.success("Synchronisation terminée", {
        description: `${data.imported} importé(s), ${data.updated} mis à jour`,
      });
    },
    onError: (error) => {
      invalidate();
      toast.error("Erreur de synchronisation", { description: error.message });
    },
  });

  const connectIcsUrl = trpc.integration.connectIcsUrl.useMutation({
    onSuccess: (data) => {
      setIcsUrl("");
      invalidate();
      toast.success("Abonnement créé", {
        description: "Synchronisation en cours…",
      });
      syncNow.mutate({ integrationId: data.integrationId });
    },
    onError: (error) => {
      toast.error("Impossible de s'abonner à cette URL", {
        description: error.message,
      });
    },
  });

  const importIcsText = trpc.integration.importIcsText.useMutation({
    onSuccess: (data) => {
      invalidate();
      toast.success("Fichier importé", {
        description: `${data.imported} événement(s) importé(s)`,
      });
    },
    onError: (error) => {
      toast.error("Échec de l'importation", { description: error.message });
    },
  });

  const disconnect = trpc.integration.disconnect.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Intégration déconnectée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la déconnexion", {
        description: error.message,
      });
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const url = icsUrl.trim();
    if (!url) return;
    connectIcsUrl.mutate({ url });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      importIcsText.mutate({ content, label: file.name });
    } catch {
      toast.error("Impossible de lire le fichier");
    } finally {
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDisconnect = (integrationId: string, label: string) => {
    const confirmed = window.confirm(
      `Déconnecter « ${label} » ?`,
    );
    if (!confirmed) return;
    const deleteImported = window.confirm(
      "Supprimer également les événements importés depuis cette source ?",
    );
    disconnect.mutate({ integrationId, deleteImported });
  };

  const handleOAuthConnect = () => {
    toast.info("Bientôt disponible", {
      description: "La connexion à ce service sera bientôt activée.",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <Plug className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Centre de synchronisation</h1>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl space-y-8">
          {/* Provider cards */}
          <section className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connectez vos calendriers et listes de tâches externes pour
              importer leurs événements dans votre planning.
            </p>

            {providersLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : !providers || providers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun service disponible.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {providers.map((provider) => {
                  const Icon = providerIcon(provider.provider);
                  const needsConfig =
                    provider.requiresOAuth && !provider.configured;

                  return (
                    <div
                      key={provider.provider}
                      className="rounded-lg border bg-card p-4 space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {provider.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {provider.provider === "ICS"
                              ? "Fichier .ics ou abonnement par URL"
                              : provider.requiresOAuth
                                ? "Connexion via OAuth"
                                : "Identifiants requis"}
                          </p>
                        </div>
                      </div>

                      {/* ICS: file + URL */}
                      {provider.provider === "ICS" && (
                        <div className="space-y-4">
                          <form
                            onSubmit={handleSubscribe}
                            className="space-y-2"
                          >
                            <label className="text-xs font-medium text-muted-foreground">
                              S'abonner à une URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={icsUrl}
                                onChange={(e) => setIcsUrl(e.target.value)}
                                placeholder="https://exemple.com/calendrier.ics"
                                aria-label="URL du calendrier ICS"
                                className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={
                                  connectIcsUrl.isPending ||
                                  !icsUrl.trim()
                                }
                              >
                                <Link2 className="mr-1.5 h-4 w-4" />
                                S'abonner
                              </Button>
                            </div>
                          </form>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Importer un fichier .ics
                            </label>
                            <div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".ics"
                                onChange={handleFile}
                                disabled={importIcsText.isPending}
                                aria-label="Importer un fichier ICS"
                                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OAuth providers needing configuration */}
                      {needsConfig && (
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" />
                            Configuration requise
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Un administrateur doit configurer les clés API.
                            Consultez le{" "}
                            <a
                              href="https://github.com/RalphChristianGabriel/dpm-calendar/blob/main/docs/INTEGRATIONS.md"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              guide d'intégration
                            </a>
                            .
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full"
                          >
                            Configuration requise
                          </Button>
                        </div>
                      )}

                      {/* OAuth providers configured (flow not yet wired) */}
                      {provider.requiresOAuth && provider.configured && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOAuthConnect}
                          className="w-full"
                        >
                          <Link2 className="mr-1.5 h-4 w-4" />
                          Connecter
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Connected integrations */}
          <section className="space-y-3">
            <h2 className="font-medium">Sources connectées</h2>

            {integrationsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : !integrations || integrations.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune source connectée pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => {
                  const Icon = providerIcon(integration.provider);
                  const itemCount = integration._count?.items ?? 0;

                  return (
                    <div
                      key={integration.id}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {integration.label || integration.provider}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {integration.provider} · {itemCount} événement(s)
                            </p>
                            {integration.lastSyncAt && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Dernière sync :{" "}
                                {format(
                                  new Date(integration.lastSyncAt),
                                  "dd MMM yyyy HH:mm",
                                  { locale: fr },
                                )}
                              </p>
                            )}
                            {integration.lastError && (
                              <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="break-words">
                                  {integration.lastError}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              syncNow.mutate({
                                integrationId: integration.id,
                              })
                            }
                            disabled={syncNow.isPending}
                          >
                            <RefreshCw
                              className={`mr-1.5 h-4 w-4 ${
                                syncNow.isPending ? "animate-spin" : ""
                              }`}
                            />
                            Synchroniser
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDisconnect(
                                integration.id,
                                integration.label || integration.provider,
                              )
                            }
                            disabled={disconnect.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="mr-1.5 h-4 w-4" />
                            Déconnecter
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
