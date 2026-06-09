import { cn } from "~/lib/utils";

export type EventStatusValue = "confirmed" | "prep" | "day_of" | "completed" | "cancelled";

const STATUS_STYLES: Record<EventStatusValue, { bg: string; text: string; dot: string; label: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Confirmed" },
  prep: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Prep" },
  day_of: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Day-of" },
  completed: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "Completed" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400", label: "Cancelled" },
};

interface StatusBadgeProps {
  status: EventStatusValue | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status as EventStatusValue] ?? STATUS_STYLES.confirmed;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
