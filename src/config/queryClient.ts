import { QueryClient } from "@tanstack/react-query"
import { Logger } from "../services/logger.service"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes data freshness
      gcTime: 1000 * 60 * 30, // Keep in garbage collection cache for 30 minutes
      retry: (failureCount, error: any) => {
        // Do not retry on 404 or permission errors
        if (error?.code === "permission-denied" || error?.status === 404) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        Logger.error("Query mutation error", "QueryClient", error)
      },
    },
  },
})

export const QUERY_KEYS = {
  LOST_ITEMS: ["lostItems"] as const,
  FOUND_ITEMS: ["foundItems"] as const,
  MATCHES: ["matches"] as const,
  CLAIMS: ["claims"] as const,
  USER_PROFILE: (uid?: string) => ["user", uid] as const,
  ADMIN_METRICS: ["admin", "metrics"] as const,
  CAMPUS_OFFICES: ["campus_offices"] as const,
  NOTIFICATIONS: (uid?: string) => ["notifications", uid] as const,
}

export default queryClient
