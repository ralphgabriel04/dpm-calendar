"use client";

import { useState } from "react";
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
  Cloud,
  Shield,
  GraduationCap,
  Rocket,
  Briefcase,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { LanguageToggle } from "@/components/language";

// Feature tabs data
const featureTabs = [
  {
    id: "calendrier",
    label: "Calendrier",
    icon: Calendar,
    color: "violet",
    features: [
      "Vues jour, semaine, mois et agenda",
      "Drag & drop intuitif des événements",
      "Synchronisation Google, Microsoft, Apple",
      "Événements récurrents et rappels",
    ],
  },
  {
    id: "taches",
    label: "Tâches",
    icon: CheckSquare,
    color: "emerald",
    features: [
      "Kanban board personnalisable",
      "Matrice Eisenhower (urgent/important)",
      "Sous-tâches et checklists",
      "Time blocking sur calendrier",
    ],
  },
  {
    id: "objectifs",
    label: "Objectifs",
    icon: Target,
    color: "orange",
    features: [
      "Définition d'objectifs SMART",
      "Suivi de progression visuel",
      "Jalons et étapes clés",
      "Liaison automatique avec les tâches",
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "blue",
    features: [
      "Rapports de productivité détaillés",
      "Temps par projet et catégorie",
      "Graphiques et tendances",
      "Export des données",
    ],
  },
  {
    id: "automatisation",
    label: "Automatisation",
    icon: Zap,
    color: "pink",
    features: [
      "Règles personnalisées (si X alors Y)",
      "Rappels intelligents",
      "Actions automatiques",
      "Intégrations externes",
    ],
  },
];

// Personas data
const personas = [
  {
    id: "etudiants",
    title: "Étudiants",
    icon: GraduationCap,
    color: "blue",
    description: "Optimisez votre temps d'étude et réussissez vos examens.",
    benefits: [
      "Planification des cours et révisions",
      "Suivi des devoirs et deadlines",
      "Sessions de travail Pomodoro",
      "Équilibre études / vie sociale",
    ],
  },
  {
    id: "entrepreneurs",
    title: "Entrepreneurs",
    icon: Rocket,
    color: "violet",
    description: "Développez votre entreprise avec une organisation optimale.",
    benefits: [
      "Gestion de projets multiples",
      "Suivi des objectifs business",
      "Planification des réunions clients",
      "Analytics de productivité",
    ],
  },
  {
    id: "freelances",
    title: "Freelances",
    icon: Briefcase,
    color: "emerald",
    description: "Gérez vos clients et projets en toute simplicité.",
    benefits: [
      "Time tracking par client",
      "Gestion multi-projets",
      "Rappels de deadlines",
      "Vue consolidée du planning",
    ],
  },
  {
    id: "equipes",
    title: "Équipes",
    icon: Users,
    color: "orange",
    description: "Collaborez efficacement et atteignez vos objectifs communs.",
    benefits: [
      "Calendriers partagés",
      "Attribution des tâches",
      "Suivi de progression d'équipe",
      "Synchronisation en temps réel",
    ],
  },
];

// Color mapping for dynamic styles - with light mode support
const colorStyles: Record<string, { bg: string; border: string; text: string; bgLight: string }> = {
  violet: {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.3)",
    text: "#8b5cf6",
    bgLight: "rgba(139, 92, 246, 0.2)",
  },
  emerald: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    text: "#10b981",
    bgLight: "rgba(16, 185, 129, 0.2)",
  },
  orange: {
    bg: "rgba(249, 115, 22, 0.1)",
    border: "rgba(249, 115, 22, 0.3)",
    text: "#f97316",
    bgLight: "rgba(249, 115, 22, 0.2)",
  },
  blue: {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.3)",
    text: "#3b82f6",
    bgLight: "rgba(59, 130, 246, 0.2)",
  },
  pink: {
    bg: "rgba(236, 72, 153, 0.1)",
    border: "rgba(236, 72, 153, 0.3)",
    text: "#ec4899",
    bgLight: "rgba(236, 72, 153, 0.2)",
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("calendrier");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo-full.png"
                alt="DPM Calendar"
                width={280}
                height={70}
                className="h-14 sm:h-16 md:h-20 w-auto dark:brightness-100 brightness-90"
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
      <section className="relative pt-28 sm:pt-36 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-600 dark:text-violet-300 mb-8">
              <Sparkles className="h-4 w-4" />
              La gestion du temps réinventée
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Votre temps,{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                mérite mieux
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Calendrier, tâches, habitudes et objectifs réunis dans une seule application.
              Synchronisez avec Google Calendar et Microsoft Outlook pour une productivité maximale.
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
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-lg font-semibold hover:bg-accent transition-all"
              >
                Découvrir les fonctionnalités
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold">100%</div>
                <div className="mt-1 text-sm text-muted-foreground">Gratuit</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold">∞</div>
                <div className="mt-1 text-sm text-muted-foreground">Calendriers illimités</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold">24/7</div>
                <div className="mt-1 text-sm text-muted-foreground">Accès mobile</div>
              </div>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-violet-500/10 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-muted-foreground">DPM Calendar</span>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 p-6">
                {/* Mock App UI */}
                <div className="flex h-full gap-4">
                  {/* Sidebar */}
                  <div className="w-1/5 space-y-3 rounded-lg border border-border bg-card p-3">
                    <div className="h-6 w-3/4 rounded bg-violet-500/20" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-2/3 rounded bg-muted" />
                      <div className="h-4 w-4/5 rounded bg-muted" />
                    </div>
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="h-4 w-1/2 rounded bg-muted" />
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-violet-500" />
                        <div className="h-3 w-20 rounded bg-muted" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <div className="h-3 w-16 rounded bg-muted" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <div className="h-3 w-24 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-32 rounded bg-violet-500/20" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded bg-muted" />
                        <div className="h-6 w-16 rounded bg-muted" />
                        <div className="h-6 w-16 rounded bg-violet-500/30" />
                      </div>
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                        <div key={day} className="text-center text-xs text-muted-foreground py-1">
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
                              ? "bg-muted text-foreground"
                              : "bg-muted/50 text-muted-foreground"
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

      {/* Features Section with Tabs */}
      <section id="features" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Tout ce dont vous avez besoin pour{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                rester organisé
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d&apos;outils pour gérer votre temps efficacement
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {featureTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const colors = colorStyles[tab.color];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? "shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }
                      : undefined
                  }
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {featureTabs.map((tab) => {
            if (tab.id !== activeTab) return null;
            const colors = colorStyles[tab.color];
            return (
              <div
                key={tab.id}
                className="rounded-2xl border p-8 md:p-12"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div
                      className="inline-flex h-14 w-14 items-center justify-center rounded-xl mb-6"
                      style={{ backgroundColor: colors.bgLight }}
                    >
                      <tab.icon className="h-7 w-7" style={{ color: colors.text }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{tab.label}</h3>
                    <ul className="space-y-4">
                      {tab.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full mt-0.5"
                            style={{ backgroundColor: colors.bgLight }}
                          >
                            <Check className="h-3.5 w-3.5" style={{ color: colors.text }} />
                          </div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="hidden md:block">
                    <div className="rounded-xl border border-border bg-card p-6 aspect-video flex items-center justify-center">
                      <tab.icon className="h-24 w-24 opacity-20" style={{ color: colors.text }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Comment ça{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                fonctionne
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Commencez à organiser votre vie en quelques minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connectez-vous",
                description:
                  "Créez un compte gratuit avec Google, Microsoft ou Apple en quelques secondes.",
                icon: Users,
              },
              {
                step: "2",
                title: "Synchronisez",
                description:
                  "Connectez vos calendriers existants pour avoir tout au même endroit.",
                icon: Cloud,
              },
              {
                step: "3",
                title: "Organisez",
                description:
                  "Planifiez vos tâches, suivez vos habitudes et atteignez vos objectifs.",
                icon: Sparkles,
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative inline-flex">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-6">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section - 4 cards */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Conçu pour{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                tous les profils
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Que vous soyez étudiant, entrepreneur, freelance ou en équipe, DPM Calendar s&apos;adapte à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {personas.map((persona) => {
              const colors = colorStyles[persona.color];
              return (
                <div
                  key={persona.id}
                  className="rounded-2xl border p-6 lg:p-8 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                    style={{ backgroundColor: colors.bgLight }}
                  >
                    <persona.icon className="h-6 w-6" style={{ color: colors.text }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{persona.title}</h3>
                  <p className="text-muted-foreground mb-6">{persona.description}</p>
                  <ul className="space-y-3">
                    {persona.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: colors.bgLight }}
                        >
                          <Check className="h-3 w-3" style={{ color: colors.text }} />
                        </div>
                        <span className="text-muted-foreground text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Connectez vos{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                calendriers préférés
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Synchronisez automatiquement avec vos outils existants
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
            {/* Google */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 hover:border-primary/50 transition-colors">
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
              <span className="font-medium">Google Calendar</span>
            </div>

            {/* Microsoft */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 hover:border-primary/50 transition-colors">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              <span className="font-medium">Microsoft Outlook</span>
            </div>

            {/* Apple */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 hover:border-primary/50 transition-colors">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="font-medium">Apple Calendar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/50 p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Vos données sont en sécurité</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Nous utilisons le chiffrement de bout en bout et ne vendons jamais vos données.
              Votre vie privée est notre priorité.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Chiffrement SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Données chiffrées</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Pas de vente de données</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
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
            Prêt à reprendre le contrôle de{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              votre temps
            </span>
            ?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Rejoignez des milliers d&apos;utilisateurs qui ont transformé leur productivité avec DPM Calendar.
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
          <p className="mt-4 text-sm text-muted-foreground">
            Gratuit pour toujours • Pas de carte de crédit requise
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Footer Top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <Image
                src="/logo-full.png"
                alt="DPM Calendar"
                width={200}
                height={50}
                className="h-12 sm:h-14 w-auto mb-4 dark:brightness-100 brightness-90"
              />
              <p className="text-sm text-muted-foreground">
                Votre assistant de productivité intelligent pour gérer votre temps efficacement.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Intégrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Guide d&apos;utilisation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="mailto:support@dpmcalendar.com" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    CGU
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DPM Calendar. Tous droits réservés.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/dpmcalendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/dpmcalendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/dpmcalendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
