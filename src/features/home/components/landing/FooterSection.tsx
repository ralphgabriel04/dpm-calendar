"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Twitter, Linkedin, Github } from "lucide-react";

export function FooterSection() {
  const t = useTranslations("landing");
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/lightLogoFinal.png";

  const colHead = "mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground";

  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 text-[13px] md:grid-cols-4">
          {/* Logo + tagline + social */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src={logoSrc}
              alt="DPM Calendar"
              width={200}
              height={50}
              className="mb-4 h-10 w-auto"
            />
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">{t("footer.tagline")}</p>
            <div className="mt-4 flex items-center gap-2">
              {[
                { Icon: Twitter, href: "https://twitter.com/dpmcalendar" },
                { Icon: Linkedin, href: "https://linkedin.com/company/dpmcalendar" },
                { Icon: Github, href: "https://github.com/dpmcalendar" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="h-[15px] w-[15px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className={colHead}>{t("footer.product")}</div>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <a href="#features" className="transition-colors hover:text-foreground">
                  {t("footer.features")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="transition-colors hover:text-foreground">
                  {t("footer.pricing")}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className={colHead}>{t("footer.resources")}</div>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <a href="#faq" className="transition-colors hover:text-foreground">
                  {t("nav.faq")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@dpmcalendar.com"
                  className="transition-colors hover:text-foreground"
                >
                  {t("footer.support")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className={colHead}>{t("footer.legal")}</div>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-foreground">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-foreground">
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* bottom strip */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground sm:flex-row">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
