"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  Settings,
  Menu,
  X,
  Flame,
  Target,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  LayoutDashboard,
  Sunrise,
  Sunset,
  Star,
  CalendarDays,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { ThemeToggle } from "@/components/theme";

// Types
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

// Main navigation (always visible)
const mainNavigation: NavItem[] = [
  { name: "Accueil", href: "/home", icon: Home },
  { name: "Aujourd'hui", href: "/planner", icon: LayoutDashboard },
  { name: "Calendrier", href: "/calendar", icon: Calendar },
];

// Grouped navigation sections
const navSections: NavSection[] = [
  {
    id: "daily-rituals",
    title: "ROUTINES QUOTIDIENNES",
    defaultExpanded: true,
    items: [
      { name: "Planification du jour", href: "/daily-planning", icon: Sunrise },
      { name: "Focus", href: "/planner?focus=true", icon: Target },
    ],
  },
  {
    id: "weekly-rituals",
    title: "ROUTINES HEBDOMADAIRES",
    defaultExpanded: false,
    items: [
      { name: "Revue de la semaine", href: "/planner?view=week", icon: CalendarDays },
      { name: "Objectifs hebdo", href: "/goals", icon: Star },
    ],
  },
  {
    id: "productivity",
    title: "PRODUCTIVITE",
    defaultExpanded: true,
    items: [
      { name: "Taches", href: "/tasks", icon: CheckSquare },
      { name: "Habitudes", href: "/habits", icon: Flame },
      { name: "Objectifs", href: "/goals", icon: Target },
    ],
  },
  {
    id: "automation",
    title: "AUTOMATISATION",
    defaultExpanded: false,
    items: [
      { name: "Regles", href: "/rules", icon: Shield },
    ],
  },
  {
    id: "insights",
    title: "ANALYSES",
    defaultExpanded: false,
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
];

// Collapsible Section Component
function CollapsibleSection({
  section,
  isExpanded,
  onToggle,
  pathname,
  sidebarCollapsed,
}: {
  section: NavSection;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  sidebarCollapsed: boolean;
}) {
  // In collapsed mode, just show icons without section headers
  if (sidebarCollapsed) {
    return (
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={cn(
                "flex items-center justify-center rounded-md p-3 transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Section header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <span>{section.title}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            !isExpanded && "-rotate-90"
          )}
        />
      </button>

      {/* Section items */}
      <div
        className={cn(
          "space-y-1 overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {section.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ml-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  // Section expanded states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navSections.forEach((section) => {
      initial[section.id] = section.defaultExpanded ?? true;
    });
    return initial;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300 ease-out",
          // Mobile: slide in/out
          sidebarCollapsed ? "-translate-x-full" : "translate-x-0",
          // Desktop: static positioning, width changes
          "lg:static lg:translate-x-0",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile always full width when visible
          "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b transition-all duration-300",
            sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-between px-4"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center transition-opacity duration-300",
              sidebarCollapsed && "lg:hidden"
            )}
          >
            {/* Light mode logo */}
            <Image
              src="/light-mode-logo.png"
              alt="DPM Calendar"
              width={200}
              height={50}
              className="h-12 w-auto dark:hidden"
              priority
            />
            {/* Dark mode logo */}
            <Image
              src="/logo-dark-mode.png"
              alt="DPM Calendar"
              width={200}
              height={50}
              className="h-12 w-auto hidden dark:block"
              priority
            />
          </Link>
          {/* Collapsed logo - icon only */}
          {sidebarCollapsed && (
            <Link href="/" className="hidden lg:flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
            </Link>
          )}
          {/* Mobile close button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            sidebarCollapsed ? "lg:p-2" : "p-4"
          )}
        >
          {/* Main navigation (always visible) */}
          <div className="space-y-1 mb-4">
            {mainNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center rounded-md text-sm font-medium transition-all duration-200",
                    sidebarCollapsed
                      ? "lg:justify-center lg:px-0 lg:py-3 gap-0 px-3 py-2 gap-3"
                      : "gap-3 px-3 py-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      sidebarCollapsed && "lg:h-5 lg:w-5"
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-300",
                      sidebarCollapsed && "lg:hidden"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          {!sidebarCollapsed && <div className="border-t my-4" />}

          {/* Collapsible sections */}
          <div className="space-y-4">
            {navSections.map((section) => (
              <CollapsibleSection
                key={section.id}
                section={section}
                isExpanded={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
                pathname={pathname}
                sidebarCollapsed={sidebarCollapsed}
              />
            ))}
          </div>
        </nav>

        {/* Settings link */}
        <div
          className={cn(
            "border-t transition-all duration-300",
            sidebarCollapsed ? "lg:p-2" : "px-4 py-2"
          )}
        >
          <Link
            href="/settings"
            title={sidebarCollapsed ? "Parametres" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-all duration-200",
              sidebarCollapsed
                ? "lg:justify-center lg:px-0 lg:py-3 gap-0 px-3 py-2 gap-3"
                : "gap-3 px-3 py-2",
              pathname.startsWith("/settings")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings
              className={cn(
                "h-5 w-5 flex-shrink-0",
                sidebarCollapsed && "lg:h-5 lg:w-5"
              )}
            />
            <span
              className={cn(
                "transition-all duration-300",
                sidebarCollapsed && "lg:hidden"
              )}
            >
              Parametres
            </span>
          </Link>
        </div>

        {/* Desktop collapse toggle */}
        <div className="hidden lg:flex justify-end p-2 border-t">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            title={sidebarCollapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "border-t transition-all duration-300",
            sidebarCollapsed ? "lg:p-2" : "p-4"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              sidebarCollapsed ? "lg:justify-center" : "justify-between"
            )}
          >
            <div
              className={cn(
                "text-xs text-muted-foreground transition-all duration-300",
                sidebarCollapsed && "lg:hidden"
              )}
            >
              DPM Calendar v0.1.0
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger() {
  const { toggleSidebar } = useUIStore();

  return (
    <button
      onClick={toggleSidebar}
      className="p-2 rounded-md hover:bg-accent"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
