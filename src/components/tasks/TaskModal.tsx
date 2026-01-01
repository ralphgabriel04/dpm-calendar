"use client";

import { Modal } from "@/components/ui/Modal";
import { TaskForm, type TaskFormData } from "./TaskForm";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function TaskModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onDelete,
  isLoading,
  mode = "create",
}: TaskModalProps) {
  const handleSubmit = (data: TaskFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Nouvelle tâche" : "Modifier la tâche"}
      className="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <TaskForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        onDelete={onDelete}
        isLoading={isLoading}
        mode={mode}
      />
    </Modal>
  );
}
