/**
 * Habits feature types
 */

export interface HabitFormData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  habitType: "FIXED" | "FLEXIBLE" | "CONDITIONAL";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  targetCount: number;
  duration?: number;
  preferredTime?: string;
  preferredDays?: number[];
  isProtected: boolean;
  goalId?: string;
}
