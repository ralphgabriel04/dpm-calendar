"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface TimeDistributionChartProps {
  focusMins: number;
  meetingMins: number;
  breakMins: number;
  className?: string;
}

const COLORS = {
  focus: "#22c55e", // green-500
  meeting: "#3b82f6", // blue-500
  break: "#f97316", // orange-500
};

export function TimeDistributionChart({
  focusMins,
  meetingMins,
  breakMins,
  className,
}: TimeDistributionChartProps) {
  const total = focusMins + meetingMins + breakMins;

  const data = [
    { name: "Focus", value: focusMins, color: COLORS.focus },
    { name: "Réunions", value: meetingMins, color: COLORS.meeting },
    { name: "Pauses", value: breakMins, color: COLORS.break },
  ].filter((d) => d.value > 0);

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  if (total === 0) {
    return (
      <div className={cn("rounded-xl border bg-card p-6", className)}>
        <h3 className="font-semibold mb-4">Distribution du temps</h3>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Aucune donnée</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <h3 className="font-semibold mb-4">Distribution du temps</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMinutes(Number(value) || 0)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Focus</span>
          </div>
          <p className="font-medium text-sm">{formatMinutes(focusMins)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Réunions</span>
          </div>
          <p className="font-medium text-sm">{formatMinutes(meetingMins)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">Pauses</span>
          </div>
          <p className="font-medium text-sm">{formatMinutes(breakMins)}</p>
        </div>
      </div>
    </div>
  );
}
