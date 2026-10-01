export const COLLECTIONS = {
  USERS: "users",
  ITEMS: "items",
  LOST_ITEMS: "lostItems",
  FOUND_ITEMS: "foundItems",
  MATCHES: "matches",
  HANDOVERS: "handovers",
  AI_RESULTS: "aiResults",
  FRAUD_REPORTS: "fraudReports",
  MATCHING_QUEUE: "matching_queue",
  CHAT_ROOMS: "chat_rooms",
  NOTIFICATIONS: "notifications",
  NOTIFICATION_PREFERENCES: "notification_preferences",
  MESSAGES: "messages",
  CLAIMS: "claims",
  HANDOVER_LOGS: "handoverLogs",
  VERIFICATION_LOGS: "verificationLogs",
  CAMPUS_OFFICES: "campus_offices",
  DEPARTMENTS: "departments",
  CATEGORIES: "categories",
  REPORTS: "reports",
  ADMINS: "admins",
  UNIVERSITIES: "universities",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  ACTIVITY_LOGS: "activityLogs",
  DRAFT_REPORTS: "draftReports",
} as const

export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  SECURITY: "security",
  ADMIN: "admin",
  UNIVERSITY: "university",
  SUPERADMIN: "superadmin",
} as const

export const LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILES_PER_UPLOAD: 5,
  MAX_REPORTS_PER_DAY: 10,
} as const

export const ROUTES = {
  HOME: "/",
  APP: "/dashboard",
  LOGIN: "/login",
  SIGNUP: "/signup",
} as const
