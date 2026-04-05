"use client";

import { useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Smartphone, Mail, Moon, Sun, TestTube } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Switch } from "@/shared/components/ui/Switch";
import { cn } from "@/shared/lib/utils";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { trpc } from "@/infrastructure/trpc/client";
import { toast } from "sonner";

export function NotificationSettings() {
  const t = useTranslations("notificationSettings");

  const {
    isSupported,
    isEnabled,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  // Fetch and update preferences
  const { data: preferences, refetch: refetchPreferences } =
    trpc.notification.getPreferences.useQuery();
  const updatePreferencesMutation =
    trpc.notification.updatePreferences.useMutation({
      onSuccess: () => {
        refetchPreferences();
        toast.success(t("saved"));
      },
    });

  const handleTogglePush = async () => {
    if (isEnabled) {
      const success = await unsubscribe();
      if (success) {
        toast.success(t("pushDisabled"));
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success(t("pushEnabled"));
      } else if (permission === "denied") {
        toast.error(t("permissionDenied"));
      }
    }
  };

  const handleToggleEmail = async () => {
    await updatePreferencesMutation.mutateAsync({
      enableEmail: !preferences?.enableEmail,
    });
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast.success(t("testSent"));
    } catch {
      toast.error(t("testFailed"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Push Notifications */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isEnabled
                  ? "bg-green-500/10 text-green-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isEnabled ? (
                <BellRing className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{t("push.title")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("push.description")}
              </p>
            </div>
          </div>

          <Switch
            checked={isEnabled}
            onCheckedChange={handleTogglePush}
            disabled={!isSupported || isLoading}
          />
        </div>

        {/* Browser support warning */}
        {!isSupported && (
          <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg p-3 text-sm">
            {t("push.notSupported")}
          </div>
        )}

        {/* Permission denied warning */}
        {permission === "denied" && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
            {t("push.permissionDenied")}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Test notification button */}
        {isEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {t("push.sendTest")}
          </Button>
        )}
      </div>

      {/* Email Notifications */}
      <div className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                preferences?.enableEmail
                  ? "bg-violet-500/10 text-violet-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{t("email.title")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("email.description")}
              </p>
            </div>
          </div>

          <Switch
            checked={preferences?.enableEmail ?? false}
            onCheckedChange={handleToggleEmail}
            disabled={updatePreferencesMutation.isPending}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{t("quietHours.title")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("quietHours.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pl-13">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">
              {t("quietHours.from")}
            </label>
            <input
              type="time"
              value={preferences?.quietHoursStart || "22:00"}
              onChange={(e) =>
                updatePreferencesMutation.mutate({
                  quietHoursStart: e.target.value,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">
              {t("quietHours.to")}
            </label>
            <input
              type="time"
              value={preferences?.quietHoursEnd || "07:00"}
              onChange={(e) =>
                updatePreferencesMutation.mutate({
                  quietHoursEnd: e.target.value,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Device Info */}
      {isEnabled && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("devices.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("devices.current")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
