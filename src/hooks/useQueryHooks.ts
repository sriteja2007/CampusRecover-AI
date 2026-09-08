import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryClient, QUERY_KEYS } from "../config/queryClient"
import {
  LostItemService,
  FoundItemService,
  ItemQueryFilters,
} from "../services/firebase/item.service"
import { MatchingService } from "../services/matching.service"
import { HandoverService } from "../services/handover.service"
import { AdminService } from "../services/admin.service"
import { NotificationService } from "../services/firebase/notification.service"

/**
 * Hook to query Lost Items with TanStack Query caching
 */
export function useLostItems(filters: ItemQueryFilters = {}, limitCount = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.LOST_ITEMS, filters, limitCount],
    queryFn: () => LostItemService.getAll(filters, limitCount),
  })
}

/**
 * Hook to query Found Items with TanStack Query caching
 */
export function useFoundItems(filters: ItemQueryFilters = {}, limitCount = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FOUND_ITEMS, filters, limitCount],
    queryFn: () => FoundItemService.getAll(filters, limitCount),
  })
}

/**
 * Hook to query AI Matches for a user
 */
export function useAIMatches(userId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MATCHES, userId],
    queryFn: () =>
      userId ? MatchingService.getUserMatches(userId) : Promise.resolve([]),
    enabled: Boolean(userId),
  })
}

/**
 * Hook to query User Claims for Handover
 */
export function useUserClaims(userId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CLAIMS, userId],
    queryFn: () =>
      userId ? HandoverService.getClaimsForUser(userId) : Promise.resolve([]),
    enabled: Boolean(userId),
  })
}

/**
 * Hook to query Real-time Admin Metrics
 */
export function useAdminMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_METRICS,
    queryFn: () => AdminService.getLiveMetrics(),
    staleTime: 1000 * 60, // Refresh every minute
  })
}

/**
 * Hook to invalidate item queries after creating/updating reports
 */
export function useInvalidateItems() {
  const qc = useQueryClient()
  return {
    invalidateAll: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.LOST_ITEMS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FOUND_ITEMS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MATCHES })
    },
  }
}
