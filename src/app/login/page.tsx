"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Calendar, CheckSquare, Target, BarChart3, Github, Loader2, Building2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: "/calendar" });
    } catch {
      setLoadingProvider(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await signIn("credentials", { email, callbackUrl: "/calendar" });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="DPM Calendar"
              width={56}
              height={56}
              className="h-12 w-12 sm:h-14 sm:w-14"
              priority
            />
            <span className="text-xl sm:text-2xl font-bold">DPM Calendar</span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenue !
            </h1>
            <p className="mt-2 text-muted-foreground">
              Connectez-vous ou créez un compte pour commencer.
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <Button
              onClick={() => handleOAuthSignIn("google")}
              variant="outline"
              className="h-12 w-full justify-center gap-3 text-base font-medium"
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {loadingProvider === "google" ? "Connexion..." : "Continuer avec Google"}
            </Button>

            {/* Microsoft */}
            <Button
              onClick={() => handleOAuthSignIn("microsoft-entra-id")}
              variant="outline"
              className="h-12 w-full justify-center gap-3 text-base font-medium"
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "microsoft-entra-id" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#00A4EF" d="M1 13h10v10H1z" />
                  <path fill="#7FBA00" d="M13 1h10v10H13z" />
                  <path fill="#FFB900" d="M13 13h10v10H13z" />
                </svg>
              )}
              {loadingProvider === "microsoft-entra-id" ? "Connexion..." : "Continuer avec Microsoft"}
            </Button>

            {/* GitHub */}
            <Button
              onClick={() => handleOAuthSignIn("github")}
              variant="outline"
              className="h-12 w-full justify-center gap-3 text-base font-medium"
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "github" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Github className="h-5 w-5" />
              )}
              {loadingProvider === "github" ? "Connexion..." : "Continuer avec GitHub"}
            </Button>

            {/* Apple */}
            <Button
              onClick={() => handleOAuthSignIn("apple")}
              variant="outline"
              className="h-12 w-full justify-center gap-3 text-base font-medium"
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "apple" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
              {loadingProvider === "apple" ? "Connexion..." : "Continuer avec Apple"}
            </Button>

            {/* SSO Enterprise - Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-dashed" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">
                  SSO Entreprise
                </span>
              </div>
            </div>

            {/* SSO Enterprise */}
            <Button
              onClick={() => handleOAuthSignIn("sso")}
              variant="outline"
              className="h-12 w-full justify-center gap-3 text-base font-medium border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/5"
              disabled={loadingProvider !== null}
            >
              {loadingProvider === "sso" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Building2 className="h-5 w-5 text-violet-500" />
              )}
              {loadingProvider === "sso" ? "Connexion..." : "Connexion SSO"}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                ou avec votre email
              </span>
            </div>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
                disabled={isLoading || loadingProvider !== null}
              />
            </div>
            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={isLoading || !email || loadingProvider !== null}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Continuer avec l'email"
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>

          {/* Help Text */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Besoin d&apos;aide ?{" "}
            <a href="mailto:support@dpmcalendar.com" className="text-primary hover:underline">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - App Showcase */}
      <div className="hidden bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Gérez votre temps intelligemment
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Calendrier, tâches, habitudes et objectifs réunis dans une seule application.
          </p>

          {/* Feature Cards */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card/80 p-4 text-left backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="mt-3 font-semibold">Calendrier</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Vues jour, semaine, mois avec drag & drop
              </p>
            </div>

            <div className="rounded-xl border bg-card/80 p-4 text-left backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckSquare className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="mt-3 font-semibold">Tâches</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Kanban, time blocking et priorités
              </p>
            </div>

            <div className="rounded-xl border bg-card/80 p-4 text-left backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-3 font-semibold">Objectifs</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Suivez vos progrès et atteignez vos buts
              </p>
            </div>

            <div className="rounded-xl border bg-card/80 p-4 text-left backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="mt-3 font-semibold">Analytics</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Visualisez votre productivité
              </p>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-12 overflow-hidden rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-muted-foreground">DPM Calendar</span>
            </div>
            <div className="relative aspect-video bg-gradient-to-br from-background to-muted/50 p-4">
              {/* Mock Calendar UI */}
              <div className="flex h-full gap-3">
                {/* Sidebar Mock */}
                <div className="w-1/4 space-y-2 rounded-lg border bg-card p-2">
                  <div className="h-4 w-3/4 rounded bg-primary/20" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
                {/* Calendar Grid Mock */}
                <div className="flex-1 rounded-lg border bg-card p-2">
                  <div className="mb-2 flex justify-between">
                    <div className="h-4 w-24 rounded bg-primary/20" />
                    <div className="flex gap-1">
                      <div className="h-4 w-8 rounded bg-muted" />
                      <div className="h-4 w-8 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded text-[6px] flex items-center justify-center ${
                          i === 15 ? "bg-primary text-primary-foreground" : "bg-muted/50"
                        }`}
                      >
                        {(i % 31) + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <p className="mt-8 text-sm text-muted-foreground">
            Synchronisation avec Google Calendar et Microsoft Outlook
          </p>
        </div>
      </div>
    </div>
  );
}
