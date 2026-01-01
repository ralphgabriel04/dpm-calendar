"use client";

import { format } from "date-fns";
import { CheckSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
}

interface TimeBlock {
  id: string;
  startAt: Date;
  endAt: Date;
  duration: number;
  status: string;
  task: Task;
}

interface TimeBlockCardProps {
  timeBlock: TimeBlock;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}

const priorityColors = {
  LOW: "border-l-slate-400",
  MEDIUM: "border-l-blue-500",
  HIGH: "border-l-orange-500",
  URGENT: "border-l-red-500",
};

export function TimeBlockCard({
  timeBlock,
  style,
  onClick,
  className,
}: TimeBlockCardProps) {
  const { task } = timeBlock;
  const isCompleted = task.status === "DONE";

  return (
    <div
      className={cn(
        "absolute rounded-md px-2 py-1 text-xs cursor-pointer overflow-hidden",
        "bg-amber-500/80 hover:bg-amber-500 border-l-4",
        priorityColors[task.priority],
        isCompleted && "opacity-60 line-through",
        className
      )}
      style={{
        ...style,
        color: "#fff",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="flex items-center gap-1">
        <CheckSquare className="h-3 w-3 flex-shrink-0" />
        <span className="font-medium truncate">{task.title}</span>
      </div>
      <div className="flex items-center gap-1 text-amber-100 text-[10px] mt-0.5">
        <Clock className="h-2.5 w-2.5" />
        <span>
          {format(new Date(timeBlock.startAt), "HH:mm")} -{" "}
          {format(new Date(timeBlock.endAt), "HH:mm")}
        </span>
      </div>
    </div>
  );
}
