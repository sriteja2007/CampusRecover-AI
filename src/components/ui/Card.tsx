import { HTMLAttributes, forwardRef } from "react"

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-gray-100 bg-white text-gray-950 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
      {...props}
    />
  ),
)
Card.displayName = "Card"

export const CardHeader =
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = "", ...props }, ref) => (
      <div
        ref={ref}
        className={`flex flex-col space-y-1.5 p-6 ${className}`}
        {...props}
      />
    ),
  )
CardHeader.displayName = "CardHeader"

export const CardTitle =
  forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className = "", ...props }, ref) => (
      <h3
        ref={ref}
        className={`font-bold leading-none tracking-tight text-[#131b2e] ${className}`}
        {...props}
      />
    ),
  )
CardTitle.displayName = "CardTitle"

export const CardContent =
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = "", ...props }, ref) => (
      <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
    ),
  )
CardContent.displayName = "CardContent"
