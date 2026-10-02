import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router"
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageCircle,
  QrCode,
  Trash2,
  Settings,
  Loader2,
  ShieldAlert,
  Package,
  ArrowRight,
  Clock,
  X,
  BellRing,
  Mail,
  Smartphone,
  Volume2,
  Check,
  Sparkles,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  NotificationService,
  AppNotification,
  NotificationPreferences,
} from "../services/firebase/notification.service"
import { PushNotificationService } from "../services/push.service"
import { Badge } from "../components/ui/Badge"

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    PushNotificationService.getPermission(),
  )
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message })
      setTimeout(() => setToast(null), 3500)
    },
    [],
  )

  // Real-time notifications subscription
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = NotificationService.subscribeToNotifications(
      user.uid,
      (notifs) => {
        setNotifications(notifs)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  // Load preferences
  useEffect(() => {
    if (!user) return
    NotificationService.getPreferences(user.uid).then(setPrefs)
  }, [user])

  const requestPush = async () => {
    const granted = await PushNotificationService.requestPermission()
    setPushPermission(PushNotificationService.getPermission())
    if (granted) {
      showToast("success", "Browser Push Notifications enabled!")
      PushNotificationService.sendNotification(
        "CampusRecover Notifications Active",
        {
          body: "You will now receive alerts for AI matches, custody handovers, and claims.",
        },
      )
      if (user && prefs) {
        updatePref("pushEnabled", true)
      }
    } else {
      showToast(
        "error",
        "Push notification permission was denied in your browser settings.",
      )
    }
  }

  const markAllRead = async () => {
    if (!user) return
    try {
      await NotificationService.markAllAsRead(user.uid)
      showToast("success", "All notifications marked as read.")
    } catch {
      showToast("error", "Failed to mark notifications as read.")
    }
  }

  const markRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id)
    } catch {
      console.error("Failed to mark notification read")
    }
  }

  const deleteNotif = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id)
    } catch {
      showToast("error", "Failed to delete notification.")
    }
  }

  const deleteAllRead = async () => {
    if (!user) return
    try {
      await NotificationService.deleteAllRead(user.uid)
      showToast("success", "Cleared read notifications.")
    } catch {
      showToast("error", "Failed to clear notifications.")
    }
  }

  const updatePref = async (key: keyof NotificationPreferences, value: any) => {
    if (!user || !prefs) return
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    try {
      await NotificationService.updatePreferences(user.uid, { [key]: value })
    } catch {
      showToast("error", "Failed to save preference.")
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Bell size={14} />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""} across AI matches, handover confirmations, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <CheckCircle2 size={14} /> Mark all read
          </button>
          <button
            onClick={deleteAllRead}
            title="Clear read notifications"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            title="Notification Settings"
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer shadow-xs ${
              showPrefs
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Preferences Drawer / Accordion */}
      {showPrefs && prefs && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Notification Delivery Channels
            </h3>
            <button
              onClick={() => setShowPrefs(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                In-App Alerts
              </span>
              <input
                type="checkbox"
                checked={prefs.inAppEnabled}
                onChange={(e) => updatePref("inAppEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Digests
              </span>
              <input
                type="checkbox"
                checked={prefs.emailEnabled}
                onChange={(e) => updatePref("emailEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Push Notifications
              </span>
              {pushPermission === "granted" ? (
                <span className="text-xs font-bold text-emerald-600">Enabled</span>
              ) : (
                <button
                  onClick={requestPush}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-sm font-medium text-slate-500">Checking for campus alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Bell size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            All caught up!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
            You don't have any notifications at the moment. As soon as an AI match or status update occurs, it will appear here.
          </p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                n.read
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  : "bg-blue-50/50 dark:bg-slate-800/80 border-blue-200 dark:border-blue-900/60 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                {n.type === "match" ? (
                  <Sparkles size={18} />
                ) : n.type === "claim" ? (
                  <QrCode size={18} />
                ) : (
                  <Bell size={18} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                    {n.title}
                  </h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {n.body || (n as any).message}
                </p>

                {n.actionUrl && (
                  <Link
                    to={n.actionUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2"
                  >
                    <span>View Details</span>
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNotif(n.id)
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                title="Delete alert"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
