"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Link2, Cog, RefreshCw, Unlink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SyncConflictList } from "@/features/sync";

export default function SettingsPage() {
  const searchParams = useSearchParams();

  // Fetch calendar accounts
  const { data: accounts, refetch: refetchAccounts } = trpc.sync.listAccounts.useQuery();

  // Mutations
  const triggerSyncMutation = trpc.sync.triggerSync.useMutation({
    onSuccess: (data) => {
      refetchAccounts();
      toast.success(`Synchronisation terminée`, {
        description: `${data.itemsProcessed} événements synchronisés`,
      });
    },
    onError: (error) => {
      toast.error("Erreur de synchronisation", {
        description: error.message,
      });
    },
  });

  const disconnectGoogleMutation = trpc.sync.disconnectGoogle.useMutation({
    onSuccess: () => {
      refetchAccounts();
      toast.success("Google Calendar déconnecté");
    },
    onError: (error) => {
      toast.error("Erreur lors de la déconnexion", {
        description: error.message,
      });
    },
  });

  const disconnectMicrosoftMutation = trpc.sync.disconnectMicrosoft.useMutation({
    onSuccess: () => {
      refetchAccounts();
      toast.success("Microsoft Outlook déconnecté");
    },
    onError: (error) => {
      toast.error("Erreur lors de la déconnexion", {
        description: error.message,
      });
    },
  });

  // Handle URL params for success/error messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      toast.success("Google Calendar connecté avec succès");
      window.history.replaceState({}, "", "/settings");
    }

    if (success === "microsoft_connected") {
      toast.success("Microsoft Outlook connecté avec succès");
      window.history.replaceState({}, "", "/settings");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Échec de l'authentification Google",
        microsoft_auth_failed: "Échec de l'authentification Microsoft",
        no_code: "Code d'autorisation manquant",
        no_access_token: "Token d'accès non reçu",
        google_callback_failed: "Erreur lors de la connexion Google",
        microsoft_callback_failed: "Erreur lors de la connexion Microsoft",
      };
      toast.error(errorMessages[error] || "Erreur inconnue");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  const googleAccount = accounts?.find((a) => a.provider === "GOOGLE");
  const microsoftAccount = accounts?.find((a) => a.provider === "MICROSOFT");

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google-calendar";
  };

  const handleDisconnectGoogle = () => {
    if (googleAccount) {
      disconnectGoogleMutation.mutate({ accountId: googleAccount.id });
    }
  };

  const handleSyncGoogle = () => {
    if (googleAccount) {
      triggerSyncMutation.mutate({ accountId: googleAccount.id });
    }
  };

  const handleConnectMicrosoft = () => {
    window.location.href = "/api/auth/microsoft-calendar";
  };

  const handleDisconnectMicrosoft = () => {
    if (microsoftAccount) {
      disconnectMicrosoftMutation.mutate({ accountId: microsoftAccount.id });
    }
  };

  const handleSyncMicrosoft = () => {
    if (microsoftAccount) {
      triggerSyncMutation.mutate({ accountId: microsoftAccount.id });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Settings Header */}
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">Parametres</h1>
      </header>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl space-y-6">
          {/* Calendar Connections */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Connexions Calendrier</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 11.8l8.4-6.6c-.3-.3-.6-.4-1-.4H4.6c-.4 0-.7.1-1 .4l8.4 6.6z"
                      />
                      <path
                        fill="#4285F4"
                        d="M12 13.2L3.6 6.6C3.2 7 3 7.5 3 8v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-.5-.2-1-.6-1.4l-8.4 6.6z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    {googleAccount ? (
                      <div className="flex items-center gap-1.5 text-sm text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Connecté - {googleAccount.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Non connecté</span>
                      </div>
                    )}
                    {googleAccount?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dernière sync: {format(new Date(googleAccount.lastSyncAt), "dd MMM yyyy HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {googleAccount ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSyncGoogle}
                        disabled={triggerSyncMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${triggerSyncMutation.isPending ? "animate-spin" : ""}`} />
                        Synchroniser
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnectGoogle}
                        disabled={disconnectGoogleMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4 mr-1.5" />
                        Déconnecter
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                      Connecter
                    </Button>
                  )}
                </div>
              </div>

              {/* Microsoft Outlook */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#0078D4"
                        d="M11.5 2v7.5H4V2h7.5zm1 0H20v7.5h-7.5V2zM4 10.5h7.5V18H4v-7.5zm8.5 0H20V18h-7.5v-7.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Microsoft Outlook</p>
                    {microsoftAccount ? (
                      <div className="flex items-center gap-1.5 text-sm text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Connecté - {microsoftAccount.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Non connecté</span>
                      </div>
                    )}
                    {microsoftAccount?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dernière sync: {format(new Date(microsoftAccount.lastSyncAt), "dd MMM yyyy HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {microsoftAccount ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSyncMicrosoft}
                        disabled={triggerSyncMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${triggerSyncMutation.isPending ? "animate-spin" : ""}`} />
                        Synchroniser
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnectMicrosoft}
                        disabled={disconnectMicrosoftMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4 mr-1.5" />
                        Déconnecter
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleConnectMicrosoft}>
                      Connecter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Conflicts */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Conflits de synchronisation</h2>
            </div>
            <div className="p-4">
              <SyncConflictList />
            </div>
          </div>

          {/* Connected Google Calendars */}
          {googleAccount && googleAccount.calendars.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium">Calendriers Google synchronisés</h2>
              </div>
              <div className="p-4 space-y-2">
                {googleAccount.calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: calendar.color }}
                    />
                    <span className="text-sm">{calendar.name}</span>
                    {calendar.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Microsoft Calendars */}
          {microsoftAccount && microsoftAccount.calendars.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium">Calendriers Microsoft synchronisés</h2>
              </div>
              <div className="p-4 space-y-2">
                {microsoftAccount.calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: calendar.color }}
                    />
                    <span className="text-sm">{calendar.name}</span>
                    {calendar.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Cog className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Règles Automatiques</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Configurez des règles pour automatiser votre planning.
              </p>
              <a href="/rules">
                <Button variant="outline" size="sm" className="mt-4">
                  Gérer les règles
                </Button>
              </a>
            </div>
          </div>

          {/* Environment Info */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Cog className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Configuration</h2>
            </div>
            <div className="p-4 space-y-4 text-sm">
              {/* Google Configuration */}
              <div>
                <p className="font-medium mb-2">Google Calendar</p>
                <p className="text-muted-foreground">
                  Variables d'environnement requises:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>GOOGLE_CLIENT_ID</li>
                  <li>GOOGLE_CLIENT_SECRET</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Créez un projet dans{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Cloud Console
                  </a>{" "}
                  et activez l'API Calendar.
                </p>
              </div>

              {/* Microsoft Configuration */}
              <div className="pt-3 border-t">
                <p className="font-medium mb-2">Microsoft Outlook</p>
                <p className="text-muted-foreground">
                  Variables d'environnement requises:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>MICROSOFT_CLIENT_ID</li>
                  <li>MICROSOFT_CLIENT_SECRET</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Enregistrez une application dans{" "}
                  <a
                    href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Azure Portal
                  </a>{" "}
                  et ajoutez les permissions Calendars.ReadWrite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
