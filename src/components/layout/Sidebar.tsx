"use client";

import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { ThemeToggle } from "@/components/theme";

const navigation = [
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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">DPM Calendar</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
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
      className="p-2 rounded-md hover:bg-accent lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
