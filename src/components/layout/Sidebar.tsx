"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { ThemeToggle } from "@/components/theme";

import { Home, LayoutDashboard } from "lucide-react";

const navigation = [
  { name: "Accueil", href: "/home", icon: Home },
  { name: "Planner", href: "/planner", icon: LayoutDashboard },
  { name: "Calendrier", href: "/calendar", icon: Calendar },
  { name: "Tâches", href: "/tasks", icon: CheckSquare },
  { name: "Habitudes", href: "/habits", icon: Flame },
  { name: "Objectifs", href: "/goals", icon: Target },
  { name: "Règles", href: "/rules", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

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
        <div className={cn(
          "flex h-16 items-center border-b transition-all duration-300",
          sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-between px-4"
        )}>
          <Link href="/" className={cn(
            "flex items-center transition-opacity duration-300",
            sidebarCollapsed && "lg:hidden"
          )}>
            {/* Light mode logo */}
            <Image
              src="/light-mode-logo.png"
              alt="DPM Calendar"
              width={160}
              height={40}
              className="h-10 w-auto dark:hidden"
              priority
            />
            {/* Dark mode logo */}
            <Image
              src="/logo-dark-mode.png"
              alt="DPM Calendar"
              width={160}
              height={40}
              className="h-10 w-auto hidden dark:block"
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
        <nav className={cn(
          "flex-1 space-y-1 transition-all duration-300",
          sidebarCollapsed ? "lg:p-2" : "p-4"
        )}>
          {navigation.map((item) => {
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
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  sidebarCollapsed && "lg:h-5 lg:w-5"
                )} />
                <span className={cn(
                  "transition-all duration-300",
                  sidebarCollapsed && "lg:hidden"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

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
        <div className={cn(
          "border-t transition-all duration-300",
          sidebarCollapsed ? "lg:p-2" : "p-4"
        )}>
          <div className={cn(
            "flex items-center",
            sidebarCollapsed ? "lg:justify-center" : "justify-between"
          )}>
            <div className={cn(
              "text-xs text-muted-foreground transition-all duration-300",
              sidebarCollapsed && "lg:hidden"
            )}>
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
