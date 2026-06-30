"use client";

import { useParams, useRouter } from "next/navigation";
import { Mail, AlertCircle } from "lucide-react";
import { trpc } from "@/infrastructure/trpc/client";
import { Button } from "@/shared/components/ui/Button";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const acceptInvite = trpc.spaces.acceptInvite.useMutation({
    onSuccess: () => {
      router.push("/spaces");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-lg font-semibold">Invitation à un espace</h1>
        <p className="text-sm text-muted-foreground">
          Vous avez été invité à rejoindre un espace de collaboration. Cliquez
          ci-dessous pour accepter.
        </p>

        {acceptInvite.error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-left text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{acceptInvite.error.message}</span>
          </div>
        )}

        <Button
          onClick={() => acceptInvite.mutate({ token })}
          disabled={acceptInvite.isPending || acceptInvite.isSuccess}
          className="w-full"
        >
          {acceptInvite.isPending
            ? "Acceptation…"
            : acceptInvite.isSuccess
              ? "Redirection…"
              : "Accepter l'invitation"}
        </Button>
      </div>
    </div>
  );
}
