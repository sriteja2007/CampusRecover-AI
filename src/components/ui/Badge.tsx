import { HTMLAttributes, forwardRef } from "react"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[#eaedff] text-[#2563eb]",
      success: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20",
      warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
      destructive: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
      outline: "text-gray-600 ring-1 ring-inset ring-gray-200",
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
        {...props}
      />
    )
  },
)
Badge.displayName = "Badge"
