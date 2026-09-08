import { useState, useEffect } from "react"
import { WifiOff, Wifi, RefreshCw } from "lucide-react"
import { PWA } from "../../services/pwa.service"

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(PWA.isOnline())
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const unsubscribe = PWA.subscribeConnectivity((online) => {
      setIsOnline(online)
      if (online) {
        setShowReconnected(true)
        const timer = setTimeout(() => setShowReconnected(false), 3500)
        return () => clearTimeout(timer)
      }
    })

    return unsubscribe
  }, [])

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
        <Wifi size={14} /> Back online. Synced with campus network.
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
        <WifiOff size={14} className="animate-pulse" />
        <span>
          You are currently offline. Viewing cached local campus data.
          Submissions will sync when connected.
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-2 px-2 py-0.5 bg-slate-900/10 hover:bg-slate-900/20 rounded text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
        >
          <RefreshCw size={10} /> Check Connection
        </button>
      </div>
    )
  }

  return null
}

export default OfflineBanner
