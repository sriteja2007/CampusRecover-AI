import { HTMLAttributes, forwardRef } from "react"

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs hover:shadow-md transition-all duration-200 ${className}`}
      {...props}
    />
  ),
)
Card.displayName = "Card"

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    />
  ),
)
CardHeader.displayName = "CardHeader"

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white ${className}`}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${className}`}
      {...props}
    />
  ),
)
CardDescription.displayName = "CardDescription"

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
  ),
)
CardContent.displayName = "CardContent"

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-4 ${className}`}
      {...props}
    />
  ),
)
CardFooter.displayName = "CardFooter"

export default Card
