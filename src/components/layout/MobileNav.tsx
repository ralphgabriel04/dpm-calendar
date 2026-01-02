"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Calendar, CheckSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Accueil", href: "/home", icon: Home },
  { name: "Planner", href: "/planner", icon: LayoutDashboard },
  { name: "Calendrier", href: "/calendar", icon: Calendar },
  { name: "Taches", href: "/tasks", icon: CheckSquare },
  { name: "Stats", href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-bottom">
      <div className="bg-card/95 backdrop-blur-lg border-t">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors touch-target",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive && "text-primary"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Floating action button for mobile
interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
}

export function FloatingActionButton({
  onClick,
  icon: Icon,
  label,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40 lg:hidden",
        "bottom-20 right-4",
        "h-14 w-14 rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "flex items-center justify-center",
        "hover:bg-primary/90 active:scale-95 transition-all"
      )}
      aria-label={label}
    >
      {Icon && <Icon className="h-6 w-6" />}
    </button>
  );
}
