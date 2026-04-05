"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";

export function ExportDataButton() {
  const exportMutation = trpc.user.exportMyData.useMutation({
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const filename = `dpm-calendar-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export généré", { description: filename });
    },
    onError: (error) => {
      toast.error("Échec de l'export", { description: error.message });
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => exportMutation.mutate()}
      disabled={exportMutation.isPending}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {exportMutation.isPending ? "Export en cours…" : "Exporter mes données"}
    </Button>
  );
}
