"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSquare, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCommentsProps {
  eventId: string;
  className?: string;
}

export function EventComments({ eventId, className }: EventCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const utils = api.useUtils();

  const { data: comments, isLoading } = api.comment.listForEvent.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  const createMutation = api.comment.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      utils.comment.listForEvent.invalidate({ eventId });
    },
  });

  const updateMutation = api.comment.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setEditContent("");
      utils.comment.listForEvent.invalidate({ eventId });
    },
  });

  const deleteMutation = api.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.listForEvent.invalidate({ eventId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ eventId, content: newComment.trim() });
  };

  const handleUpdate = () => {
    if (!editingId || !editContent.trim()) return;
    updateMutation.mutate({ id: editingId, content: editContent.trim() });
  };

  const startEditing = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        <span>Commentaires</span>
        {comments && comments.length > 0 && (
          <span className="text-muted-foreground">({comments.length})</span>
        )}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground animate-pulse">
          Chargement...
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Avatar
                src={comment.user.image}
                name={comment.user.name || comment.user.email}
                className="h-8 w-8 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {comment.user.name || comment.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(comment.id, comment.content)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: comment.id })}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun commentaire
        </p>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="min-h-[60px] text-sm flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || createMutation.isPending}
          className="flex-shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
