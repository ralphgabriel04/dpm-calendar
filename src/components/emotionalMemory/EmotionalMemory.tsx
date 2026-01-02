"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc as api } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import {
  Heart,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Quote,
  Calendar,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmotionalMemoryProps {
  className?: string;
  compact?: boolean;
}

export function EmotionalMemory({ className, compact = false }: EmotionalMemoryProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [triggerContext, setTriggerContext] = useState("");
  const [randomIndex, setRandomIndex] = useState(0);

  const utils = api.useUtils();

  const { data: memories, isLoading } = api.emotionalMemory.list.useQuery(
    { limit: 20 },
    { enabled: expanded }
  );

  const { data: contextMemories } = api.emotionalMemory.getRelevant.useQuery(
    { context: triggerContext ? [triggerContext] : [] },
    { enabled: expanded && !!triggerContext }
  );

  const randomMemory = useMemo(() => {
    if (!memories || memories.length === 0) return null;
    return memories[randomIndex % memories.length];
  }, [memories, randomIndex]);

  const handleRefreshRandom = () => {
    if (memories && memories.length > 0) {
      setRandomIndex((prev) => (prev + 1) % memories.length);
    }
  };

  const createMutation = api.emotionalMemory.create.useMutation({
    onSuccess: () => {
      utils.emotionalMemory.list.invalidate();
      setShowForm(false);
      setMessage("");
      setContext("");
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) return;
    createMutation.mutate({
      content: message.trim(),
      context: context.trim() || undefined,
      triggerConditions: context.trim() ? [context.trim()] : [],
    });
  };

  const contextMemory = contextMemories && contextMemories.length > 0 ? contextMemories[0] : null;

  return (
    <div className={cn("rounded-xl border bg-gradient-to-br from-pink-500/5 to-rose-500/10", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <span className="font-semibold">Memoire emotionnelle</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
            </div>
          ) : (
            <>
              {randomMemory && (
                <div
                  className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={handleRefreshRandom}
                >
                  <div className="flex items-start gap-3">
                    <Quote className="h-5 w-5 text-pink-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm italic">{randomMemory.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        - Vous, {formatDistanceToNow(new Date(randomMemory.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={triggerContext}
                    onChange={(e) => setTriggerContext(e.target.value)}
                    placeholder="Rechercher un contexte..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshRandom}
                  className="h-9"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>

              {contextMemory && (
                <div className="p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-pink-500" />
                    <span className="text-xs font-medium text-pink-500">
                      Message lie a "{triggerContext}"
                    </span>
                  </div>
                  <p className="text-sm">{contextMemory.content}</p>
                </div>
              )}

              {showForm ? (
                <div className="space-y-3 p-3 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Message a vous-meme
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ecrivez un message d'encouragement..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Contexte (optionnel)
                    </label>
                    <Input
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="ex: stress, fatigue, projet X..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ce message apparaitra quand vous chercherez ce contexte
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!message.trim() || createMutation.isPending}
                      className="flex-1"
                    >
                      Enregistrer
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un message
                </Button>
              )}

              {memories && memories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Vos messages recents
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {memories.slice(0, 5).map((memory) => (
                      <div
                        key={memory.id}
                        className="p-2 rounded bg-muted/50 text-sm"
                      >
                        <p className="line-clamp-2">{memory.content}</p>
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {memory.tags
                              .filter((t) => t !== "emotional-memory")
                              .slice(0, 3)
                              .map((tag, i) => (
                                <span key={i} className="text-xs text-muted-foreground">
                                  #{tag}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
