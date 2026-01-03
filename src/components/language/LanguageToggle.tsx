"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

export function LanguageToggle({ collapsed = false }: { collapsed?: boolean }) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const newLocale = locale === "fr" ? "en" : "fr";

    startTransition(() => {
      // Set the locale cookie
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      // Reload the page to apply the new locale
      window.location.reload();
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      disabled={isPending}
      className={cn(
        "h-8 w-8 rounded-full",
        isPending && "opacity-50 cursor-wait"
      )}
      title={locale === "fr" ? "Switch to English" : "Passer en Français"}
    >
      <Globe className="h-4 w-4" />
      {!collapsed && (
        <span className="ml-1 text-xs font-medium uppercase">{locale}</span>
      )}
    </Button>
  );
}
