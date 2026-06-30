"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  UserPlus,
  Trash2,
  LogOut,
  Copy,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";

type Role = "OWNER" | "ADMIN" | "MEMBER";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Admin",
  MEMBER: "Membre",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

export default function SpacesPage() {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const { data: spaces, isLoading } = trpc.spaces.list.useQuery();
  const invalidateList = () => utils.spaces.list.invalidate();

  const createSpace = trpc.spaces.create.useMutation({
    onSuccess: () => {
      setName("");
      invalidateList();
      toast.success("Espace créé");
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedSpace = spaces?.find((s) => s.id === selectedId) ?? null;

  const { data: members } = trpc.spaces.members.useQuery(
    { spaceId: selectedId! },
    { enabled: !!selectedId }
  );

  const invalidateMembers = () => {
    if (selectedId) utils.spaces.members.invalidate({ spaceId: selectedId });
  };

  const myRole = selectedSpace?.role;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  const invite = trpc.spaces.invite.useMutation({
    onSuccess: (res) => {
      setInviteEmail("");
      utils.spaces.list.invalidate();
      if (res.emailSent) {
        setInviteUrl(null);
        toast.success("Invitation envoyée");
      } else {
        setInviteUrl(res.inviteUrl);
        toast.info("Email non configuré — copiez le lien d'invitation");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.spaces.removeMember.useMutation({
    onSuccess: () => {
      invalidateMembers();
      invalidateList();
      toast.success("Membre retiré");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRole = trpc.spaces.updateRole.useMutation({
    onSuccess: () => {
      invalidateMembers();
      toast.success("Rôle mis à jour");
    },
    onError: (e) => toast.error(e.message),
  });

  const leave = trpc.spaces.leave.useMutation({
    onSuccess: () => {
      setSelectedId(null);
      invalidateList();
      toast.success("Vous avez quitté l'espace");
    },
    onError: (e) => toast.error(e.message),
  });

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createSpace.mutate({ name: name.trim() });
  };

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !inviteEmail.trim()) return;
    setInviteUrl(null);
    invite.mutate({
      spaceId: selectedId,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  const copyInviteUrl = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Lien copié");
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Espaces</h1>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: list + create */}
          <div className="space-y-4">
            <form
              onSubmit={submitCreate}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <label className="text-sm font-medium">Créer un espace</label>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom de l'espace"
                  aria-label="Nom de l'espace"
                  className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                />
                <Button type="submit" size="sm" disabled={createSpace.isPending}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {createSpace.isPending ? "Création…" : "Créer"}
                </Button>
              </div>
            </form>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : !spaces || spaces.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun espace pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => {
                      setSelectedId(space.id);
                      setInviteUrl(null);
                    }}
                    className={cn(
                      "w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/50",
                      selectedId === space.id && "ring-1 ring-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium truncate">
                        {space.name}
                        {space.isPersonal && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (personnel)
                          </span>
                        )}
                      </h3>
                      <RoleBadge role={space.role} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {space.memberCount}{" "}
                      {space.memberCount > 1 ? "membres" : "membre"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: members + invite */}
          <div className="space-y-4">
            {!selectedSpace ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sélectionnez un espace pour voir ses membres.
              </p>
            ) : (
              <>
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h2 className="font-medium">{selectedSpace.name}</h2>
                    </div>
                    {!selectedSpace.isPersonal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => leave.mutate({ spaceId: selectedSpace.id })}
                        disabled={leave.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <LogOut className="mr-1.5 h-4 w-4" />
                        Quitter
                      </Button>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    {!members ? (
                      <p className="text-sm text-muted-foreground">Chargement…</p>
                    ) : members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucun membre.
                      </p>
                    ) : (
                      members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-accent/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {m.user.name ?? m.user.email}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.user.email}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {canManage && m.role !== "OWNER" ? (
                              <select
                                value={m.role}
                                onChange={(e) =>
                                  updateRole.mutate({
                                    spaceId: selectedSpace.id,
                                    userId: m.user.id,
                                    role: e.target.value as Role,
                                  })
                                }
                                disabled={updateRole.isPending}
                                aria-label="Rôle du membre"
                                className="h-8 rounded-md border bg-background px-2 text-xs"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Membre</option>
                              </select>
                            ) : (
                              <RoleBadge role={m.role} />
                            )}
                            {canManage && m.role !== "OWNER" && (
                              <button
                                onClick={() =>
                                  removeMember.mutate({
                                    spaceId: selectedSpace.id,
                                    userId: m.user.id,
                                  })
                                }
                                title="Retirer le membre"
                                aria-label="Retirer le membre"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {canManage && (
                  <form
                    onSubmit={submitInvite}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Inviter un membre
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        aria-label="Email de l'invité"
                        className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        aria-label="Rôle de l'invité"
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                      >
                        <option value="MEMBER">Membre</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <Button type="submit" size="sm" disabled={invite.isPending}>
                        <Mail className="mr-1.5 h-4 w-4" />
                        {invite.isPending ? "Envoi…" : "Inviter"}
                      </Button>
                    </div>

                    {inviteUrl && (
                      <div className="rounded-md border border-dashed bg-muted/40 p-3 space-y-2">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          L'envoi d'email n'est pas configuré. Partagez ce lien
                          manuellement :
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={inviteUrl}
                            aria-label="Lien d'invitation"
                            className="h-8 flex-1 rounded-md border bg-background px-2 text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyInviteUrl}
                          >
                            <Copy className="mr-1.5 h-4 w-4" />
                            Copier le lien
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
