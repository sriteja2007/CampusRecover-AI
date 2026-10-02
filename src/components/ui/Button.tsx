import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl"

    const variants = {
      primary:
        "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm shadow-blue-500/20",
      secondary:
        "bg-[#14b8a6] text-white hover:bg-[#0f766e] shadow-sm shadow-teal-500/20",
      outline:
        "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
      ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200",
      destructive:
        "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20",
    }

    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-11 px-8 text-base",
      icon: "h-10 w-10",
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"
export default Button
