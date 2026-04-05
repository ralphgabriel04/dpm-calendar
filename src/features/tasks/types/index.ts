/**
 * Tasks feature types
 */

export interface TaskFormData {
  title: string;
  description?: string;
  notes?: string;
  url?: string;
  dueAt?: Date;
  plannedStartAt?: Date;
  plannedDuration?: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  tags: string[];
  estimatedEnergy?: "LOW" | "MEDIUM" | "HIGH";
  checklistItems: Array<{ id?: string; title: string; isCompleted: boolean }>;
}
