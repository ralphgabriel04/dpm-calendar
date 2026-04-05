"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowLeft, FileText, Mail } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme";
import { LanguageToggle } from "@/shared/components/language";

export default function TermsOfService() {
  const t = useTranslations("terms");

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
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 mb-4">
              <FileText className="h-4 w-4" />
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

          {/* Section 1: Definitions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("definitions.title")}</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>&quot;{t("definitions.service.term")}&quot;</strong>: {t("definitions.service.desc")}</li>
              <li><strong>&quot;{t("definitions.user.term")}&quot;</strong>: {t("definitions.user.desc")}</li>
              <li><strong>&quot;{t("definitions.account.term")}&quot;</strong>: {t("definitions.account.desc")}</li>
              <li><strong>&quot;{t("definitions.content.term")}&quot;</strong>: {t("definitions.content.desc")}</li>
            </ul>
          </section>

          {/* Section 2: Service Description */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("serviceDesc.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("serviceDesc.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("serviceDesc.calendar")}</li>
              <li>{t("serviceDesc.tasks")}</li>
              <li>{t("serviceDesc.habits")}</li>
              <li>{t("serviceDesc.goals")}</li>
              <li>{t("serviceDesc.sync")}</li>
              <li>{t("serviceDesc.analytics")}</li>
            </ul>
          </section>

          {/* Section 3: Account */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("account.title")}</h2>

            <h3 className="font-medium mb-2">{t("account.creation.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("account.creation.desc")}</p>

            <h3 className="font-medium mb-2">{t("account.responsibilities.title")}</h3>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>{t("account.responsibilities.accurate")}</li>
              <li>{t("account.responsibilities.secure")}</li>
              <li>{t("account.responsibilities.notify")}</li>
              <li>{t("account.responsibilities.activity")}</li>
            </ul>

            <h3 className="font-medium mb-2">{t("account.age.title")}</h3>
            <p className="text-muted-foreground">{t("account.age.desc")}</p>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("acceptableUse.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("acceptableUse.intro")}</p>

            <h3 className="font-medium mb-2">{t("acceptableUse.prohibited.title")}</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t("acceptableUse.prohibited.illegal")}</li>
              <li>{t("acceptableUse.prohibited.harmful")}</li>
              <li>{t("acceptableUse.prohibited.infringe")}</li>
              <li>{t("acceptableUse.prohibited.interfere")}</li>
              <li>{t("acceptableUse.prohibited.reverse")}</li>
              <li>{t("acceptableUse.prohibited.automated")}</li>
              <li>{t("acceptableUse.prohibited.impersonate")}</li>
              <li>{t("acceptableUse.prohibited.spam")}</li>
            </ul>
          </section>

          {/* Section 5: User Content */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("userContent.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("userContent.ownership")}</p>
            <p className="text-muted-foreground mb-4">{t("userContent.license")}</p>
            <p className="text-muted-foreground">{t("userContent.responsibility")}</p>
          </section>

          {/* Section 6: Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("ip.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("ip.ownership")}</p>
            <p className="text-muted-foreground mb-4">{t("ip.license")}</p>
            <p className="text-muted-foreground">{t("ip.restrictions")}</p>
          </section>

          {/* Section 7: Third-Party Services */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("thirdParty.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("thirdParty.intro")}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Google Calendar</li>
              <li>Microsoft Outlook</li>
              <li>GitHub</li>
              <li>Apple Calendar</li>
            </ul>
            <p className="text-muted-foreground mt-4">{t("thirdParty.terms")}</p>
          </section>

          {/* Section 8: Service Availability */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("availability.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("availability.asIs")}</p>
            <p className="text-muted-foreground">{t("availability.maintenance")}</p>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("liability.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("liability.disclaimer")}</p>
            <p className="text-muted-foreground mb-4">{t("liability.limitation")}</p>
            <p className="text-muted-foreground">{t("liability.exclusions")}</p>
          </section>

          {/* Section 10: Indemnification */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("indemnification.title")}</h2>
            <p className="text-muted-foreground">{t("indemnification.desc")}</p>
          </section>

          {/* Section 11: Termination */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("termination.title")}</h2>

            <h3 className="font-medium mb-2">{t("termination.byUser.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("termination.byUser.desc")}</p>

            <h3 className="font-medium mb-2">{t("termination.byUs.title")}</h3>
            <p className="text-muted-foreground mb-4">{t("termination.byUs.desc")}</p>

            <h3 className="font-medium mb-2">{t("termination.effects.title")}</h3>
            <p className="text-muted-foreground">{t("termination.effects.desc")}</p>
          </section>

          {/* Section 12: Changes to Terms */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("changes.title")}</h2>
            <p className="text-muted-foreground">{t("changes.desc")}</p>
          </section>

          {/* Section 13: Governing Law */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("law.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("law.jurisdiction")}</p>
            <p className="text-muted-foreground">{t("law.disputes")}</p>
          </section>

          {/* Section 14: Severability */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("severability.title")}</h2>
            <p className="text-muted-foreground">{t("severability.desc")}</p>
          </section>

          {/* Section 15: Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{t("contact.title")}</h2>
            <p className="text-muted-foreground mb-4">{t("contact.desc")}</p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p><strong>DPM Inc.</strong></p>
              <p className="text-sm text-muted-foreground">{t("contact.address")}</p>
              <div className="flex items-center gap-3 pt-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href="mailto:legal@dpmcalendar.com" className="text-violet-600 dark:text-violet-400 hover:underline">
                  legal@dpmcalendar.com
                </a>
              </div>
            </div>
          </section>

          {/* Footer links */}
          <div className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t("seeAlso.privacy")}
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
