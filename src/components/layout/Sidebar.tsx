"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
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
  Grid3X3,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { ThemeToggle } from "@/components/theme";
import { LanguageToggle } from "@/components/language";

// Types
interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  id: string;
  titleKey: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

// Main navigation (always visible)
const mainNavigation: NavItem[] = [
  { nameKey: "home", href: "/home", icon: Home },
  { nameKey: "today", href: "/planner", icon: LayoutDashboard },
  { nameKey: "calendar", href: "/calendar", icon: Calendar },
];

// Grouped navigation sections
const navSections: NavSection[] = [
  {
    id: "daily-rituals",
    titleKey: "sections.dailyRituals",
    defaultExpanded: true,
    items: [
      { nameKey: "dailyPlanning", href: "/daily-planning", icon: Sunrise },
      { nameKey: "focus", href: "/planner?focus=true", icon: Target },
    ],
  },
  {
    id: "weekly-rituals",
    titleKey: "sections.weeklyRituals",
    defaultExpanded: false,
    items: [
      { nameKey: "weekReview", href: "/planner?view=week", icon: CalendarDays },
      { nameKey: "weeklyGoals", href: "/goals", icon: Star },
    ],
  },
  {
    id: "productivity",
    titleKey: "sections.productivity",
    defaultExpanded: true,
    items: [
      { nameKey: "tasks", href: "/tasks", icon: CheckSquare },
      { nameKey: "matrix", href: "/matrix", icon: Grid3X3 },
      { nameKey: "habits", href: "/habits", icon: Flame },
      { nameKey: "goals", href: "/goals", icon: Target },
    ],
  },
  {
    id: "automation",
    titleKey: "sections.automation",
    defaultExpanded: false,
    items: [
      { nameKey: "rules", href: "/rules", icon: Shield },
    ],
  },
  {
    id: "insights",
    titleKey: "sections.insights",
    defaultExpanded: true,
    items: [
      { nameKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { nameKey: "analytics", href: "/analytics", icon: BarChart3 },
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
  t,
}: {
  section: NavSection;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  sidebarCollapsed: boolean;
  t: (key: string) => string;
}) {
  // In collapsed mode, just show icons without section headers
  if (sidebarCollapsed) {
    return (
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
          const itemName = t(item.nameKey);
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              title={itemName}
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
        <span>{t(section.titleKey)}</span>
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
          const itemName = t(item.nameKey);
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ml-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{itemName}</span>
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
  const t = useTranslations("sidebar");

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
              "flex items-center gap-2 transition-opacity duration-300",
              sidebarCollapsed && "lg:hidden"
            )}
          >
            <Image
              src="/logo.png"
              alt="DPM Calendar"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12"
              priority
            />
            <span className="font-bold text-lg text-foreground">DPM Calendar</span>
          </Link>
          {/* Collapsed logo */}
          {sidebarCollapsed && (
            <Link href="/" className="hidden lg:flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="DPM Calendar"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
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
              const itemName = t(item.nameKey);
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  title={sidebarCollapsed ? itemName : undefined}
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
                    {itemName}
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
                t={t}
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
            title={sidebarCollapsed ? t("settings") : undefined}
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
              {t("settings")}
            </span>
          </Link>
        </div>

        {/* Desktop collapse toggle */}
        <div className="hidden lg:flex justify-end p-2 border-t">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            title={sidebarCollapsed ? t("openMenu") : t("closeMenu")}
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
              {t("version")}
            </div>
            <div className="flex items-center gap-1">
              <LanguageToggle collapsed={sidebarCollapsed} />
              <ThemeToggle />
            </div>
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
