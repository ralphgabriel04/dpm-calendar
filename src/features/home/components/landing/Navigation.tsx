"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme";
import { LanguageToggle } from "@/shared/components/language";
import { cn } from "@/shared/lib/utils";

export function Navigation() {
  const t = useTranslations("landing");
  const { resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/lightLogoFinal.png";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/85 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-300",
            scrolled ? "h-16" : "h-20"
          )}
        >
          <Image
            src={logoSrc}
            alt="DPM Calendar"
            width={500}
            height={125}
            className={cn("w-auto transition-all duration-300", scrolled ? "h-10" : "h-12")}
            priority
          />

          <div className="hidden items-center gap-7 text-[13.5px] text-muted-foreground lg:flex">
            <a href="#modules" className="transition-colors hover:text-foreground">
              {t("nav.modules")}
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              {t("nav.how")}
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              {t("nav.pricing")}
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              {t("nav.faq")}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 sm:flex">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              {t("nav.tryIt")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
