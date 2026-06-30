"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";

const COLUMNS = ["À faire", "En cours", "Terminé"];
const VIEWS = ["Liste", "Tableau", "Timeline", "Calendrier", "Stats"];
const PRIO: Record<string, string> = {
  urgent: "0 84% 60%",
  high: "25 95% 55%",
  med: "38 92% 50%",
  low: "142 70% 45%",
};
const CARDS = [
  { t: "Maquette page login", c: "263 70% 60%", p: "high", who: "R" },
  { t: "API paiement Stripe", c: "217 91% 60%", p: "urgent", who: "L" },
  { t: "Revue PR #214", c: "142 70% 45%", p: "med", who: "M" },
  { t: "Schéma base de données", c: "38 92% 55%", p: "low", who: "R" },
];

type Card = { id: number; idx: number; col: number };

function Avatar({ who, c }: { who: string; c: string }) {
  return (
    <span
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[8.5px] font-bold text-white"
      style={{ background: `hsl(${c})` }}
    >
      {who}
    </span>
  );
}

/** KanbanDemo — interactive board: drag cards across columns, WIP limit on
    "En cours", celebration glow when a card lands in "Terminé". Ported from the
    DPM Elevate prototype (landing-demos3.jsx). */
export function KanbanDemo() {
  const [cards, setCards] = useState<Card[]>([
    { id: 1, idx: 0, col: 0 },
    { id: 2, idx: 1, col: 1 },
    { id: 3, idx: 2, col: 1 },
    { id: 4, idx: 3, col: 2 },
  ]);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [hotCol, setHotCol] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const startDrag = (e: React.PointerEvent, id: number) => {
    setDrag({ id, x: e.clientX, y: e.clientY });
    const move = (ev: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = el?.closest("[data-col]");
      setHotCol(zone ? Number(zone.getAttribute("data-col")) : null);
    };
    const up = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = el?.closest("[data-col]");
      if (zone) {
        const col = Number(zone.getAttribute("data-col"));
        setCards((cs) => cs.map((c) => (c.id === id ? { ...c, col } : c)));
        if (col === 2) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 850);
        }
      }
      setDrag(null);
      setHotCol(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
  };

  const dragCard = drag && cards.find((c) => c.id === drag.id);

  return (
    <div className="relative rounded-[12px] border border-border bg-background p-3.5">
      {/* view switcher (Board active) */}
      <div className="mb-3 flex items-center gap-0.5 overflow-x-auto rounded-[8px] border border-border bg-muted/40 p-0.5">
        {VIEWS.map((label, i) => (
          <button
            key={i}
            className={cn(
              "h-7 whitespace-nowrap rounded-[6px] px-2.5 text-[11px] font-medium transition-all",
              i === 1 ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((colName, ci) => {
          const colCards = cards.filter((c) => c.col === ci && !(drag && drag.id === c.id));
          const wip = ci === 1;
          const over = wip && colCards.length > 3;
          return (
            <div
              key={ci}
              data-col={ci}
              className={cn(
                "lp-dropzone relative min-h-[150px] rounded-[10px] border border-border bg-card/50 p-2",
                hotCol === ci && "lp-drop-hot"
              )}
            >
              {ci === 2 && celebrate && (
                <div
                  className="pointer-events-none absolute inset-0 animate-pulse rounded-[10px]"
                  style={{ background: "radial-gradient(circle at 50% 42%, hsl(142 70% 50% / 0.35), transparent 68%)" }}
                />
              )}
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{colName}</span>
                {wip ? (
                  <span
                    className={cn(
                      "rounded px-1 py-0.5 font-mono text-[8.5px]",
                      over ? "bg-red-500/[0.18] text-red-400" : "bg-muted text-muted-foreground"
                    )}
                  >
                    WIP {colCards.length}/3
                  </span>
                ) : (
                  <span className="font-mono text-[8.5px] text-muted-foreground">{colCards.length}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {colCards.map((c) => {
                  const card = CARDS[c.idx];
                  return (
                    <button
                      key={c.id}
                      onPointerDown={(e) => startDrag(e, c.id)}
                      className="lp-draggable rounded-[8px] border border-border bg-card p-2 text-left hover:border-primary/40"
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="w-1 flex-shrink-0 self-stretch rounded-full" style={{ background: `hsl(${card.c})` }} />
                        <span className="flex-1 text-[11px] font-medium leading-snug">{card.t}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between pl-2.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${PRIO[card.p]})` }} />
                        <Avatar who={card.who} c={card.c} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {dragCard && drag && (
        <div
          className="lp-dragging pointer-events-none fixed z-[60] w-[150px] rounded-[8px] border border-primary/50 bg-card p-2"
          style={{ left: drag.x, top: drag.y, transform: "translate(-30%, -50%) rotate(-2deg)" }}
        >
          <div className="flex items-start gap-1.5">
            <span className="w-1 flex-shrink-0 self-stretch rounded-full" style={{ background: `hsl(${CARDS[dragCard.idx].c})` }} />
            <span className="flex-1 text-[11px] font-medium leading-snug">{CARDS[dragCard.idx].t}</span>
          </div>
        </div>
      )}
    </div>
  );
}
