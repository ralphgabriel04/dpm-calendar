"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** ScrollControls — top scroll-progress bar + back-to-top FAB. Ported from
    landing-fx.jsx (window scroller; the landing scrolls on the document). */
export function ScrollControls() {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const read = () => {
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, top / max) : 0);
      setShow(top > 480);
    };
    window.addEventListener("scroll", read, { passive: true });
    read();
    return () => window.removeEventListener("scroll", read);
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[45] h-[3px]">
        <div
          className="h-full origin-left transition-transform duration-150"
          style={{ transform: `scaleX(${progress})`, background: "linear-gradient(90deg, hsl(263 70% 62%), hsl(330 80% 64%))" }}
        />
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Retour en haut"
        className={cn(
          "fixed bottom-6 right-6 z-[45] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-110",
          show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </>
  );
}
