import { LucideIcon, PackageOpen } from "lucide-react"
import { Link } from "react-router"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onActionClick?: () => void
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  secondaryLabel,
  secondaryHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
        <Icon size={32} />
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && actionHref && (
          <Link
            to={actionHref}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
          >
            {actionLabel}
          </Link>
        )}

        {actionLabel && onActionClick && !actionHref && (
          <button
            type="button"
            onClick={onActionClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all cursor-pointer"
          >
            {actionLabel}
          </button>
        )}

        {secondaryLabel && secondaryHref && (
          <Link
            to={secondaryHref}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-all"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

export default EmptyState
