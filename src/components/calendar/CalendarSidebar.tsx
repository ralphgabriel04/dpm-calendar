"use client";

import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Palette,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MiniCalendar } from "./MiniCalendar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  provider: string;
  isDefault?: boolean;
}

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  calendars: Calendar[];
  onToggleCalendar: (id: string) => void;
  onCreateEvent?: () => void;
  onCreateCalendar?: (name: string, color: string) => void;
  onUpdateCalendar?: (id: string, name: string, color: string) => void;
  onDeleteCalendar?: (id: string) => void;
  className?: string;
}

const CALENDAR_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

export function CalendarSidebar({
  currentDate,
  onDateChange,
  calendars,
  onToggleCalendar,
  onCreateEvent,
  onCreateCalendar,
  onUpdateCalendar,
  onDeleteCalendar,
  className,
}: CalendarSidebarProps) {
  const [isCalendarsExpanded, setIsCalendarsExpanded] = useState(true);
  const [isMiniCalendarExpanded, setIsMiniCalendarExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState(CALENDAR_COLORS[0]);
  const [editingCalendar, setEditingCalendar] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Group calendars by provider
  const localCalendars = calendars.filter((c) => c.provider === "LOCAL");
  const externalCalendars = calendars.filter((c) => c.provider !== "LOCAL");

  const handleCreateCalendar = () => {
    if (newCalendarName.trim() && onCreateCalendar) {
      onCreateCalendar(newCalendarName.trim(), newCalendarColor);
      setNewCalendarName("");
      setNewCalendarColor(CALENDAR_COLORS[0]);
      setIsCreating(false);
    }
  };

  const handleStartEdit = (calendar: Calendar) => {
    setEditingCalendar(calendar.id);
    setEditName(calendar.name);
    setEditColor(calendar.color);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim() && onUpdateCalendar) {
      onUpdateCalendar(id, editName.trim(), editColor);
    }
    setEditingCalendar(null);
  };

  return (
    <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-sm", className)}>
      {/* Create event button */}
      {onCreateEvent && (
        <div className="p-4">
          <Button
            onClick={onCreateEvent}
            className="w-full gap-2 shadow-lg hover:shadow-xl"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Nouvel événement
          </Button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        {/* Mini calendar section */}
        <CollapsibleSection
          title="Calendrier"
          isExpanded={isMiniCalendarExpanded}
          onToggle={() => setIsMiniCalendarExpanded(!isMiniCalendarExpanded)}
        >
          <div className="px-2">
            <MiniCalendar value={currentDate} onChange={onDateChange} />
          </div>
        </CollapsibleSection>

        {/* Calendars section */}
        <CollapsibleSection
          title="Mes calendriers"
          isExpanded={isCalendarsExpanded}
          onToggle={() => setIsCalendarsExpanded(!isCalendarsExpanded)}
          action={
            onCreateCalendar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreating(true);
                }}
                className="p-1 rounded-full hover:bg-accent transition-colors"
                title="Ajouter un calendrier"
              >
                <Plus className="h-4 w-4" />
              </button>
            )
          }
        >
          <div className="space-y-1 px-2">
            {/* Create new calendar form */}
            {isCreating && (
              <div className="p-3 rounded-xl bg-accent/50 border border-border/50 space-y-3 mb-2 animate-in slide-in-from-top-2 duration-200">
                <Input
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Nom du calendrier"
                  className="h-9 rounded-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCalendar();
                    if (e.key === "Escape") setIsCreating(false);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCalendarColor(color)}
                      className={cn(
                        "h-6 w-6 rounded-full transition-all duration-200",
                        newCalendarColor === color
                          ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-110"
                      )}
                      style={{
                        backgroundColor: color,
                        // @ts-expect-error CSS custom property for ring color
                        "--tw-ring-color": color,
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateCalendar}
                    disabled={!newCalendarName.trim()}
                    className="flex-1"
                  >
                    Créer
                  </Button>
                </div>
              </div>
            )}

            {/* Local calendars */}
            {localCalendars.map((calendar) => (
              <CalendarItem
                key={calendar.id}
                calendar={calendar}
                onToggle={() => onToggleCalendar(calendar.id)}
                isEditing={editingCalendar === calendar.id}
                editName={editName}
                editColor={editColor}
                onEditNameChange={setEditName}
                onEditColorChange={setEditColor}
                onStartEdit={() => handleStartEdit(calendar)}
                onSaveEdit={() => handleSaveEdit(calendar.id)}
                onCancelEdit={() => setEditingCalendar(null)}
                onDelete={
                  !calendar.isDefault && onDeleteCalendar
                    ? () => onDeleteCalendar(calendar.id)
                    : undefined
                }
              />
            ))}

            {/* External calendars */}
            {externalCalendars.length > 0 && (
              <div className="pt-3 mt-2 border-t border-border/50">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  Calendriers externes
                </div>
                {externalCalendars.map((calendar) => (
                  <CalendarItem
                    key={calendar.id}
                    calendar={calendar}
                    onToggle={() => onToggleCalendar(calendar.id)}
                    isEditing={false}
                    editName=""
                    editColor=""
                    onEditNameChange={() => {}}
                    onEditColorChange={() => {}}
                    onStartEdit={() => {}}
                    onSaveEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ))}
              </div>
            )}

            {localCalendars.length === 0 && !isCreating && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Aucun calendrier
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  action,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-border/50">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-accent/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-0" : "-rotate-90"
            )}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>{action}</div>
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isExpanded ? "max-h-[1000px] opacity-100 pb-3" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Calendar Item Component
interface CalendarItemProps {
  calendar: Calendar;
  onToggle: () => void;
  isEditing: boolean;
  editName: string;
  editColor: string;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete?: () => void;
}

function CalendarItem({
  calendar,
  onToggle,
  isEditing,
  editName,
  editColor,
  onEditNameChange,
  onEditColorChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CalendarItemProps) {
  if (isEditing) {
    return (
      <div className="p-3 rounded-xl bg-accent/50 border border-border/50 space-y-3 animate-in fade-in duration-200">
        <Input
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          className="h-9 rounded-lg"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
        />
        <div className="flex flex-wrap gap-2">
          {CALENDAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onEditColorChange(color)}
              className={cn(
                "h-6 w-6 rounded-full transition-all duration-200",
                editColor === color
                  ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                  : "hover:scale-110"
              )}
              style={{
                backgroundColor: color,
                // @ts-expect-error CSS custom property for ring color
                "--tw-ring-color": color,
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
          <Button size="sm" onClick={onSaveEdit} className="flex-1">
            <Check className="h-4 w-4 mr-1" />
            Enregistrer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/50 group transition-colors">
      <button
        onClick={onToggle}
        className={cn(
          "h-5 w-5 rounded-md flex items-center justify-center transition-all duration-200",
          "border-2 hover:scale-110",
          calendar.isVisible
            ? "border-transparent shadow-sm"
            : "border-muted-foreground/30 bg-transparent"
        )}
        style={{
          backgroundColor: calendar.isVisible ? calendar.color : "transparent",
          boxShadow: calendar.isVisible ? `0 2px 4px ${calendar.color}40` : "none",
        }}
      >
        {calendar.isVisible && (
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        )}
      </button>
      <span
        className={cn(
          "flex-1 text-sm truncate transition-colors",
          !calendar.isVisible && "text-muted-foreground"
        )}
      >
        {calendar.name}
      </span>

      {(onDelete || calendar.provider === "LOCAL") && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onToggle}>
              {calendar.isVisible ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Afficher
                </>
              )}
            </DropdownMenuItem>
            {calendar.provider === "LOCAL" && (
              <>
                <DropdownMenuItem onClick={onStartEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
