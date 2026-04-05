"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme";
import { LanguageToggle } from "@/shared/components/language";

export default function PrivacyPolicy() {
  const t = useTranslations("privacy");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <Image
                src="/lightLogoFinal.png"
                alt="DPM Calendar"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 mb-4">
              <Shield className="h-4 w-4" />
              {t("badge")}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl mb-4">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("lastUpdated")}: {t("effectiveDate")}
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-10">
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("intro.p1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("intro.p2")}
            </p>
          </section>

          {/* Section 1: Data Controller */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("controller.title")}</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p><strong>{t("controller.company")}:</strong> DPM Inc.</p>
              <p><strong>{t("controller.address")}:</strong> {t("controller.addressValue")}</p>
              <p><strong>{t("controller.contact")}:</strong> privacy@dpmcalendar.com</p>
              <p><strong>{t("controller.founder")}:</strong> Ralph Christian Gabriel</p>
            </div>
          </section>

          {/* Section 2: Data Collected */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("dataCollected.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("dataCollected.intro")}</p>

            <h3 className="font-medium mb-2">{t("dataCollected.account.title")}</h3>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>{t("dataCollected.account.email")}</li>
              <li>{t("dataCollected.account.name")}</li>
              <li>{t("dataCollected.account.avatar")}</li>
              <li>{t("dataCollected.account.provider")}</li>
            </ul>

            <h3 className="font-medium mb-2">{t("dataCollected.app.title")}</h3>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>{t("dataCollected.app.events")}</li>
              <li>{t("dataCollected.app.tasks")}</li>
              <li>{t("dataCollected.app.habits")}</li>
              <li>{t("dataCollected.app.goals")}</li>
              <li>{t("dataCollected.app.energy")}</li>
              <li>{t("dataCollected.app.journal")}</li>
              <li>{t("dataCollected.app.mood")}</li>
            </ul>

            <h3 className="font-medium mb-2">{t("dataCollected.technical.title")}</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("dataCollected.technical.ip")}</li>
              <li>{t("dataCollected.technical.browser")}</li>
              <li>{t("dataCollected.technical.device")}</li>
              <li>{t("dataCollected.technical.usage")}</li>
            </ul>
          </section>

          {/* Section 3: Purpose */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("purpose.title")}</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("purpose.service")}</li>
              <li>{t("purpose.sync")}</li>
              <li>{t("purpose.improve")}</li>
              <li>{t("purpose.support")}</li>
              <li>{t("purpose.security")}</li>
              <li>{t("purpose.legal")}</li>
            </ul>
          </section>

          {/* Section 4: Legal Basis */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("legalBasis.title")}</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>{t("legalBasis.consent.title")}:</strong> {t("legalBasis.consent.desc")}</li>
              <li><strong>{t("legalBasis.contract.title")}:</strong> {t("legalBasis.contract.desc")}</li>
              <li><strong>{t("legalBasis.legitimate.title")}:</strong> {t("legalBasis.legitimate.desc")}</li>
              <li><strong>{t("legalBasis.legal.title")}:</strong> {t("legalBasis.legal.desc")}</li>
            </ul>
          </section>

          {/* Section 5: Data Storage */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("storage.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("storage.intro")}</p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <p className="font-medium">{t("storage.database.title")}</p>
                <p className="text-sm text-muted-foreground">{t("storage.database.desc")}</p>
              </div>
              <div>
                <p className="font-medium">{t("storage.hosting.title")}</p>
                <p className="text-sm text-muted-foreground">{t("storage.hosting.desc")}</p>
              </div>
              <div>
                <p className="font-medium">{t("storage.location.title")}</p>
                <p className="text-sm text-muted-foreground">{t("storage.location.desc")}</p>
              </div>
            </div>
          </section>

          {/* Section 6: Data Retention */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("retention.title")}</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("retention.active")}</li>
              <li>{t("retention.deletion")}</li>
              <li>{t("retention.backup")}</li>
              <li>{t("retention.legal")}</li>
            </ul>
          </section>

          {/* Section 7: Data Sharing */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("sharing.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("sharing.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Supabase:</strong> {t("sharing.supabase")}</li>
              <li><strong>Vercel:</strong> {t("sharing.vercel")}</li>
              <li><strong>OAuth:</strong> {t("sharing.oauth")}</li>
            </ul>
            <p className="text-muted-foreground mt-4">{t("sharing.noSale")}</p>
          </section>

          {/* Section 8: Cookies */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("cookies.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("cookies.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>{t("cookies.essential.title")}:</strong> {t("cookies.essential.desc")}</li>
              <li><strong>{t("cookies.analytics.title")}:</strong> {t("cookies.analytics.desc")}</li>
            </ul>
          </section>

          {/* Section 9: Your Rights */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("rights.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("rights.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>{t("rights.access.title")}:</strong> {t("rights.access.desc")}</li>
              <li><strong>{t("rights.rectification.title")}:</strong> {t("rights.rectification.desc")}</li>
              <li><strong>{t("rights.deletion.title")}:</strong> {t("rights.deletion.desc")}</li>
              <li><strong>{t("rights.portability.title")}:</strong> {t("rights.portability.desc")}</li>
              <li><strong>{t("rights.restriction.title")}:</strong> {t("rights.restriction.desc")}</li>
              <li><strong>{t("rights.objection.title")}:</strong> {t("rights.objection.desc")}</li>
              <li><strong>{t("rights.withdrawal.title")}:</strong> {t("rights.withdrawal.desc")}</li>
            </ul>
            <p className="text-muted-foreground mt-4">{t("rights.exercise")}</p>
          </section>

          {/* Section 10: Compliance */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("compliance.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("compliance.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>{t("compliance.loi25.title")}:</strong> {t("compliance.loi25.desc")}</li>
              <li><strong>{t("compliance.pipeda.title")}:</strong> {t("compliance.pipeda.desc")}</li>
              <li><strong>{t("compliance.gdpr.title")}:</strong> {t("compliance.gdpr.desc")}</li>
            </ul>
          </section>

          {/* Section 11: Security */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("security.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("security.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("security.tls")}</li>
              <li>{t("security.oauth")}</li>
              <li>{t("security.access")}</li>
              <li>{t("security.monitoring")}</li>
            </ul>
          </section>

          {/* Section 12: Children */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("children.title")}</h2>
            <p className="text-muted-foreground">{t("children.desc")}</p>
          </section>

          {/* Section 13: Changes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("changes.title")}</h2>
            <p className="text-muted-foreground">{t("changes.desc")}</p>
          </section>

          {/* Section 14: Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("contact.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("contact.desc")}</p>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href="mailto:privacy@dpmcalendar.com" className="text-violet-600 dark:text-violet-400 hover:underline">
                  privacy@dpmcalendar.com
                </a>
              </div>
            </div>
          </section>

          {/* Footer links */}
          <div className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t("seeAlso.terms")}
            </Link>
            <span>|</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              {t("seeAlso.home")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
