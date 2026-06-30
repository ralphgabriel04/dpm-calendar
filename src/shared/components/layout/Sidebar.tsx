"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
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
  CreditCard,
  Grid3X3,
  Calendar,
  StickyNote,
  Layers,
  Plug,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useLayoutStore } from "@/stores/layout.store";
import { useIsMobile } from "@/shared/hooks";
import { ThemeToggle } from "@/shared/components/theme";
import { LanguageToggle } from "@/shared/components/language";

// Types
//
// Each nav item carries EITHER an i18n `nameKey` (translated via the existing
// `sidebar` namespace) OR a literal `label` (for routes that have no i18n key
// yet — notes, spaces, integrations, billing). We never invent i18n keys here.
interface NavItem {
  nameKey?: string;
  label?: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  id: string;
  // Section title is a literal (matches the prototype's uppercase group titles);
  // some reuse an existing i18n key, others are literal where none exists.
  titleKey?: string;
  title?: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

// Main navigation (always visible — no group header), maps to the prototype's NAV_MAIN.
const mainNavigation: NavItem[] = [
  { nameKey: "home", href: "/home", icon: Home },
  { nameKey: "calendar", href: "/calendar", icon: Calendar },
];

// Grouped navigation sections — prototype-style groups.
// Route → group mapping is the spec contract; every protected route is linked.
const navSections: NavSection[] = [
  {
    id: "daily",
    titleKey: "sections.dailyRituals",
    defaultExpanded: true,
    items: [
      { nameKey: "dailyPlanning", href: "/daily-planning", icon: Sunrise },
      { nameKey: "today", href: "/planner", icon: LayoutDashboard },
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
    id: "notes-spaces",
    title: "NOTES & SPACES",
    defaultExpanded: true,
    items: [
      { label: "Notes", href: "/notes", icon: StickyNote },
      { label: "Spaces", href: "/spaces", icon: Layers },
    ],
  },
  {
    id: "automation",
    titleKey: "sections.automation",
    defaultExpanded: false,
    items: [{ nameKey: "rules", href: "/rules", icon: Shield }],
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
  {
    id: "connect",
    title: "CONNECT",
    defaultExpanded: true,
    items: [{ label: "Integrations", href: "/integrations", icon: Plug }],
  },
  {
    id: "account",
    title: "ACCOUNT",
    defaultExpanded: true,
    items: [
      { label: "Plan & Billing", href: "/billing", icon: CreditCard },
      { nameKey: "settings", href: "/settings", icon: Settings },
    ],
  },
];

// Resolve a nav item's display label from its i18n key or literal label.
function itemLabel(item: NavItem, t: (key: string) => string): string {
  return item.nameKey ? t(item.nameKey) : (item.label ?? "");
}

function sectionTitle(section: NavSection, t: (key: string) => string): string {
  return section.titleKey ? t(section.titleKey) : (section.title ?? "");
}

// Active-state logic: a route's base path (sans query) prefix-matches the pathname.
function isItemActive(href: string, pathname: string): boolean {
  const base = href.split("?")[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

// Single nav row — violet "pill" when active (matches prototype's solid accent).
function NavRow({
  item,
  label,
  active,
  collapsed,
  indent = false,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  collapsed: boolean;
  indent?: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={label}
        className={cn(
          "flex h-10 items-center justify-center rounded-lg transition-colors duration-150",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150",
        indent && "ml-1",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-[18px] w-[18px] flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {item.badge && (
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

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
  // In collapsed (rail) mode, show icon-only rows without group headers.
  if (sidebarCollapsed) {
    return (
      <div className="space-y-1">
        {section.items.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            label={itemLabel(item, t)}
            active={isItemActive(item.href, pathname)}
            collapsed
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {/* Section header — uppercase muted title + chevron */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{sectionTitle(section, t)}</span>
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
          "space-y-0.5 overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {section.items.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            label={itemLabel(item, t)}
            active={isItemActive(item.href, pathname)}
            collapsed={false}
            indent
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Use UI store for mobile overlay behavior
  const { sidebarCollapsed: mobileMenuOpen, toggleSidebar: toggleMobileMenu } = useUIStore();

  // Use layout store for desktop collapse state
  const { leftSidebarCollapsed, toggleLeftSidebar } = useLayoutStore();

  // On mobile, use UI store; on desktop, use layout store
  const sidebarCollapsed = isMobile ? !mobileMenuOpen : leftSidebarCollapsed;
  const toggleSidebar = isMobile ? toggleMobileMenu : toggleLeftSidebar;

  const t = useTranslations("sidebar");
  const { resolvedTheme } = useTheme();

  // Use dark mode logo when theme is dark
  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";

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
          "flex flex-col bg-card border-r transition-all duration-300 ease-out",
          // Mobile: fixed positioning, slide in/out
          isMobile && "fixed inset-y-0 left-0 z-50 w-64",
          isMobile && (sidebarCollapsed ? "-translate-x-full" : "translate-x-0"),
          // Desktop: fill the Panel container
          !isMobile && "relative w-full h-full"
        )}
      >
        {/* Header — brand/logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b transition-all duration-300",
            sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-between px-4"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 transition-opacity duration-300",
              sidebarCollapsed && "lg:hidden"
            )}
          >
            <Image
              src={logoSrc}
              alt="DPM Calendar"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12"
              priority
            />
            <span className="text-lg font-bold text-foreground">DPM Calendar</span>
          </Link>
          {/* Collapsed logo */}
          {sidebarCollapsed && (
            <Link href="/" className="hidden lg:flex items-center justify-center">
              <Image
                src={logoSrc}
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
            className="rounded-md p-2 hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            sidebarCollapsed ? "lg:p-2" : "p-3"
          )}
        >
          {/* Main navigation (always visible, no group header) */}
          <div className="space-y-0.5">
            {mainNavigation.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                label={itemLabel(item, t)}
                active={isItemActive(item.href, pathname)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>

          {/* Divider between main nav and grouped sections (expanded only) */}
          {sidebarCollapsed ? (
            <div className="mx-auto my-2 h-px w-7 bg-border lg:block" />
          ) : (
            <div className="my-3 border-t" />
          )}

          {/* Collapsible sections */}
          <div className={cn(sidebarCollapsed ? "space-y-2" : "space-y-3")}>
            {navSections.map((section, i) => (
              <div key={section.id}>
                <CollapsibleSection
                  section={section}
                  isExpanded={expandedSections[section.id]}
                  onToggle={() => toggleSection(section.id)}
                  pathname={pathname}
                  sidebarCollapsed={sidebarCollapsed}
                  t={t}
                />
                {/* Rail dividers between groups when collapsed */}
                {sidebarCollapsed && i < navSections.length - 1 && (
                  <div className="mx-auto mt-2 h-px w-7 bg-border" />
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Desktop collapse toggle */}
        <div className="hidden justify-end border-t p-2 lg:flex">
          <button
            onClick={toggleSidebar}
            className="rounded-full p-2 transition-colors hover:bg-accent"
            title={sidebarCollapsed ? t("openMenu") : t("closeMenu")}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Footer — version + language + theme toggle */}
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
      className="rounded-md p-2 hover:bg-accent"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
