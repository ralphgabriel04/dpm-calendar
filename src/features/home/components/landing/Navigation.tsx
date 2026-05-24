"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/shared/components/theme";
import { LanguageToggle } from "@/shared/components/language";

export function Navigation() {
  const t = useTranslations("landing");
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/lightLogoFinal.png";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 sm:h-28 md:h-32 items-center justify-between">
          <div className="flex items-center">
            <Image
              src={logoSrc}
              alt="DPM Calendar"
              width={500}
              height={125}
              className="h-16 sm:h-20 md:h-24 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
            >
              {t("nav.tryIt")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
