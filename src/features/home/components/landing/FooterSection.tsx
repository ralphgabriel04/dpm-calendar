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

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src={logoSrc}
              alt="DPM Calendar"
              width={200}
              height={50}
              className="h-12 w-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t("footer.product")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  {t("footer.features")}
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  {t("footer.pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t("footer.resources")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@dpmcalendar.com" className="hover:text-foreground transition-colors">
                  {t("footer.support")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/dpmcalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-violet-600 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/company/dpmcalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-violet-600 transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/dpmcalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-violet-600 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
