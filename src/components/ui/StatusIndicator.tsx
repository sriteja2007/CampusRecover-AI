import { HTMLAttributes } from "react"
import { ItemStatus } from "../../types/Item"

interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  status: any
  size?: "sm" | "md" | "lg"
  showText?: boolean
  showLabel?: boolean
}

export function StatusIndicator({
  status,
  size = "md",
  showText = true,
  showLabel,
  className = "",
  ...props
}: StatusIndicatorProps) {
  const isLabelVisible = showLabel !== undefined ? showLabel : showText

  const configs: Record<
    string,
    { label: string; dot: string; pulse: string; bg: string; text: string }
  > = {
    pending: {
      label: "Pending Review",
      dot: "bg-amber-500",
      pulse: "bg-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
    },
    possible_match: {
      label: "AI Match Found",
      dot: "bg-purple-500",
      pulse: "bg-purple-400 animate-ping",
      bg: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
      text: "text-purple-800 dark:text-purple-300 font-bold",
    },
    match_confirmed: {
      label: "Match Confirmed",
      dot: "bg-blue-500",
      pulse: "bg-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300 font-bold",
    },
    confirmed: {
      label: "Approved",
      dot: "bg-blue-500",
      pulse: "bg-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300 font-bold",
    },
    contact_shared: {
      label: "Contact Shared",
      dot: "bg-teal-500",
      pulse: "bg-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800",
      text: "text-teal-800 dark:text-teal-300",
    },
    handover_pending: {
      label: "Handover Ready",
      dot: "bg-indigo-500",
      pulse: "bg-indigo-400 animate-pulse",
      bg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-800 dark:text-indigo-300 font-bold",
    },
    recovered: {
      label: "Recovered",
      dot: "bg-emerald-500",
      pulse: "bg-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-300 font-bold",
    },
    returned: {
      label: "Returned",
      dot: "bg-emerald-500",
      pulse: "bg-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-300 font-bold",
    },
    rejected: {
      label: "Rejected",
      dot: "bg-rose-500",
      pulse: "bg-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
      text: "text-rose-800 dark:text-rose-300",
    },
    closed: {
      label: "Closed",
      dot: "bg-slate-400",
      pulse: "bg-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      text: "text-slate-600 dark:text-slate-400",
    },
  }

  const current = configs[status] || {
    label: (status || "Unknown").replace(/_/g, " "),
    dot: "bg-slate-400",
    pulse: "bg-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses[size]} ${current.bg} ${current.text} ${className}`}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${current.pulse}`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${current.dot}`}
        />
      </span>
      {isLabelVisible && <span>{current.label}</span>}
    </span>
  )
}
export default StatusIndicator
