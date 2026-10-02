import { HTMLAttributes, forwardRef, ReactNode } from "react"

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline"
  | "lost"
  | "found"
  | "ai"
  | "recovered"
  | "purple"
  | "neutral"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  dot?: boolean
  icon?: ReactNode
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", dot = false, icon, children, ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      default:
        "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      lost:
        "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      found:
        "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      ai:
        "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold",
      recovered:
        "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      success:
        "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      warning:
        "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      destructive:
        "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
      purple:
        "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      neutral:
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      outline:
        "bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    }

    const dotColors: Record<BadgeVariant, string> = {
      default: "bg-blue-500",
      lost: "bg-rose-500",
      found: "bg-teal-500",
      ai: "bg-purple-500 animate-pulse",
      recovered: "bg-emerald-500",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      destructive: "bg-red-500",
      purple: "bg-indigo-500",
      neutral: "bg-slate-400",
      outline: "bg-slate-400",
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${variants[variant]} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || "bg-current"}`}
            aria-hidden="true"
          />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    )
  },
)

Badge.displayName = "Badge"
export default Badge
