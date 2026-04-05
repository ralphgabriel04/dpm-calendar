"use client";

import { useState } from "react";
import { trpc } from "@/infrastructure/trpc/client";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Input } from "@/shared/components/ui/Input";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  GitMerge,
  SkipForward,
  Check,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SyncConflictModalProps {
  conflictId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Resolution = "USE_LOCAL" | "USE_REMOTE" | "MERGE" | "SKIP";

export function SyncConflictModal({
  conflictId,
  open,
  onOpenChange,
}: SyncConflictModalProps) {
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [mergedData, setMergedData] = useState<Record<string, unknown>>({});

  const { data: conflicts } = trpc.sync.getConflicts.useQuery({});
  const conflict = conflicts?.find((c) => c.id === conflictId);

  const resolveConflict = trpc.sync.resolveConflict.useMutation({
    onSuccess: () => {
      toast.success("Conflit résolu avec succès");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  if (!conflict) return null;

  const localData = conflict.localData as Record<string, unknown>;
  const remoteData = conflict.remoteData as Record<string, unknown>;
  const isDeleteConflict = conflict.conflictType === "DELETE_CONFLICT";

  const handleResolve = () => {
    if (!resolution) {
      toast.error("Veuillez sélectionner une résolution");
      return;
    }

    resolveConflict.mutate({
      conflictId,
      resolution,
      mergedData: resolution === "MERGE" ? mergedData : undefined,
    });
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date as string), "PPP 'à' HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const resolutionOptions: {
    value: Resolution;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "USE_LOCAL",
      label: "Garder local",
      description: "Conserver vos modifications et les synchroniser vers le calendrier distant",
      icon: <ArrowRight className="h-5 w-5" />,
    },
    {
      value: "USE_REMOTE",
      label: "Utiliser distant",
      description: isDeleteConflict
        ? "Supprimer l'événement local comme sur le calendrier distant"
        : "Remplacer vos modifications par la version distante",
      icon: <ArrowLeft className="h-5 w-5" />,
    },
    ...(isDeleteConflict
      ? []
      : [
          {
            value: "MERGE" as Resolution,
            label: "Fusionner",
            description: "Combiner manuellement les deux versions",
            icon: <GitMerge className="h-5 w-5" />,
          },
        ]),
    {
      value: "SKIP",
      label: "Ignorer",
      description: "Garder local tel quel sans synchroniser ce conflit",
      icon: <SkipForward className="h-5 w-5" />,
    },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Résoudre le conflit"
      description={
        isDeleteConflict
          ? "L'événement a été modifié localement mais supprimé sur le calendrier distant"
          : "L'événement a été modifié des deux côtés"
      }
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Conflict type badge */}
        <div className="flex items-center gap-2">
          <Badge variant={isDeleteConflict ? "destructive" : "secondary"}>
            {conflict.conflictType === "DELETE_CONFLICT"
              ? "Conflit de suppression"
              : "Conflit de modification"}
          </Badge>
          <Badge variant="outline">{conflict.calendarAccount.provider}</Badge>
          <Badge variant="outline">{conflict.calendarAccount.email}</Badge>
        </div>

        {/* Comparison view */}
        <div className="grid grid-cols-2 gap-4">
          {/* Local version */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Version locale
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{localData.title as string}</span>
              </div>
              {typeof localData.location === "string" && localData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{localData.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(localData.startAt as string)}</span>
              </div>
              {typeof localData.description === "string" && localData.description && (
                <p className="text-muted-foreground line-clamp-2">
                  {localData.description}
                </p>
              )}
            </div>
          </div>

          {/* Remote version */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Version distante
            </h4>
            {isDeleteConflict ? (
              <div className="flex items-center justify-center h-24 text-destructive">
                <span>Supprimé</span>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{remoteData.title as string}</span>
                </div>
                {typeof remoteData.location === "string" && remoteData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{remoteData.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(remoteData.startAt as string)}</span>
                </div>
                {typeof remoteData.description === "string" && remoteData.description && (
                  <p className="text-muted-foreground line-clamp-2">
                    {remoteData.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resolution options */}
        <div className="space-y-3">
          <h4 className="font-medium">Choisir une résolution</h4>
          <div className="grid grid-cols-2 gap-3">
            {resolutionOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setResolution(option.value);
                  if (option.value === "MERGE") {
                    setMergedData({
                      title: localData.title,
                      description: localData.description,
                      location: localData.location,
                      startAt: localData.startAt,
                      endAt: localData.endAt,
                    });
                  }
                }}
                className={cn(
                  "flex flex-col items-start p-4 rounded-lg border text-left transition-all",
                  resolution === option.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Merge editor */}
        {resolution === "MERGE" && (
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">Fusionner manuellement</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={(mergedData.title as string) || ""}
                  onChange={(e) =>
                    setMergedData({ ...mergedData, title: e.target.value })
                  }
                  placeholder="Titre de l'événement"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lieu</label>
                <Input
                  value={(mergedData.location as string) || ""}
                  onChange={(e) =>
                    setMergedData({ ...mergedData, location: e.target.value })
                  }
                  placeholder="Lieu"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={(mergedData.description as string) || ""}
                  onChange={(e) =>
                    setMergedData({ ...mergedData, description: e.target.value })
                  }
                  placeholder="Description"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!resolution || resolveConflict.isPending}
          >
            {resolveConflict.isPending ? (
              "Résolution..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Appliquer
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
