import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CheckSquare,
  Target,
  BarChart3,
  Zap,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Smartphone,
  Cloud,
  Shield,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo-full.png"
                alt="DPM Calendar"
                width={200}
                height={50}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-8">
              <Sparkles className="h-4 w-4" />
              La gestion du temps reinventee
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Votre temps,{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                optimise
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Calendrier, taches, habitudes et objectifs reunis dans une seule application.
              Synchronisez avec Google Calendar et Microsoft Outlook pour une productivite maximale.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 transition-all"
              >
                Decouvrir les fonctionnalites
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">100%</div>
                <div className="mt-1 text-sm text-slate-400">Gratuit</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">∞</div>
                <div className="mt-1 text-sm text-slate-400">Calendriers illimites</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">24/7</div>
                <div className="mt-1 text-sm text-slate-400">Acces mobile</div>
              </div>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-2 shadow-2xl shadow-violet-500/10 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-slate-500">DPM Calendar</span>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                {/* Mock App UI */}
                <div className="flex h-full gap-4">
                  {/* Sidebar */}
                  <div className="w-1/5 space-y-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    <div className="h-6 w-3/4 rounded bg-violet-500/20" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-slate-700" />
                      <div className="h-4 w-2/3 rounded bg-slate-700" />
                      <div className="h-4 w-4/5 rounded bg-slate-700" />
                    </div>
                    <div className="pt-3 border-t border-slate-700 space-y-2">
                      <div className="h-4 w-1/2 rounded bg-slate-700" />
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-violet-500" />
                        <div className="h-3 w-20 rounded bg-slate-700" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <div className="h-3 w-16 rounded bg-slate-700" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <div className="h-3 w-24 rounded bg-slate-700" />
                      </div>
                    </div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-32 rounded bg-violet-500/20" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded bg-slate-700" />
                        <div className="h-6 w-16 rounded bg-slate-700" />
                        <div className="h-6 w-16 rounded bg-violet-500/30" />
                      </div>
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                        <div key={day} className="text-center text-xs text-slate-500 py-1">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded flex items-center justify-center text-xs ${
                            i === 15
                              ? "bg-violet-500 text-white"
                              : i === 18 || i === 22
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-800/50 text-slate-500"
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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Tout ce dont vous avez besoin pour{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                rester organise
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Une suite complete d outils pour gerer votre temps efficacement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            {[
              {
                icon: Calendar,
                title: "Calendrier intelligent",
                description:
                  "Vues jour, semaine et mois avec drag & drop. Synchronisez avec Google et Microsoft.",
                color: "violet",
              },
              {
                icon: CheckSquare,
                title: "Gestion des taches",
                description:
                  "Kanban board, time blocking et priorites. Planifiez vos taches directement sur le calendrier.",
                color: "green",
              },
              {
                icon: Target,
                title: "Suivi des objectifs",
                description:
                  "Definissez vos objectifs et suivez vos progres. Restez motive avec des indicateurs visuels.",
                color: "orange",
              },
              {
                icon: Zap,
                title: "Habitudes quotidiennes",
                description:
                  "Construisez de bonnes habitudes et suivez vos streaks. Visualisez votre progression.",
                color: "yellow",
              },
              {
                icon: BarChart3,
                title: "Analytics detailles",
                description:
                  "Analysez votre productivite avec des rapports detailles et des graphiques intuitifs.",
                color: "blue",
              },
              {
                icon: Clock,
                title: "Regles automatiques",
                description:
                  "Automatisez votre planning avec des regles intelligentes et des rappels personnalises.",
                color: "pink",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 hover:bg-slate-900 transition-all"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}-500/10 text-${feature.color}-400 mb-4`}
                  style={{
                    backgroundColor:
                      feature.color === "violet"
                        ? "rgba(139, 92, 246, 0.1)"
                        : feature.color === "green"
                        ? "rgba(34, 197, 94, 0.1)"
                        : feature.color === "orange"
                        ? "rgba(249, 115, 22, 0.1)"
                        : feature.color === "yellow"
                        ? "rgba(234, 179, 8, 0.1)"
                        : feature.color === "blue"
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(236, 72, 153, 0.1)",
                    color:
                      feature.color === "violet"
                        ? "#a78bfa"
                        : feature.color === "green"
                        ? "#4ade80"
                        : feature.color === "orange"
                        ? "#fb923c"
                        : feature.color === "yellow"
                        ? "#facc15"
                        : feature.color === "blue"
                        ? "#60a5fa"
                        : "#f472b6",
                  }}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Comment ca{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                fonctionne
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Commencez a organiser votre vie en quelques minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connectez-vous",
                description:
                  "Creez un compte gratuit avec Google, Microsoft ou Apple en quelques secondes.",
                icon: Users,
              },
              {
                step: "2",
                title: "Synchronisez",
                description:
                  "Connectez vos calendriers existants pour avoir tout au meme endroit.",
                icon: Cloud,
              },
              {
                step: "3",
                title: "Organisez",
                description:
                  "Planifiez vos taches, suivez vos habitudes et atteignez vos objectifs.",
                icon: Sparkles,
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative inline-flex">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 mb-6">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Professionals */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Pour les professionnels</h3>
              <p className="text-slate-400 mb-6">
                Optimisez votre journee de travail et atteignez vos objectifs professionnels.
              </p>
              <ul className="space-y-3">
                {[
                  "Planification intelligente des reunions",
                  "Time blocking pour le travail profond",
                  "Integration avec vos outils existants",
                  "Rapports de productivite detailles",
                  "Synchronisation multi-appareils",
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20">
                      <Check className="h-3 w-3 text-violet-400" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Personal */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-6">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Pour la vie personnelle</h3>
              <p className="text-slate-400 mb-6">
                Equilibrez votre vie et construisez les habitudes qui comptent.
              </p>
              <ul className="space-y-3">
                {[
                  "Suivi des habitudes quotidiennes",
                  "Objectifs personnels et progression",
                  "Equilibre vie pro / vie perso",
                  "Rappels et notifications intelligents",
                  "Vue unifiee de votre vie",
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20">
                      <Check className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Connectez vos{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                calendriers preferes
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Synchronisez automatiquement avec vos outils existants
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            {/* Google */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-4">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
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
              <span className="font-medium text-white">Google Calendar</span>
            </div>

            {/* Microsoft */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-4">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              <span className="font-medium text-white">Microsoft Outlook</span>
            </div>

            {/* Apple */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-4">
              <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="font-medium text-white">Apple Calendar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Vos donnees sont en securite</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Nous utilisons le chiffrement de bout en bout et ne vendons jamais vos donnees.
              Votre vie privee est notre priorite.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Chiffrement SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Donnees chiffrees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Pas de vente de donnees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Conforme RGPD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Pret a reprendre le controle de{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              votre temps
            </span>
            ?
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Rejoignez des milliers d utilisateurs qui ont transforme leur productivite avec DPM Calendar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Gratuit pour toujours • Pas de carte de credit requise
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <Image
                src="/logo-full.png"
                alt="DPM Calendar"
                width={160}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/login" className="hover:text-white transition-colors">
                Connexion
              </Link>
              <a href="#features" className="hover:text-white transition-colors">
                Fonctionnalites
              </a>
              <a href="mailto:support@dpmcalendar.com" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} DPM Calendar. Tous droits reserves.
          </div>
        </div>
      </footer>
    </div>
  );
}
