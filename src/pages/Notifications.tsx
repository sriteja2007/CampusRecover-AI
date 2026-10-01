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
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  NotificationService,
  AppNotification,
  NotificationPreferences,
} from "../services/firebase/notification.service"
import { PushNotificationService } from "../services/push.service"
import { EmailService } from "../services/email.service"

const ICON_MAP: Record<string, any> = {
  brain: Brain,
  message: MessageCircle,
  status: Package,
  match: Brain,
  fraud: ShieldAlert,
  claim: QrCode,
  system: Bell,
}

interface NotificationColorStyle {
  color: string
  bg: string
}

const COLOR_MAP: Record<string, NotificationColorStyle> = {
  match: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  message: { color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  status: { color: "#0d9488", bg: "rgba(13,148,136,0.1)" },
  system: { color: "#475569", bg: "rgba(71,85,105,0.1)" },
  fraud: { color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  claim: { color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
}

function formatTimeAgo(timestamp: any): string {
  if (!timestamp?.toDate) return ""
  const diff = Date.now() - timestamp.toDate().getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return timestamp.toDate().toLocaleDateString()
}

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
        "CampusRecover Notifications Enabled",
        {
          body: "You will now receive alerts for AI matches, chats, and claims in real-time.",
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
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : toast.type === "error"
                ? "bg-red-600 text-white"
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""} across
            In-App, Push, and Email channels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 size={14} /> Mark all read
          </button>
          <button
            onClick={deleteAllRead}
            title="Clear read notifications"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            title="Notification Settings"
            className={`p-2 rounded-xl border transition-colors ${
              showPrefs
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Push Notification Banner */}
      {pushPermission !== "granted" && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-blue-950/40 to-indigo-50 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <BellRing size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-blue-900 dark:text-blue-200">
                Enable Web Push Notifications
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Get notified instantly when AI pairs your lost item or sends
                chat messages.
              </div>
            </div>
          </div>
          <button
            onClick={requestPush}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex-shrink-0 cursor-pointer"
          >
            Enable Push
          </button>
        </div>
      )}

      {/* Preferences Panel */}
      {showPrefs && prefs && (
        <div className="mb-6 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={16} className="text-blue-600 dark:text-blue-400" />
              Notification Delivery Channels & Preferences
            </h3>
            <button
              onClick={() => setShowPrefs(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Smartphone size={14} className="text-blue-600 dark:text-blue-400" /> In-App Alerts
              </span>
              <input
                type="checkbox"
                checked={prefs.inAppEnabled}
                onChange={(e) => updatePref("inAppEnabled", e.target.checked)}
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <BellRing size={14} className="text-purple-600 dark:text-purple-400" /> Web Push
              </span>
              <input
                type="checkbox"
                checked={prefs.pushEnabled}
                onChange={(e) => updatePref("pushEnabled", e.target.checked)}
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Mail size={14} className="text-teal-600 dark:text-teal-400" /> Email Digest
              </span>
              <input
                type="checkbox"
                checked={prefs.emailEnabled}
                onChange={(e) => updatePref("emailEnabled", e.target.checked)}
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
              Notification Types
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: "matchAlerts", label: "AI Match Suggestions" },
                { key: "messageAlerts", label: "Real-time Chat Messages" },
                { key: "statusUpdates", label: "Claim & Verification Updates" },
                {
                  key: "systemAlerts",
                  label: "Campus Security & System Alerts",
                },
                { key: "fraudAlerts", label: "Fraud Risk Warnings" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer"
                >
                  <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={
                      prefs[(key as keyof NotificationPreferences)] as boolean
                    }
                    onChange={(e) =>
                      updatePref(
                        key as keyof NotificationPreferences,
                        e.target.checked,
                      )
                    }
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={30} className="animate-spin text-blue-600 dark:text-blue-400 mb-3" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Loading notifications...
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
          <Bell size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
            No notifications yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You will be alerted here when an AI match is found, someone messages
            you, or an admin approves your claim.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const colors = COLOR_MAP[n.type] || COLOR_MAP.system
            const IconComp = ICON_MAP[n.icon] || ICON_MAP[n.type] || Bell

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer relative shadow-xs ${
                  n.read
                    ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                    : "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                {!n.read && (
                  <div className="absolute top-4 left-2 w-2 h-2 rounded-full bg-blue-600" />
                )}

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.bg }}
                >
                  <IconComp size={18} style={{ color: colors.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      className={`text-sm ${
                        n.read
                          ? "font-semibold text-gray-800 dark:text-gray-200"
                          : "font-black text-gray-900 dark:text-white"
                      }`}
                    >
                      {n.title}
                    </h4>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    {n.body}
                  </p>

                  <div className="flex items-center justify-between mt-2.5">
                    {n.actionUrl ? (
                      <Link
                        to={n.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg transition-colors border border-blue-200/50 dark:border-blue-800/50"
                      >
                        View Details <ArrowRight size={12} />
                      </Link>
                    ) : (
                      <div />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotif(n.id)
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
