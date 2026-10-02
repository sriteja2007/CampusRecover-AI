import React from "react"

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      {/* Base rounded shield container */}
      <rect width="100" height="100" rx="26" fill="url(#logoGrad)" />
      
      {/* Campus building arch contour */}
      <path
        d="M26 72V48C26 34.745 36.745 24 50 24C63.255 24 74 34.745 74 48V72"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      
      {/* Pin / Discovery Loop */}
      <circle cx="50" cy="46" r="16" stroke="white" strokeWidth="7" fill="#0D9488" />
      
      {/* Recovery Checkmark inside Pin */}
      <path
        d="M44 46L48 50L57 41"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* AI Pulse / Sparkle Star */}
      <path
        d="M72 26L77 18M77 18H70M77 18V25"
        stroke="#F59E0B"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Base ground line */}
      <path
        d="M32 72H68"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({
  size = 32,
  showTagline = false,
  className = "",
}: {
  size?: number
  showTagline?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
            Campus <span className="text-blue-600 dark:text-blue-400">Recover</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-extrabold tracking-wider">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">
            Lost something? Found something? Let&apos;s reunite it.
          </span>
        )}
      </div>
    </div>
  )
}

export default Logo
