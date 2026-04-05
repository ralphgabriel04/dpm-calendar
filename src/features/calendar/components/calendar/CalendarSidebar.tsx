"use client";

import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Palette,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  FolderPlus,
  Folder,
  GripVertical,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { MiniCalendar } from "./MiniCalendar";
import { UpcomingEventsWidget } from "./UpcomingEventsWidget";
import { TimeBreakdownWidget } from "./TimeBreakdownWidget";
import { RecapWidget } from "@/features/wellness/components/recap";
import { SlotSuggestions } from "@/features/intelligence/components/suggestions";
import { cn } from "@/shared/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";

interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  provider: string;
  isDefault?: boolean;
  sectionId?: string | null;
}

interface CalendarSection {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  position: number;
  isExpanded: boolean;
}

type ViewType = "day" | "week" | "month" | "agenda" | "timeline" | "workload";

interface CalendarSidebarProps {
  currentDate: Date;
  viewType?: ViewType;
  onDateChange: (date: Date) => void;
  calendars: Calendar[];
  sections?: CalendarSection[];
  events?: CalendarEvent[];
  onToggleCalendar: (id: string) => void;
  onShowOnlyThisCalendar?: (id: string) => void;
  onCreateEvent?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateCalendar?: (name: string, color: string, sectionId?: string) => void;
  onUpdateCalendar?: (id: string, name: string, color: string) => void;
  onDeleteCalendar?: (id: string) => void;
  onMoveCalendarToSection?: (calendarId: string, sectionId: string | null) => void;
  // Section handlers
  onCreateSection?: (name: string, color?: string) => void;
  onUpdateSection?: (id: string, name: string, color?: string) => void;
  onDeleteSection?: (id: string) => void;
  onToggleSectionExpanded?: (id: string, isExpanded: boolean) => void;
  // Slot suggestion handler
  onSelectSlot?: (slot: { startAt: Date; endAt: Date }) => void;
  // Collapse state
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#eab308", // Yellow
  "#64748b", // Slate
  "#78716c", // Stone
];

export function CalendarSidebar({
  currentDate,
  viewType = "day",
  onDateChange,
  calendars,
  sections = [],
  events = [],
  onToggleCalendar,
  onShowOnlyThisCalendar,
  onCreateEvent,
  onEventClick,
  onCreateCalendar,
  onUpdateCalendar,
  onDeleteCalendar,
  onMoveCalendarToSection,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  onToggleSectionExpanded,
  onSelectSlot,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: CalendarSidebarProps) {
  const [isMiniCalendarExpanded, setIsMiniCalendarExpanded] = useState(true);
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState(CALENDAR_COLORS[0]);
  const [newCalendarSectionId, setNewCalendarSectionId] = useState<string | undefined>(undefined);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionColor, setNewSectionColor] = useState(CALENDAR_COLORS[0]);
  const [editingCalendar, setEditingCalendar] = useState<string | null>(null);
  const [editingSection, setEditingSectionState] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [localExpandedSections, setLocalExpandedSections] = useState<Record<string, boolean>>({});

  // Group calendars by section
  const unsectionedCalendars = calendars.filter((c) => c.provider === "LOCAL" && !c.sectionId);
  const externalCalendars = calendars.filter((c) => c.provider !== "LOCAL");

  const getCalendarsForSection = (sectionId: string): Calendar[] => {
    return calendars.filter((c) => c.sectionId === sectionId);
  };

  // Check if section is expanded (use local state if available, otherwise use section's isExpanded)
  const isSectionExpanded = (section: CalendarSection): boolean => {
    if (localExpandedSections[section.id] !== undefined) {
      return localExpandedSections[section.id];
    }
    return section.isExpanded;
  };

  const toggleSectionExpanded = (section: CalendarSection) => {
    const newValue = !isSectionExpanded(section);
    setLocalExpandedSections((prev) => ({ ...prev, [section.id]: newValue }));
    onToggleSectionExpanded?.(section.id, newValue);
  };

  const handleCreateCalendar = () => {
    if (newCalendarName.trim() && onCreateCalendar) {
      onCreateCalendar(newCalendarName.trim(), newCalendarColor, newCalendarSectionId);
      setNewCalendarName("");
      setNewCalendarColor(CALENDAR_COLORS[0]);
      setNewCalendarSectionId(undefined);
      setIsCreatingCalendar(false);
    }
  };

  const handleCreateSection = () => {
    if (newSectionName.trim() && onCreateSection) {
      onCreateSection(newSectionName.trim(), newSectionColor);
      setNewSectionName("");
      setNewSectionColor(CALENDAR_COLORS[0]);
      setIsCreatingSection(false);
    }
  };

  const handleStartEditCalendar = (calendar: Calendar) => {
    setEditingCalendar(calendar.id);
    setEditName(calendar.name);
    setEditColor(calendar.color);
  };

  const handleSaveEditCalendar = (id: string) => {
    if (editName.trim() && onUpdateCalendar) {
      onUpdateCalendar(id, editName.trim(), editColor);
    }
    setEditingCalendar(null);
  };

  const handleStartEditSection = (section: CalendarSection) => {
    setEditingSectionState(section.id);
    setEditName(section.name);
    setEditColor(section.color || CALENDAR_COLORS[0]);
  };

  const handleSaveEditSection = (id: string) => {
    if (editName.trim() && onUpdateSection) {
      onUpdateSection(id, editName.trim(), editColor);
    }
    setEditingSectionState(null);
  };

  // Sort sections by position
  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  // If collapsed, show nothing (controlled by parent width)
  if (isCollapsed) {
    return (
      <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-sm items-center py-4", className)} />
    );
  }

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

        {/* Upcoming events widget */}
        {events.length > 0 && (
          <div className="px-3 py-2 border-b border-border/50">
            <UpcomingEventsWidget
              events={events}
              date={currentDate}
              viewType={viewType}
              onEventClick={onEventClick}
              maxEvents={4}
              className="border-0 p-0 bg-transparent"
            />
          </div>
        )}

        {/* Time breakdown widget */}
        {events.length > 0 && (
          <div className="px-3 py-2 border-b border-border/50">
            <TimeBreakdownWidget
              events={events}
              date={currentDate}
              viewType={viewType}
              className="border-0 p-0 bg-transparent"
            />
          </div>
        )}

        {/* Daily recap widget */}
        <div className="px-3 py-2 border-b border-border/50">
          <RecapWidget
            type="DAILY"
            date={currentDate}
            compact
            className="border-0"
          />
        </div>

        {/* AI slot suggestions */}
        <div className="px-3 py-2 border-b border-border/50">
          <SlotSuggestions
            onSelectSlot={onSelectSlot}
            className="border-0"
          />
        </div>

        {/* Sections and calendars */}
        <div className="border-b border-border/50">
          {/* Section header with actions */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">Calendriers</span>
            <div className="flex items-center gap-1">
              {onCreateSection && (
                <button
                  onClick={() => setIsCreatingSection(true)}
                  className="p-1 rounded-full hover:bg-accent transition-colors"
                  title="Ajouter une section"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
              )}
              {onCreateCalendar && (
                <button
                  onClick={() => setIsCreatingCalendar(true)}
                  className="p-1 rounded-full hover:bg-accent transition-colors"
                  title="Ajouter un calendrier"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="pb-3 px-2 space-y-2">
            {/* Create section form */}
            {isCreatingSection && (
              <div className="p-3 rounded-xl bg-accent/50 border border-border/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Nouvelle section</span>
                </div>
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Nom de la section"
                  className="h-9 rounded-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSection();
                    if (e.key === "Escape") setIsCreatingSection(false);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewSectionColor(color)}
                      className={cn(
                        "h-6 w-6 rounded-full transition-all duration-200",
                        newSectionColor === color
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
                  {/* Custom color picker */}
                  <label
                    className={cn(
                      "h-6 w-6 rounded-full cursor-pointer transition-all duration-200 hover:scale-110",
                      "flex items-center justify-center border-2 border-dashed border-muted-foreground/50",
                      !CALENDAR_COLORS.includes(newSectionColor) && "ring-2 ring-offset-2 ring-offset-background scale-110"
                    )}
                    style={{
                      backgroundColor: !CALENDAR_COLORS.includes(newSectionColor) ? newSectionColor : "transparent",
                      // @ts-expect-error CSS custom property for ring color
                      "--tw-ring-color": newSectionColor,
                    }}
                    title="Couleur personnalisée"
                  >
                    {CALENDAR_COLORS.includes(newSectionColor) && (
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <input
                      type="color"
                      value={newSectionColor}
                      onChange={(e) => setNewSectionColor(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreatingSection(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateSection}
                    disabled={!newSectionName.trim()}
                    className="flex-1"
                  >
                    Créer
                  </Button>
                </div>
              </div>
            )}

            {/* Create calendar form */}
            {isCreatingCalendar && (
              <div className="p-3 rounded-xl bg-accent/50 border border-border/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <Input
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Nom du calendrier"
                  className="h-9 rounded-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCalendar();
                    if (e.key === "Escape") setIsCreatingCalendar(false);
                  }}
                />
                {/* Section selector */}
                {sections.length > 0 && (
                  <select
                    value={newCalendarSectionId || ""}
                    onChange={(e) => setNewCalendarSectionId(e.target.value || undefined)}
                    className="w-full h-9 rounded-lg border bg-background px-3 text-sm"
                  >
                    <option value="">Sans section</option>
                    {sortedSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                )}
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
                  {/* Custom color picker */}
                  <label
                    className={cn(
                      "h-6 w-6 rounded-full cursor-pointer transition-all duration-200 hover:scale-110",
                      "flex items-center justify-center border-2 border-dashed border-muted-foreground/50",
                      !CALENDAR_COLORS.includes(newCalendarColor) && "ring-2 ring-offset-2 ring-offset-background scale-110"
                    )}
                    style={{
                      backgroundColor: !CALENDAR_COLORS.includes(newCalendarColor) ? newCalendarColor : "transparent",
                      // @ts-expect-error CSS custom property for ring color
                      "--tw-ring-color": newCalendarColor,
                    }}
                    title="Couleur personnalisée"
                  >
                    {CALENDAR_COLORS.includes(newCalendarColor) && (
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <input
                      type="color"
                      value={newCalendarColor}
                      onChange={(e) => setNewCalendarColor(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreatingCalendar(false)}
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

            {/* Sections with their calendars */}
            {sortedSections.map((section) => {
              const sectionCalendars = getCalendarsForSection(section.id);
              const isExpanded = isSectionExpanded(section);

              if (editingSection === section.id) {
                return (
                  <div
                    key={section.id}
                    className="p-3 rounded-xl bg-accent/50 border border-border/50 space-y-3 animate-in fade-in duration-200"
                  >
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 rounded-lg"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEditSection(section.id);
                        if (e.key === "Escape") setEditingSectionState(null);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {CALENDAR_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
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
                      {/* Custom color picker */}
                      <label
                        className={cn(
                          "h-6 w-6 rounded-full cursor-pointer transition-all duration-200 hover:scale-110",
                          "flex items-center justify-center border-2 border-dashed border-muted-foreground/50",
                          !CALENDAR_COLORS.includes(editColor) && "ring-2 ring-offset-2 ring-offset-background scale-110"
                        )}
                        style={{
                          backgroundColor: !CALENDAR_COLORS.includes(editColor) ? editColor : "transparent",
                          // @ts-expect-error CSS custom property for ring color
                          "--tw-ring-color": editColor,
                        }}
                        title="Couleur personnalisée"
                      >
                        {CALENDAR_COLORS.includes(editColor) && (
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        )}
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSectionState(null)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEditSection(section.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={section.id} className="rounded-lg border border-border/30 overflow-hidden">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSectionExpanded(section)}
                    className="flex items-center w-full px-3 py-2 hover:bg-accent/50 transition-colors group"
                  >
                    <div
                      className={cn(
                        "transition-transform duration-200 mr-2",
                        isExpanded ? "rotate-0" : "-rotate-90"
                      )}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div
                      className="h-3 w-3 rounded-sm mr-2"
                      style={{ backgroundColor: section.color || "#6b7280" }}
                    />
                    <span className="text-sm font-medium flex-1 text-left truncate">
                      {section.name}
                    </span>
                    <span className="text-xs text-muted-foreground mr-2">
                      {sectionCalendars.length}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleStartEditSection(section)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        {onDeleteSection && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteSection(section.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>

                  {/* Section calendars */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="px-2 pb-2 space-y-1">
                      {sectionCalendars.map((calendar) => (
                        <CalendarItem
                          key={calendar.id}
                          calendar={calendar}
                          sections={sortedSections}
                          onToggle={() => onToggleCalendar(calendar.id)}
                          onShowOnlyThis={onShowOnlyThisCalendar ? () => onShowOnlyThisCalendar(calendar.id) : undefined}
                          isEditing={editingCalendar === calendar.id}
                          editName={editName}
                          editColor={editColor}
                          onEditNameChange={setEditName}
                          onEditColorChange={setEditColor}
                          onStartEdit={() => handleStartEditCalendar(calendar)}
                          onSaveEdit={() => handleSaveEditCalendar(calendar.id)}
                          onCancelEdit={() => setEditingCalendar(null)}
                          onMoveToSection={onMoveCalendarToSection}
                          onDelete={
                            !calendar.isDefault && onDeleteCalendar
                              ? () => onDeleteCalendar(calendar.id)
                              : undefined
                          }
                        />
                      ))}
                      {sectionCalendars.length === 0 && (
                        <div className="text-center py-2 text-xs text-muted-foreground">
                          Aucun calendrier
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unsectioned calendars (Mes calendriers) */}
            {unsectionedCalendars.length > 0 && (
              <div className="space-y-1">
                {sections.length > 0 && (
                  <div className="text-xs font-medium text-muted-foreground px-2 pt-2">
                    Mes calendriers
                  </div>
                )}
                {unsectionedCalendars.map((calendar) => (
                  <CalendarItem
                    key={calendar.id}
                    calendar={calendar}
                    sections={sortedSections}
                    onToggle={() => onToggleCalendar(calendar.id)}
                    onShowOnlyThis={onShowOnlyThisCalendar ? () => onShowOnlyThisCalendar(calendar.id) : undefined}
                    isEditing={editingCalendar === calendar.id}
                    editName={editName}
                    editColor={editColor}
                    onEditNameChange={setEditName}
                    onEditColorChange={setEditColor}
                    onStartEdit={() => handleStartEditCalendar(calendar)}
                    onSaveEdit={() => handleSaveEditCalendar(calendar.id)}
                    onCancelEdit={() => setEditingCalendar(null)}
                    onMoveToSection={onMoveCalendarToSection}
                    onDelete={
                      !calendar.isDefault && onDeleteCalendar
                        ? () => onDeleteCalendar(calendar.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

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
                    sections={[]}
                    onToggle={() => onToggleCalendar(calendar.id)}
                    onShowOnlyThis={onShowOnlyThisCalendar ? () => onShowOnlyThisCalendar(calendar.id) : undefined}
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

            {unsectionedCalendars.length === 0 &&
              sections.length === 0 &&
              !isCreatingCalendar &&
              !isCreatingSection && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Aucun calendrier
                </div>
              )}
          </div>
        </div>
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
  sections: CalendarSection[];
  onToggle: () => void;
  onShowOnlyThis?: () => void;
  isEditing: boolean;
  editName: string;
  editColor: string;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onMoveToSection?: (calendarId: string, sectionId: string | null) => void;
  onDelete?: () => void;
}

function CalendarItem({
  calendar,
  sections,
  onToggle,
  onShowOnlyThis,
  isEditing,
  editName,
  editColor,
  onEditNameChange,
  onEditColorChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onMoveToSection,
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
          {/* Custom color picker */}
          <label
            className={cn(
              "h-6 w-6 rounded-full cursor-pointer transition-all duration-200 hover:scale-110",
              "flex items-center justify-center border-2 border-dashed border-muted-foreground/50",
              !CALENDAR_COLORS.includes(editColor) && "ring-2 ring-offset-2 ring-offset-background scale-110"
            )}
            style={{
              backgroundColor: !CALENDAR_COLORS.includes(editColor) ? editColor : "transparent",
              // @ts-expect-error CSS custom property for ring color
              "--tw-ring-color": editColor,
            }}
            title="Couleur personnalisée"
          >
            {CALENDAR_COLORS.includes(editColor) && (
              <Plus className="h-3 w-3 text-muted-foreground" />
            )}
            <input
              type="color"
              value={editColor}
              onChange={(e) => onEditColorChange(e.target.value)}
              className="sr-only"
            />
          </label>
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
          <DropdownMenuContent align="end" className="w-56">
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
            {onShowOnlyThis && (
              <DropdownMenuItem onClick={onShowOnlyThis}>
                <Eye className="h-4 w-4 mr-2" />
                Afficher uniquement cet agenda
              </DropdownMenuItem>
            )}
            {calendar.provider === "LOCAL" && (
              <>
                <DropdownMenuItem onClick={onStartEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>

                {/* Move to section submenu */}
                {sections.length > 0 && onMoveToSection && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onMoveToSection(calendar.id, null)}
                      disabled={!calendar.sectionId}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      Retirer de la section
                    </DropdownMenuItem>
                    {sections.map((section) => (
                      <DropdownMenuItem
                        key={section.id}
                        onClick={() => onMoveToSection(calendar.id, section.id)}
                        disabled={calendar.sectionId === section.id}
                      >
                        <div
                          className="h-3 w-3 rounded-sm mr-2"
                          style={{ backgroundColor: section.color || "#6b7280" }}
                        />
                        {section.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

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
