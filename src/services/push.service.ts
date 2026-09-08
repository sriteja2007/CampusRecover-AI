/**
 * Push Notification Service
 *
 * Manages Web Push API permissions and dispatches native browser notifications
 * with audio feedback and action click handlers.
 */

export const PushNotificationService = {
  /**
   * Check if web notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window
  },

  /**
   * Get current permission state
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return "denied"
    return Notification.permission
  },

  /**
   * Requests user permission for native browser push notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false
    try {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    } catch {
      return false
    }
  },

  /**
   * Dispatches a native browser notification
   */
  sendNotification(
    title: string,
    options?: {
      body?: string
      icon?: string
      data?: any
      onClick?: () => void
    },
  ): Notification | null {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return null
    }

    try {
      const notif = new Notification(title, {
        body: options?.body || "",
        icon: options?.icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "campusrecover-alert",
      })

      if (options?.onClick) {
        notif.onclick = (e) => {
          e.preventDefault()
          window.focus()
          options.onClick!()
          notif.close()
        }
      }

      // Audio feedback chime using Web Audio API
      this.playChime()

      return notif
    } catch (err) {
      console.warn("Native notification failed:", err)
      return null
    }
  },

  /**
   * Synthesizes a gentle notification tone
   */
  playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch {
      // Audio autoplay policy might restrict without user interaction
    }
  },
}
