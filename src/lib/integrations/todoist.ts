/**
 * Todoist REST API v2 client (token-based, no OAuth app registration).
 *
 * The user pastes a personal API token from
 * Todoist -> Settings -> Integrations -> "API token". That token is used as a
 * Bearer credential against https://api.todoist.com/rest/v2/tasks.
 *
 * Limitations:
 * - Only active (non-completed) tasks are returned by the REST endpoint.
 * - Recurrence (due.is_recurring), sections and sub-tasks are not modelled here.
 */

export interface TodoistTask {
  id: string;
  content: string;
  description?: string;
  priority: number;
  labels?: string[];
  due?: { date?: string } | null;
  project_id?: string;
}

/**
 * Fetch the caller's active Todoist tasks. The token doubles as validation:
 * an invalid token yields a 401/403 which we surface as a TODOIST_<status> error.
 */
export async function fetchTodoistTasks(token: string): Promise<TodoistTask[]> {
  const res = await fetch("https://api.todoist.com/rest/v2/tasks", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`TODOIST_${res.status}`);
  return res.json();
}

/**
 * Map Todoist's numeric priority (1..4, 4 being most urgent) to the DPM
 * Priority enum. Anything unexpected falls back to LOW.
 */
export function mapTodoistPriority(p: number): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  switch (p) {
    case 4:
      return "URGENT";
    case 3:
      return "HIGH";
    case 2:
      return "MEDIUM";
    default:
      return "LOW";
  }
}

/**
 * Project a Todoist task onto the shape of a DPM Task create payload.
 */
export function todoistTaskToData(t: TodoistTask, userId: string) {
  return {
    userId,
    title: t.content,
    description: t.description || null,
    dueAt: t.due?.date ? new Date(t.due.date) : null,
    priority: mapTodoistPriority(t.priority),
    tags: t.labels ?? [],
    status: "TODO" as const,
  };
}
