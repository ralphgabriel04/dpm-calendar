"use client";

import { useRef, useState } from "react";
import { Check, Inbox, GripVertical, Share2, Sparkles, Sunrise } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// kind -> HSL triple (matches the design's LP_CAL_KIND)
const KIND: Record<string, string> = {
  event: "217 91% 60%",
  focus: "263 70% 60%",
  task: "142 70% 45%",
};

type Block = { id: number; col: number; top: number; h: number; kind: string; label: string };
type Task = { id: string; label: string };

// nearest non-overlapping top% in a column, near `desired`
function freeTop(col: number, h: number, blocks: Block[], desired: number): number {
  const colBlocks = blocks.filter((b) => b.col === col).sort((a, b) => a.top - b.top);
  let top = Math.max(2, Math.min(100 - h - 2, desired));
  for (const b of colBlocks) {
    if (top < b.top + b.h && top + h > b.top) top = b.top + b.h + 1;
  }
  return Math.min(100 - h - 2, top);
}

const COPY = {
  days: ["Lun", "Mar", "Mer", "Jeu", "Ven"],
  legend: { event: "Événement", focus: "Focus", task: "Tâche" } as Record<string, string>,
  tasks: ["Préparer la démo · 30m", "Répondre à Léa · 15m", "Rédiger le rapport · 45m"],
  inbox: "À planifier",
  planTomorrow: "Planifier demain",
  suggest: "Créneau suggéré",
  suggestSub: "ton pic d'énergie",
  place: "Placer",
  share: "Partager",
  shared: "Partagé avec l'équipe — lien copié",
};

/** CalendarProDemo — live drag-and-drop scheduler (ported from the DPM Elevate
    prototype). Drag a task from the inbox onto the week grid, or let the AI place
    it in your suggested free slot. */
export function CalendarProDemo() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, col: 0, top: 8, h: 12, kind: "event", label: "Stand-up" },
    { id: 2, col: 1, top: 30, h: 22, kind: "focus", label: "Deep work" },
    { id: 3, col: 3, top: 16, h: 14, kind: "event", label: "1:1 Léa" },
  ]);
  const [inbox, setInbox] = useState<Task[]>(
    COPY.tasks.map((label, i) => ({ id: "t" + i, label }))
  );
  const [, setDrag] = useState<{ id: string; label: string; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(10);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const startDrag = (e: React.PointerEvent, item: Task) => {
    setDrag({ id: item.id, label: item.label, x: e.clientX, y: e.clientY });
    const move = (ev: PointerEvent) =>
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
    const up = (ev: PointerEvent) => {
      const grid = gridRef.current;
      if (grid) {
        const r = grid.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          const col = Math.max(0, Math.min(4, Math.floor(((ev.clientX - r.left) / r.width) * 5)));
          const desired = ((ev.clientY - r.top) / r.height) * 100 - 8;
          setBlocks((bs) => [
            ...bs,
            { id: nextId.current++, col, top: freeTop(col, 16, bs, desired), h: 16, kind: "task", label: item.label.split(" · ")[0] },
          ]);
          setInbox((cur) => cur.filter((x) => x.id !== item.id));
        }
      }
      setDrag(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
  };

  const placeSuggested = () => {
    if (!inbox.length) return;
    const item = inbox[0];
    setBlocks((bs) => [
      ...bs,
      { id: nextId.current++, col: 2, top: freeTop(2, 18, bs, 12), h: 18, kind: "focus", label: item.label.split(" · ")[0] },
    ]);
    setInbox((cur) => cur.filter((x) => x.id !== item.id));
    flash(COPY.suggest + " → 09:00 ✓");
  };

  const planTomorrow = () => {
    setBlocks((bs) => {
      const t1 = freeTop(4, 14, bs, 20);
      const b1: Block = { id: nextId.current++, col: 4, top: t1, h: 14, kind: "task", label: "Review" };
      const t2 = freeTop(4, 18, [...bs, b1], t1 + 16);
      const b2: Block = { id: nextId.current++, col: 4, top: t2, h: 18, kind: "focus", label: "Deep work" };
      return [...bs, b1, b2];
    });
    flash(COPY.planTomorrow + " ✓");
  };

  const suggTop = freeTop(2, 18, blocks, 12);

  return (
    <div className="relative rounded-[12px] border border-border bg-background p-3.5">
      {/* legend + action */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Object.keys(COPY.legend).map((kk) => (
            <span key={kk} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-sm" style={{ background: `hsl(${KIND[kk]})` }} />
              {COPY.legend[kk]}
            </span>
          ))}
        </div>
        <button
          onClick={planTomorrow}
          className="flex items-center gap-1 rounded-[6px] border border-border px-2 py-1 text-[10.5px] font-medium transition-colors hover:border-primary/40"
        >
          <Sunrise className="h-3 w-3 text-primary" /> {COPY.planTomorrow}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_120px] gap-2.5">
        {/* week grid */}
        <div>
          <div className="mb-1 grid grid-cols-5 gap-1 text-center">
            {COPY.days.map((d, i) => (
              <div key={i} className={cn("text-[9.5px] font-medium", i === 2 ? "text-primary" : "text-muted-foreground")}>
                {d}
              </div>
            ))}
          </div>
          <div ref={gridRef} className="dotted-grid relative h-[188px] overflow-hidden rounded-[8px] border border-border">
            {[0, 1, 2, 3, 4].map((col) => (
              <div key={col} className="absolute bottom-0 top-0 border-r border-border/40" style={{ left: `${(col + 1) * 20}%` }} />
            ))}
            {blocks.map((b) => (
              <div
                key={b.id}
                className="lp-evt absolute overflow-hidden rounded-[5px] p-1 text-white"
                style={{ left: `calc(${b.col * 20}% + 2px)`, width: "calc(20% - 4px)", top: `${b.top}%`, height: `${b.h}%`, background: `hsl(${KIND[b.kind]} / 0.9)` }}
              >
                <div className="truncate text-[8px] font-medium leading-tight">{b.label}</div>
              </div>
            ))}
            {inbox.length > 0 && (
              <div
                className="absolute flex items-center justify-center rounded-[5px] border-2 border-dashed border-primary/60 bg-primary/[0.06]"
                style={{ left: "calc(40% + 2px)", width: "calc(20% - 4px)", top: `${suggTop}%`, height: "18%" }}
              >
                <Sparkles className="lp-pulse h-3 w-3 text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* inbox + suggestion */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">
            <Inbox className="h-[11px] w-[11px]" /> {COPY.inbox}
          </div>
          <div className="flex flex-col gap-1.5">
            {inbox.map((it) => (
              <button
                key={it.id}
                onPointerDown={(e) => startDrag(e, it)}
                className="lp-draggable flex items-center gap-1.5 rounded-[7px] border border-border bg-card px-2 py-1.5 text-left text-[10px] font-medium hover:border-primary/40"
              >
                <GripVertical className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{it.label}</span>
              </button>
            ))}
            {inbox.length === 0 && <div className="px-1 text-[10px] italic text-muted-foreground">— tout est planifié —</div>}
          </div>
          {inbox.length > 0 ? (
            <div className="mt-auto rounded-[8px] border border-primary/30 bg-primary/[0.06] p-2">
              <div className="flex items-center gap-1 text-[9.5px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" /> {COPY.suggest}
              </div>
              <div className="mt-0.5 text-[10px]">
                Mer 09:00 · <span className="text-muted-foreground">{COPY.suggestSub}</span>
              </div>
              <div className="mt-1.5 flex gap-1">
                <button onClick={placeSuggested} className="h-6 flex-1 rounded-[6px] bg-primary text-[9.5px] font-medium text-primary-foreground">
                  {COPY.place}
                </button>
                <button
                  onClick={() => flash(COPY.shared)}
                  title={COPY.share}
                  className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-border"
                >
                  <Share2 className="h-[11px] w-[11px]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-auto flex items-center gap-1.5 rounded-[8px] border border-emerald-500/30 bg-emerald-500/[0.07] p-2 text-[10px] font-medium text-emerald-500">
              <Check className="h-[11px] w-[11px]" strokeWidth={3} /> Terminé
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="anim-scale-in absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-[10.5px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
