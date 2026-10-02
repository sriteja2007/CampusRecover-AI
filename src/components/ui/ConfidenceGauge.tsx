import { ConfidenceLevel } from "../../types/Match"

interface ConfidenceGaugeProps {
  score: number
  confidenceLevel?: ConfidenceLevel
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function ConfidenceGauge({
  score,
  confidenceLevel,
  size = "md",
  showLabel = true,
}: ConfidenceGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score || 0)))

  // Determine level if not supplied
  const level =
    confidenceLevel ||
    (normalizedScore >= 80 ? "high" : normalizedScore >= 60 ? "possible" : "low")

  const themeConfig = {
    high: {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
      barColor: "bg-emerald-500",
      ringColor: "#10b981",
      label: "High Similarity",
    },
    possible: {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
      barColor: "bg-amber-500",
      ringColor: "#f59e0b",
      label: "Potential Match",
    },
    low: {
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      barColor: "bg-slate-400",
      ringColor: "#94a3b8",
      label: "Low Similarity",
    },
  }[level]

  if (size === "sm") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${themeConfig.bg} ${themeConfig.color}`}
      >
        <span className="font-mono">{normalizedScore}%</span>
        {showLabel && <span className="font-medium">· {themeConfig.label}</span>}
      </div>
    )
  }

  // Circular gauge for md and lg
  const radius = size === "lg" ? 36 : 28
  const stroke = size === "lg" ? 6 : 5
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference
  const dim = size === "lg" ? 88 : 72

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg width={dim} height={dim} className="rotate-[-90deg]">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-200 dark:text-slate-800 fill-none"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke={themeConfig.ringColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-700 ease-out"
          />
        </svg>
        <span
          className={`absolute text-center font-mono font-black ${
            size === "lg" ? "text-lg" : "text-sm"
          } text-slate-900 dark:text-white`}
        >
          {normalizedScore}%
        </span>
      </div>

      {showLabel && (
        <div className="space-y-0.5">
          <div className={`text-xs font-bold uppercase tracking-wider ${themeConfig.color}`}>
            {themeConfig.label}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Multimodal AI Confidence
          </p>
        </div>
      )}
    </div>
  )
}
export default ConfidenceGauge
