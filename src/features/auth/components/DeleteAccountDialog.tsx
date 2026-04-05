"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/Dialog";

interface DeleteAccountDialogProps {
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DELETE_KEYWORD = "SUPPRIMER";

export function DeleteAccountDialog({
  userEmail,
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [emailInput, setEmailInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const deleteMutation = trpc.user.deleteMyAccount.useMutation({
    onSuccess: async () => {
      toast.success("Compte supprimé. Déconnexion…");
      await signOut({ callbackUrl: "/" });
    },
    onError: (error) => {
      toast.error("Échec de la suppression", { description: error.message });
    },
  });

  const emailMatches =
    emailInput.trim().toLowerCase() === userEmail.toLowerCase();
  const keywordMatches = keywordInput === DELETE_KEYWORD;
  const canDelete = emailMatches && keywordMatches && !deleteMutation.isPending;

  const handleConfirm = () => {
    if (!canDelete) return;
    deleteMutation.mutate({ confirmEmail: emailInput.trim() });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEmailInput("");
      setKeywordInput("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Supprimer votre compte</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Cette action est <strong>définitive et irréversible</strong>. Toutes vos
            données (événements, tâches, habitudes, objectifs, journaux) seront
            supprimées immédiatement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-red-500/50 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400">
            Pour confirmer, saisissez votre adresse email et tapez{" "}
            <code className="font-mono font-semibold">{DELETE_KEYWORD}</code>.
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-email" className="text-sm font-medium">
              Votre email : <span className="text-muted-foreground">{userEmail}</span>
            </label>
            <Input
              id="confirm-email"
              type="email"
              placeholder={userEmail}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-keyword" className="text-sm font-medium">
              Tapez <code className="font-mono font-semibold">{DELETE_KEYWORD}</code>
            </label>
            <Input
              id="confirm-keyword"
              type="text"
              placeholder={DELETE_KEYWORD}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete}
          >
            {deleteMutation.isPending
              ? "Suppression…"
              : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
