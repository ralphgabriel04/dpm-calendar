"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

const ROLE_KEYS: Record<string, string> = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
};

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {label}
    </span>
  );
}

export default function SpacesPage() {
  const t = useTranslations("spaces");
  const roleLabel = (role: string) =>
    ROLE_KEYS[role] ? t(`roles.${ROLE_KEYS[role]}` as never) : role;
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
      toast.success(t("spaceCreated"));
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
        toast.success(t("inviteSent"));
      } else {
        setInviteUrl(res.inviteUrl);
        toast.info(t("emailNotConfiguredToast"));
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.spaces.removeMember.useMutation({
    onSuccess: () => {
      invalidateMembers();
      invalidateList();
      toast.success(t("memberRemoved"));
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRole = trpc.spaces.updateRole.useMutation({
    onSuccess: () => {
      invalidateMembers();
      toast.success(t("roleUpdated"));
    },
    onError: (e) => toast.error(e.message),
  });

  const leave = trpc.spaces.leave.useMutation({
    onSuccess: () => {
      setSelectedId(null);
      invalidateList();
      toast.success(t("leftSpace"));
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
    toast.success(t("linkCopied"));
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{t("title")}</h1>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: list + create */}
          <div className="space-y-4">
            <form
              onSubmit={submitCreate}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <label className="text-sm font-medium">{t("createLabel")}</label>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  aria-label={t("nameAria")}
                  className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                />
                <Button type="submit" size="sm" disabled={createSpace.isPending}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {createSpace.isPending ? t("creating") : t("create")}
                </Button>
              </div>
            </form>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : !spaces || spaces.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("empty")}
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
                            {t("personal")}
                          </span>
                        )}
                      </h3>
                      <RoleBadge label={roleLabel(space.role)} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("memberCount", { count: space.memberCount })}
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
                {t("selectPrompt")}
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
                        {t("leave")}
                      </Button>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    {!members ? (
                      <p className="text-sm text-muted-foreground">
                        {t("membersLoading")}
                      </p>
                    ) : members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("noMembers")}
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
                                aria-label={t("memberRoleAria")}
                                className="h-8 rounded-md border bg-background px-2 text-xs"
                              >
                                <option value="ADMIN">{t("roles.admin")}</option>
                                <option value="MEMBER">{t("roles.member")}</option>
                              </select>
                            ) : (
                              <RoleBadge label={roleLabel(m.role)} />
                            )}
                            {canManage && m.role !== "OWNER" && (
                              <button
                                onClick={() =>
                                  removeMember.mutate({
                                    spaceId: selectedSpace.id,
                                    userId: m.user.id,
                                  })
                                }
                                title={t("removeMember")}
                                aria-label={t("removeMember")}
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
                        {t("inviteTitle")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder={t("inviteEmailPlaceholder")}
                        aria-label={t("inviteEmailAria")}
                        className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        aria-label={t("inviteRoleAria")}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                      >
                        <option value="MEMBER">{t("roles.member")}</option>
                        <option value="ADMIN">{t("roles.admin")}</option>
                      </select>
                      <Button type="submit" size="sm" disabled={invite.isPending}>
                        <Mail className="mr-1.5 h-4 w-4" />
                        {invite.isPending ? t("sending") : t("invite")}
                      </Button>
                    </div>

                    {inviteUrl && (
                      <div className="rounded-md border border-dashed bg-muted/40 p-3 space-y-2">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {t("emailNotConfigured")}
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={inviteUrl}
                            aria-label={t("inviteUrlAria")}
                            className="h-8 flex-1 rounded-md border bg-background px-2 text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyInviteUrl}
                          >
                            <Copy className="mr-1.5 h-4 w-4" />
                            {t("copyLink")}
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
