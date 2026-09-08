import { Logger } from "./logger.service"

type ConnectivityListener = (isOnline: boolean) => void

class PWAService {
  private deferredPrompt: any = null
  private connectivityListeners: Set<ConnectivityListener> = new Set()
  private isRegistered = false

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.notifyConnectivity(true))
      window.addEventListener("offline", () => this.notifyConnectivity(false))

      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault()
        this.deferredPrompt = e
        Logger.info("PWA install prompt deferred", "PWAService")
      })
    }
  }

  public registerServiceWorker(): void {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    if (this.isRegistered) return

    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        this.isRegistered = true
        Logger.info("ServiceWorker registered successfully", "PWAService", {
          scope: registration.scope,
        })

        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                Logger.info(
                  "New content is available; please refresh.",
                  "PWAService",
                )
              }
            }
          }
        }
      } catch (err) {
        Logger.warn("ServiceWorker registration failed", "PWAService", err)
      }
    })
  }

  public isInstallable(): boolean {
    return this.deferredPrompt !== null
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false
    this.deferredPrompt.prompt()
    const { outcome } = await this.deferredPrompt.userChoice
    this.deferredPrompt = null
    return outcome === "accepted"
  }

  public isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true
  }

  public subscribeConnectivity(listener: ConnectivityListener): () => void {
    this.connectivityListeners.add(listener)
    return () => this.connectivityListeners.delete(listener)
  }

  private notifyConnectivity(isOnline: boolean): void {
    this.connectivityListeners.forEach((fn) => fn(isOnline))
  }
}

export const PWA = new PWAService()
export default PWA
