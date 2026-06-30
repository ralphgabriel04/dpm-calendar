/**
 * TickTick Open API client (OAuth bearer token).
 *
 * The access token is obtained by a parallel OAuth flow and stored encrypted on
 * the ExternalIntegration. Here we use it as a Bearer credential against the
 * TickTick Open API:
 *   - GET /open/v1/project                 -> list the user's projects
 *   - GET /open/v1/project/{id}/data       -> tasks (+ columns) for a project
 *
 * Tasks across all projects are flattened into a single list.
 *
 * Limitations:
 * - Only tasks reachable through the listed projects are returned. The special
 *   "Inbox" is not enumerated by /project, so inbox-only tasks are not modelled.
 * - Sub-tasks (items) and recurrence are not modelled here.
 */

export interface TickTickTask {
  id: string;
  title: string;
  content?: string;
  dueDate?: string;
  priority?: number;
  tags?: string[];
}

interface TickTickProject {
  id: string;
}

interface TickTickProjectData {
  tasks?: TickTickTask[];
}

/**
 * Fetch the caller's TickTick tasks across all of their projects. The token
 * doubles as validation: an invalid token yields a 401/403 which we surface as
 * a TICKTICK_<status> error.
 */
export async function fetchTickTickTasks(token: string): Promise<TickTickTask[]> {
  const headers = { Authorization: `Bearer ${token}` };

  const projectsRes = await fetch("https://api.ticktick.com/open/v1/project", {
    headers,
  });
  if (!projectsRes.ok) throw new Error(`TICKTICK_${projectsRes.status}`);
  const projects: TickTickProject[] = await projectsRes.json();

  const tasks: TickTickTask[] = [];
  for (const project of projects) {
    const dataRes = await fetch(
      `https://api.ticktick.com/open/v1/project/${project.id}/data`,
      { headers }
    );
    if (!dataRes.ok) throw new Error(`TICKTICK_${dataRes.status}`);
    const data: TickTickProjectData = await dataRes.json();
    if (data.tasks) tasks.push(...data.tasks);
  }

  return tasks;
}

/**
 * Map TickTick's numeric priority to the DPM Priority enum.
 * TickTick uses 0 (none), 1 (low), 3 (medium), 5 (high). We treat 5 as URGENT
 * to reserve a slot for the most pressing items; anything else falls back to LOW.
 */
export function mapTickTickPriority(
  p?: number
): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  switch (p) {
    case 5:
      return "URGENT";
    case 3:
      return "HIGH";
    case 1:
      return "MEDIUM";
    default:
      return "LOW";
  }
}

/**
 * Project a TickTick task onto the shape of a DPM Task create payload.
 */
export function tickTickTaskToData(t: TickTickTask, userId: string) {
  return {
    userId,
    title: t.title,
    description: t.content || null,
    dueAt: t.dueDate ? new Date(t.dueDate) : null,
    priority: mapTickTickPriority(t.priority),
    tags: t.tags ?? [],
    status: "TODO" as const,
  };
}
