/**
 * Goals feature types
 */

export interface GoalFormData {
  title: string;
  description?: string;
  category?: string;
  targetType: "CUMULATIVE" | "STREAK" | "COMPLETION";
  targetValue: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
}
