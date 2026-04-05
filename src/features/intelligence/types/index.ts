/**
 * Intelligence feature types (Rules & Suggestions)
 */

export type ConditionOperator = "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "notIn";
export type ActionType = "block_time" | "add_break" | "reschedule" | "notify" | "auto_decline";

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface Action {
  type: ActionType;
  params?: Record<string, unknown>;
}

export interface RuleFormData {
  name: string;
  description?: string;
  ruleType: "PROTECTION" | "AUTO_SCHEDULE" | "BREAK" | "CONDITIONAL";
  triggerType: "EVENT_CREATED" | "EVENT_UPDATED" | "TIME_BASED" | "MANUAL";
  schedule?: string;
  dayTypes?: string[];
  conditions: Condition[];
  actions: Action[];
  priority: number;
  isActive: boolean;
}
