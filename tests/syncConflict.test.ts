import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Sync conflict resolution — pure-logic tests.
 *
 * The sync router's conflict detection is driven by two booleans:
 *   hasLocalChanges  = existing.syncStatus === "PENDING_PUSH"
 *   hasRemoteChanges = existing.etag !== remoteEtag
 *
 * Matrix:
 *   local  remote  -> outcome
 *   F      F       -> overwrite local with remote (SYNCED)
 *   F      T       -> overwrite local with remote (SYNCED)
 *   T      F       -> preserve local, no conflict
 *   T      T       -> CONFLICT, write to ConflictLog, mark event CONFLICT
 *
 * These pure helpers replicate the router's decision policy so we can
 * assert the full matrix without hitting a database.
 */

type SyncStatus = "SYNCED" | "PENDING_PUSH" | "CONFLICT";

interface LocalEvent {
  id: string;
  etag: string | null;
  syncStatus: SyncStatus;
  title: string;
}

interface RemoteEvent {
  id: string;
  etag: string;
  title: string;
  isCancelled?: boolean;
}

type Outcome =
  | { kind: "CONFLICT"; conflictType: "UPDATE_CONFLICT" | "DELETE_CONFLICT" }
  | { kind: "PRESERVE_LOCAL" }
  | { kind: "OVERWRITE_LOCAL_WITH_REMOTE" }
  | { kind: "CREATE_LOCAL" }
  | { kind: "DELETE_LOCAL" };

function resolveSyncConflict(
  existing: LocalEvent | null,
  remote: RemoteEvent
): Outcome {
  if (!existing) {
    return remote.isCancelled
      ? { kind: "DELETE_LOCAL" }
      : { kind: "CREATE_LOCAL" };
  }

  if (remote.isCancelled) {
    if (existing.syncStatus === "PENDING_PUSH") {
      return { kind: "CONFLICT", conflictType: "DELETE_CONFLICT" };
    }
    return { kind: "DELETE_LOCAL" };
  }

  const hasLocalChanges = existing.syncStatus === "PENDING_PUSH";
  const hasRemoteChanges = existing.etag !== remote.etag;

  if (hasLocalChanges && hasRemoteChanges) {
    return { kind: "CONFLICT", conflictType: "UPDATE_CONFLICT" };
  }
  if (hasLocalChanges && !hasRemoteChanges) {
    return { kind: "PRESERVE_LOCAL" };
  }
  return { kind: "OVERWRITE_LOCAL_WITH_REMOTE" };
}

// Simulates the FULL sync merge: apply resolution + write ConflictLog entries
// through an injected writer, so we can assert the side-effects.
interface ConflictLog {
  eventId: string;
  conflictType: "UPDATE_CONFLICT" | "DELETE_CONFLICT";
}

function mergeFullSync(
  locals: LocalEvent[],
  remotes: RemoteEvent[],
  conflictWriter: (c: ConflictLog) => void
): { merged: LocalEvent[]; created: RemoteEvent[]; deleted: string[] } {
  const merged: LocalEvent[] = [];
  const created: RemoteEvent[] = [];
  const deleted: string[] = [];
  const localById = new Map(locals.map((l) => [l.id, l]));

  for (const r of remotes) {
    const existing = localById.get(r.id) ?? null;
    const outcome = resolveSyncConflict(existing, r);
    switch (outcome.kind) {
      case "CREATE_LOCAL":
        created.push(r);
        break;
      case "OVERWRITE_LOCAL_WITH_REMOTE":
        merged.push({ ...existing!, etag: r.etag, title: r.title, syncStatus: "SYNCED" });
        break;
      case "PRESERVE_LOCAL":
        merged.push(existing!);
        break;
      case "CONFLICT":
        conflictWriter({ eventId: existing!.id, conflictType: outcome.conflictType });
        merged.push({ ...existing!, syncStatus: "CONFLICT" });
        break;
      case "DELETE_LOCAL":
        if (existing) deleted.push(existing.id);
        break;
    }
  }
  return { merged, created, deleted };
}

describe("sync conflict resolution", () => {
  let conflictWriter: ((c: ConflictLog) => void) & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    conflictWriter = vi.fn<(c: ConflictLog) => void>() as typeof conflictWriter;
  });

  it("preserves local changes when remote has no changes (PENDING_PUSH + same etag)", () => {
    const local: LocalEvent = {
      id: "e1",
      etag: "v1",
      syncStatus: "PENDING_PUSH",
      title: "Local Title",
    };
    const remote: RemoteEvent = { id: "e1", etag: "v1", title: "Remote Title" };
    const outcome = resolveSyncConflict(local, remote);
    expect(outcome.kind).toBe("PRESERVE_LOCAL");
  });

  it("flags UPDATE_CONFLICT when both local and remote have changes", () => {
    const local: LocalEvent = {
      id: "e1",
      etag: "v1",
      syncStatus: "PENDING_PUSH",
      title: "Local",
    };
    const remote: RemoteEvent = { id: "e1", etag: "v2", title: "Remote" };
    const outcome = resolveSyncConflict(local, remote);
    expect(outcome).toEqual({
      kind: "CONFLICT",
      conflictType: "UPDATE_CONFLICT",
    });
  });

  it("writes resolved UPDATE_CONFLICT entries to ConflictLog during merge", () => {
    const locals: LocalEvent[] = [
      { id: "e1", etag: "v1", syncStatus: "PENDING_PUSH", title: "L1" },
      { id: "e2", etag: "x1", syncStatus: "SYNCED", title: "L2" },
    ];
    const remotes: RemoteEvent[] = [
      { id: "e1", etag: "v2", title: "R1" }, // conflict
      { id: "e2", etag: "x2", title: "R2" }, // safe overwrite
    ];
    const result = mergeFullSync(locals, remotes, conflictWriter);
    expect(conflictWriter).toHaveBeenCalledTimes(1);
    expect(conflictWriter).toHaveBeenCalledWith({
      eventId: "e1",
      conflictType: "UPDATE_CONFLICT",
    });
    // e1 marked CONFLICT, e2 overwritten SYNCED
    const e1 = result.merged.find((e) => e.id === "e1")!;
    const e2 = result.merged.find((e) => e.id === "e2")!;
    expect(e1.syncStatus).toBe("CONFLICT");
    expect(e2.syncStatus).toBe("SYNCED");
    expect(e2.title).toBe("R2");
  });

  it("FULL sync merge: creates, overwrites, preserves, and conflicts correctly", () => {
    const locals: LocalEvent[] = [
      { id: "a", etag: "1", syncStatus: "SYNCED", title: "A-local" }, // overwrite
      { id: "b", etag: "1", syncStatus: "PENDING_PUSH", title: "B-local" }, // preserve
      { id: "c", etag: "1", syncStatus: "PENDING_PUSH", title: "C-local" }, // conflict
    ];
    const remotes: RemoteEvent[] = [
      { id: "a", etag: "2", title: "A-remote" },
      { id: "b", etag: "1", title: "B-remote" },
      { id: "c", etag: "2", title: "C-remote" },
      { id: "d", etag: "1", title: "D-remote" }, // new
    ];
    const result = mergeFullSync(locals, remotes, conflictWriter);

    expect(result.created).toHaveLength(1);
    expect(result.created[0].id).toBe("d");
    expect(conflictWriter).toHaveBeenCalledTimes(1);

    const b = result.merged.find((e) => e.id === "b")!;
    expect(b.title).toBe("B-local"); // preserved
    const a = result.merged.find((e) => e.id === "a")!;
    expect(a.title).toBe("A-remote"); // overwritten
  });

  it("DELETE_CONFLICT fires when remote is cancelled but local has PENDING_PUSH", () => {
    const local: LocalEvent = {
      id: "e1",
      etag: "v1",
      syncStatus: "PENDING_PUSH",
      title: "Local",
    };
    const remote: RemoteEvent = {
      id: "e1",
      etag: "v1",
      title: "ignored",
      isCancelled: true,
    };
    const outcome = resolveSyncConflict(local, remote);
    expect(outcome).toEqual({
      kind: "CONFLICT",
      conflictType: "DELETE_CONFLICT",
    });
  });
});
