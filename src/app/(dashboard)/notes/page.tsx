"use client";

import { useState } from "react";
import { Pin, PinOff, Trash2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/infrastructure/trpc/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";

export default function NotesPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: notes, isLoading } = trpc.notes.list.useQuery(
    search ? { search } : {}
  );

  const invalidate = () => utils.notes.list.invalidate();

  const createNote = trpc.notes.create.useMutation({
    onSuccess: () => {
      setTitle("");
      setContent("");
      invalidate();
      toast.success("Note créée");
    },
    onError: (e) => toast.error(e.message),
  });
  const togglePin = trpc.notes.togglePin.useMutation({ onSuccess: invalidate });
  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Note supprimée");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    createNote.mutate({ title: title.trim(), content: content.trim() });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Notes</h1>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          aria-label="Rechercher des notes"
          className="h-9 w-48 rounded-md border bg-background px-3 text-sm"
        />
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Create */}
        <form
          onSubmit={submit}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            aria-label="Titre de la note"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre note (Markdown supporté)…"
            aria-label="Contenu de la note"
            rows={3}
            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={createNote.isPending}>
              {createNote.isPending ? "Création…" : "Ajouter"}
            </Button>
          </div>
        </form>

        {/* List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !notes || notes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune note pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "rounded-lg border bg-card p-4 flex flex-col gap-2",
                  note.isPinned && "ring-1 ring-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium truncate">
                    {note.title || "Sans titre"}
                  </h3>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => togglePin.mutate({ id: note.id })}
                      title={note.isPinned ? "Désépingler" : "Épingler"}
                      aria-label={note.isPinned ? "Désépingler" : "Épingler"}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {note.isPinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteNote.mutate({ id: note.id })}
                      title="Supprimer"
                      aria-label="Supprimer la note"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-6">
                    {note.content}
                  </p>
                )}
                {note.tags.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-1">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
