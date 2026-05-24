"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

export function MultiCalendarMockup() {
  const t = useTranslations("landing.mockups.calendars");
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <h4 className="font-semibold mb-4">{t("title")}</h4>
      <div className="space-y-3">
        {[
          { name: t("work"), color: "bg-violet-500", connected: true },
          { name: t("personal"), color: "bg-green-500", connected: true },
          { name: t("sport"), color: "bg-orange-500", connected: true },
        ].map((cal) => (
          <div key={cal.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${cal.color}`} />
              <span className="text-sm font-medium">{cal.name}</span>
            </div>
            <Check className="h-4 w-4 text-green-500" />
          </div>
        ))}
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-xs text-muted-foreground mb-2">External sync</p>
          {[
            { name: "Google Calendar", icon: "📅" },
            { name: "Microsoft Outlook", icon: "📅" },
          ].map((provider) => (
            <div key={provider.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 opacity-60">
              <div className="flex items-center gap-3">
                <span>{provider.icon}</span>
                <span className="text-sm">{provider.name}</span>
              </div>
              <span className="text-xs text-muted-foreground italic">Coming soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
