import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

export function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "dropdown" | "pills"
}) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  if (variant === "pills") {
    return (
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
            theme === "light"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
          aria-label="Light theme"
        >
          <Sun size={13} /> Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
            theme === "dark"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
          aria-label="Dark theme"
        >
          <Moon size={13} /> Dark
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
            theme === "system"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
          aria-label="System theme"
        >
          <Monitor size={13} /> System
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      title={`Current: ${theme} (${resolvedTheme}). Click to toggle.`}
      aria-label={`Switch theme (currently ${resolvedTheme})`}
    >
      {resolvedTheme === "dark" ? (
        <Sun
          size={18}
          className="text-amber-400 hover:rotate-45 transition-transform"
        />
      ) : (
        <Moon
          size={18}
          className="text-gray-600 hover:-rotate-12 transition-transform"
        />
      )}
    </button>
  )
}

export default ThemeToggle
