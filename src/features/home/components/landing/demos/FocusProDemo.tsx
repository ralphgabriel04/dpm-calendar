"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee, Lock, Music, Pause, Play, RotateCcw, SkipForward, Sparkles, VolumeX, Zap } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { modulesCopy } from "../copy";

const f = modulesCopy.focusPro;
const m = modulesCopy.music;
const SERVICE_DOT = ["#1db954", "#fc3c44", "#ff0000"];

/** MusicWidget — connect a service, pick a playlist, and the equalizer animates
    only when truly audible; music auto-mutes on breaks. */
function MusicWidget({ isBreak }: { isBreak: boolean }) {
  const [connected, setConnected] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [plIdx, setPlIdx] = useState(0);
  const [muteBreak, setMuteBreak] = useState(true);
  const pl = m.playlists[plIdx];
  const muted = muteBreak && isBreak;
  const audible = playing && !muted;

  if (!connected) {
    return (
      <div className="rounded-[10px] border border-border bg-card/60 p-3">
        <div className="mb-2.5 flex items-center gap-2">
          <Music className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-semibold">{m.label}</span>
        </div>
        <div className="flex gap-1.5">
          {m.services.map((s, i) => (
            <button
              key={i}
              onClick={() => setConnected(true)}
              className="flex h-8 flex-1 items-center justify-center gap-1 rounded-[7px] border border-border text-[10.5px] font-medium transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: SERVICE_DOT[i] }} /> {s}
            </button>
          ))}
        </div>
        <div className="mt-2 text-center text-[10px] text-muted-foreground">
          {m.connect} → {m.friendly} ✦
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-[10px] border bg-card/60 p-3 transition-colors", muted ? "border-emerald-500/40" : "border-border")}>
      <div className="flex items-center gap-2.5">
        <div
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
          style={{ background: `linear-gradient(135deg, hsl(${pl.ha} 70% 55%), hsl(${pl.hb} 70% 50%))` }}
        >
          {audible ? (
            <div className="flex h-4 items-end gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="music-eq-bar h-4 w-0.5 bg-white/90" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          ) : (
            <VolumeX className="h-4 w-4 text-white/90" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-semibold">{pl.n}</span>
            {pl.score >= 70 && (
              <span className="flex items-center gap-0.5 rounded bg-emerald-500/[0.16] px-1 py-0.5 text-[8.5px] font-semibold text-emerald-500">
                <Sparkles className="h-2 w-2" />
                {pl.score}
              </span>
            )}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            {muted ? (
              <span className="font-medium text-emerald-500">{m.mutedNow}</span>
            ) : (
              `${m.track} · ${pl.c} ${m.nowPlaying.toLowerCase()}`
            )}
          </div>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          disabled={muted}
          className={cn(
            "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white",
            muted ? "cursor-not-allowed bg-muted" : "bg-primary"
          )}
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="ml-0.5 h-3 w-3" />}
        </button>
      </div>
      <div className="mt-2.5 flex gap-1 overflow-x-auto">
        {m.playlists.map((p, i) => (
          <button
            key={i}
            onClick={() => setPlIdx(i)}
            className={cn(
              "whitespace-nowrap rounded-[6px] border px-1.5 py-1 text-[9.5px] transition-colors",
              i === plIdx ? "border-primary/50 bg-primary/[0.08]" : "border-border text-muted-foreground"
            )}
          >
            {p.n}
          </button>
        ))}
      </div>
      <button onClick={() => setMuteBreak((v) => !v)} className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className={cn("flex h-4 w-7 rounded-full p-0.5 transition-colors", muteBreak ? "bg-primary" : "bg-muted")}>
          <span className={cn("h-3 w-3 rounded-full bg-white transition-transform", muteBreak && "translate-x-3")} />
        </span>
        {m.muteBreak}
        {muted && <span className="ml-1 font-semibold text-emerald-500">· {m.activeNow}</span>}
      </button>
    </div>
  );
}

/** FocusProDemo — lock a task to a session, run a fast-forward focus/break ring
    timer, and connect focus music. Ported from landing-demos3.jsx. */
export function FocusProDemo() {
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const FOCUS = focusMin * 60;
  const BREAK = breakMin * 60;
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(1);
  const [breaks, setBreaks] = useState(0);
  const [lockIdx, setLockIdx] = useState(0);
  const [hyper, setHyper] = useState(false);
  const [ringEdit, setRingEdit] = useState(false);
  const [ringDraft, setRingDraft] = useState("");
  const [toast, setToast] = useState<{ label: string; color: string } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>();

  const isBreak = phase === "break";
  const total = isBreak ? BREAK : FOCUS;
  const locked = running;

  const flashToast = (label: string, color: string) => {
    setToast({ label, color });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 1600);
  };

  // Demo clock: each phase fast-forwards over a few fixed wall-clock seconds.
  useEffect(() => {
    if (!running) return;
    const phaseTotal = isBreak ? BREAK : FOCUS;
    const demoMs = isBreak ? 5000 : 7000;
    const rate = phaseTotal / demoMs;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setLeft((l) => Math.max(0, l - rate * dt));
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, focusMin, breakMin]);

  // phase transition when the clock hits zero
  useEffect(() => {
    if (!running || left > 0) return;
    if (phase === "focus") {
      setBreaks((b) => b + 1);
      setPhase("break");
      setLeft(BREAK);
      flashToast(f.breakToast, "142 70% 50%");
    } else {
      setSession((s) => (s % 4) + 1);
      setPhase("focus");
      setLeft(FOCUS);
      flashToast(f.focusToast, "var(--primary)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running, phase]);

  // keep idle display synced to chosen durations
  useEffect(() => {
    if (!running) setLeft(phase === "break" ? BREAK : FOCUS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMin, breakMin]);

  const pct = total ? Math.max(0, Math.min(1, 1 - left / total)) : 0;
  const secs = Math.ceil(left);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const ringHsl = isBreak ? "142 70% 50%" : "var(--primary)";
  const reset = () => {
    setRunning(false);
    setPhase("focus");
    setLeft(FOCUS);
    setToast(null);
  };
  const skipBreak = () => {
    setSession((s) => (s % 4) + 1);
    setPhase("focus");
    setLeft(FOCUS);
    flashToast(f.focusToast, "var(--primary)");
  };
  const openRingEdit = () => {
    if (locked) return;
    setRingDraft(String(isBreak ? breakMin : focusMin));
    setRingEdit(true);
  };
  const commitRingEdit = () => {
    const n = parseInt(ringDraft, 10);
    if (!isNaN(n)) {
      if (isBreak) setBreakMin(Math.max(1, Math.min(30, n)));
      else setFocusMin(Math.max(5, Math.min(90, n)));
    }
    setRingEdit(false);
  };

  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* ring */}
        <div className="relative flex flex-col items-center justify-center">
          {toast && (
            <div
              className="anim-scale-in absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-lg"
              style={{ background: `hsl(${toast.color})` }}
            >
              {toast.label}
            </div>
          )}
          <div
            className="relative h-[136px] w-[136px] rounded-full"
            style={{ background: `conic-gradient(hsl(${ringHsl}) ${pct * 360}deg, hsl(var(--muted) / 0.5) 0deg)` }}
          >
            <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full border border-border bg-background">
              {ringEdit ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="number"
                    value={ringDraft}
                    onChange={(e) => setRingDraft(e.target.value)}
                    onBlur={commitRingEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRingEdit();
                      if (e.key === "Escape") setRingEdit(false);
                    }}
                    className="w-14 border-b-2 border-primary bg-transparent text-center text-[26px] font-bold tabular-nums focus:outline-none"
                  />
                  <span className="text-[11px] text-muted-foreground">{f.min}</span>
                </div>
              ) : (
                <button onDoubleClick={openRingEdit} className={cn("flex flex-col items-center", !locked && "cursor-text")}>
                  <div className="text-[30px] font-bold leading-none tabular-nums">
                    {mm}:{ss}
                  </div>
                  <div
                    className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em]"
                    style={{ color: isBreak ? "hsl(142 70% 55%)" : "hsl(var(--muted-foreground))" }}
                  >
                    {isBreak ? f.breakLabel : f.label}
                  </div>
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 font-mono text-[10.5px] text-muted-foreground">
            <span>
              {f.session} {session}/4
            </span>
            <span className="flex items-center gap-1">
              <Coffee className="h-[11px] w-[11px]" /> {breaks} {f.breaks}
            </span>
            <span className="flex items-center gap-1 text-primary" title={f.demoBadge}>
              <Zap className="h-2.5 w-2.5" /> {f.demoBadge}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-4 text-[13px] font-medium text-white transition-transform active:scale-95"
            >
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {running ? f.pause : f.start}
            </button>
            {isBreak ? (
              <button
                onClick={skipBreak}
                className="flex h-9 items-center gap-1.5 rounded-[8px] border border-emerald-500/50 px-3 text-[12px] font-medium text-emerald-500 transition-transform active:scale-95"
              >
                <SkipForward className="h-[13px] w-[13px]" /> {f.skip}
              </button>
            ) : (
              <button
                onClick={() => !locked && setHyper((x) => !x)}
                disabled={locked}
                title={f.hyperfocus}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-medium transition-colors",
                  locked && "cursor-not-allowed opacity-40",
                  hyper ? "border-primary bg-primary/[0.12] text-primary" : "border-border text-muted-foreground"
                )}
              >
                <Zap className="h-[13px] w-[13px]" /> {f.hyperfocus}
              </button>
            )}
            <button
              onClick={reset}
              title={f.reset}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-transform active:scale-95"
            >
              <RotateCcw className="h-[13px] w-[13px]" />
            </button>
          </div>
        </div>

        {/* queue + music — locked while the timer runs */}
        <div className="relative flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{f.queue}</span>
            {locked && (
              <span className="flex items-center gap-1 text-[9px] font-semibold text-primary">
                <Lock className="h-2.5 w-2.5" /> {f.locked}
              </span>
            )}
          </div>
          <div className={cn("flex flex-col gap-1.5 transition-opacity", locked && "pointer-events-none opacity-50")}>
            {f.tasks.map((task, i) => (
              <button
                key={i}
                onClick={() => setLockIdx(i)}
                className={cn(
                  "flex items-center gap-2 rounded-[8px] border px-2.5 py-2 text-left transition-colors",
                  i === lockIdx ? "border-primary/50 bg-primary/[0.07]" : "border-border bg-card hover:border-primary/30"
                )}
              >
                {i === lockIdx ? (
                  <Lock className="h-3 w-3 flex-shrink-0 text-primary" />
                ) : (
                  <span className="h-3 w-3 flex-shrink-0 rounded-full border border-muted-foreground/40" />
                )}
                <span className="flex-1 truncate text-[12px] font-medium">{task}</span>
                {i === lockIdx && <span className="text-[8.5px] font-semibold uppercase tracking-wide text-primary">{f.locked.split(" ")[0]}</span>}
              </button>
            ))}
          </div>
          <div className={cn("transition-opacity", locked && !isBreak && "pointer-events-none opacity-50")}>
            <MusicWidget isBreak={isBreak && running} />
          </div>
          {locked && !isBreak && (
            <div className="absolute inset-x-0 bottom-0 -mb-1 flex items-center justify-center gap-1 text-center text-[9px] text-muted-foreground">
              <Lock className="h-[9px] w-[9px]" /> {f.lockedNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
