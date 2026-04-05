"use client";

import { useEffect } from "react";
import { Button } from "@/shared/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Quelque chose s'est mal passé. Vous pouvez réessayer."}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Ref: {error.digest}</p>
      )}
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
