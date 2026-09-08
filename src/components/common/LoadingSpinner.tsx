import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg" | "xl"
  fullScreen?: boolean
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 36,
  xl: 48,
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const iconSize = SIZE_MAP[size]

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2
        size={iconSize}
        className="animate-spin text-blue-600 dark:text-blue-400"
      />
      {message && (
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner
