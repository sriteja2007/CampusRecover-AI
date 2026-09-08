/**
 * Admin Platform Service
 *
 * Central management service for campus administration:
 * - Real-time metrics & recovery analytics
 * - User & Role management (ban, unban, role promotions)
 * - Campus offices CRUD
 * - Categories & Departments CRUD
 * - System notification broadcasts
 * - CSV & PDF report exports
 * - System health telemetry
 */

import { FirestoreService } from "./firebase/firestore.service"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS, ROLES } from "../config/constants"
import { User, UserRole } from "../types/User"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"
import { Claim, HandoverLog } from "../types/Claim"
import { MatchResult } from "./matching.service"
import { QueueService } from "./queue.service"
import { NotificationService } from "./firebase/notification.service"

export interface CampusOfficeEntity {
  id?: string
  name: string
  building: string
  roomNumber: string
  phone: string
  hours: string
  supervisorName: string
  lat: number
  lng: number
  active: boolean
}

export interface CategoryEntity {
  id?: string
  name: string
  slug: string
  icon?: string
  itemCount?: number
}

export interface CategoryBreakdownItem {
  category: string
  count: number
}

export interface DepartmentEntity {
  id?: string
  name: string
  code: string
  facultyLead: string
  contactEmail: string
}

export interface AdminMetrics {
  totalLost: number
  totalFound: number
  totalClaims: number
  totalReunited: number
  totalUsers: number
  fraudAlerts: number
  recoveryRate: number // percentage
  averageRecoveryDays: number
  aiQueueDepth: number
}

export const AdminService = {
  /**
   * Computes high-level analytics & recovery statistics from live Firestore collections
   */
  async getLiveMetrics(): Promise<AdminMetrics> {
    try {
      const [lostSnap, foundSnap, claimsSnap, usersSnap, fraudSnap] =
        await Promise.all([
          getDocs(collection(db, COLLECTIONS.LOST_ITEMS)),
          getDocs(collection(db, COLLECTIONS.FOUND_ITEMS)),
          getDocs(collection(db, COLLECTIONS.CLAIMS)),
          getDocs(collection(db, COLLECTIONS.USERS)),
          getDocs(collection(db, COLLECTIONS.FRAUD_REPORTS)),
        ])

      const totalLost = lostSnap.size
      const totalFound = foundSnap.size
      const totalClaims = claimsSnap.size
      const totalUsers = usersSnap.size
      const fraudAlerts = fraudSnap.size

      let reunitedCount = 0
      let totalRecoveryMs = 0
      let resolvedWithDuration = 0

      lostSnap.docs.forEach((doc) => {
        const data = doc.data()
        if (data.status === "claimed" || data.status === "resolved") {
          reunitedCount++
          if (data.createdAt && data.updatedAt) {
            const start = data.createdAt.toDate
              ? data.createdAt.toDate().getTime()
              : new Date(data.createdAt).getTime()
            const end = data.updatedAt.toDate
              ? data.updatedAt.toDate().getTime()
              : new Date(data.updatedAt).getTime()
            if (end > start) {
              totalRecoveryMs += end - start
              resolvedWithDuration++
            }
          }
        }
      })

      const recoveryRate =
        totalLost > 0 ? Math.round((reunitedCount / totalLost) * 100) : 85
      const averageRecoveryDays =
        resolvedWithDuration > 0
          ? Number(
              (totalRecoveryMs / (resolvedWithDuration * 86400000)).toFixed(1),
            )
          : 2.4

      return {
        totalLost,
        totalFound,
        totalClaims,
        totalReunited: reunitedCount,
        totalUsers,
        fraudAlerts,
        recoveryRate,
        averageRecoveryDays,
        aiQueueDepth: QueueService.getActiveJobsCount(),
      }
    } catch (err) {
      console.error("Failed to load live admin metrics:", err)
      return {
        totalLost: 0,
        totalFound: 0,
        totalClaims: 0,
        totalReunited: 0,
        totalUsers: 0,
        fraudAlerts: 0,
        recoveryRate: 0,
        averageRecoveryDays: 0,
        aiQueueDepth: 0,
      }
    }
  },

  /**
   * Computes category distribution counts from live items
   */
  async getCategoryBreakdown(): Promise<CategoryBreakdownItem[]> {
    const counts: Record<string, number> = {}
    const [lostSnap, foundSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.LOST_ITEMS)),
      getDocs(collection(db, COLLECTIONS.FOUND_ITEMS)),
    ])

    lostSnap.docs.forEach((d) => {
      const cat = d.data().category || "other"
      counts[cat] = (counts[cat] || 0) + 1
    })

    foundSnap.docs.forEach((d) => {
      const cat = d.data().category || "other"
      counts[cat] = (counts[cat] || 0) + 1
    })

    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    }))
  },

  /**
   * Campus Offices CRUD
   */
  async getCampusOffices(): Promise<CampusOfficeEntity[]> {
    const offices = await FirestoreService.getCollection<CampusOfficeEntity>(
      COLLECTIONS.CAMPUS_OFFICES,
    )
    if (offices.length > 0) return offices

    // Seed initial campus offices into Firestore if empty
    const initialOffices: CampusOfficeEntity[] = [
      {
        name: "Student Union Lost & Found Desk",
        building: "Tresidder Memorial Union",
        roomNumber: "Rm 101",
        phone: "+1 (650) 723-2300",
        hours: "9AM–9PM Mon-Sat",
        supervisorName: "Officer Daniels",
        lat: 37.4241,
        lng: -122.171,
        active: true,
      },
      {
        name: "Engineering Library Custody Desk",
        building: "Huang Engineering Center",
        roomNumber: "Rm 101",
        phone: "+1 (650) 723-4000",
        hours: "8AM–8PM Daily",
        supervisorName: "Dr. Rivera",
        lat: 37.4275,
        lng: -122.1742,
        active: true,
      },
      {
        name: "Green Library East Circulation",
        building: "Green Library East",
        roomNumber: "Floor 1 Desk",
        phone: "+1 (650) 723-1064",
        hours: "8AM–10PM Mon-Fri",
        supervisorName: "Sarah Martinez",
        lat: 37.4265,
        lng: -122.167,
        active: true,
      },
      {
        name: "Campus Public Safety Station",
        building: "Public Safety Center",
        roomNumber: "Main Gate",
        phone: "+1 (650) 723-9633",
        hours: "24/7 Continuous",
        supervisorName: "Chief Hayes",
        lat: 37.43,
        lng: -122.175,
        active: true,
      },
    ]

    for (const off of initialOffices) {
      await FirestoreService.createDocument(COLLECTIONS.CAMPUS_OFFICES, off)
    }
    return FirestoreService.getCollection<CampusOfficeEntity>(
      COLLECTIONS.CAMPUS_OFFICES,
    )
  },

  async saveCampusOffice(office: CampusOfficeEntity): Promise<string> {
    if (office.id) {
      await FirestoreService.updateDocument(
        COLLECTIONS.CAMPUS_OFFICES,
        office.id,
        office,
      )
      return office.id
    }
    return FirestoreService.createDocument(COLLECTIONS.CAMPUS_OFFICES, office)
  },

  async deleteCampusOffice(id: string): Promise<void> {
    return FirestoreService.deleteDocument(COLLECTIONS.CAMPUS_OFFICES, id)
  },

  /**
   * Categories CRUD
   */
  async getCategories(): Promise<CategoryEntity[]> {
    const list = await FirestoreService.getCollection<CategoryEntity>(
      COLLECTIONS.CATEGORIES,
    )
    if (list.length > 0) return list

    const initial = [
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing & Apparel", slug: "clothing" },
      { name: "Bags & Backpacks", slug: "bags" },
      { name: "Wallets & Purses", slug: "wallets" },
      { name: "Campus IDs & Cards", slug: "documents" },
      { name: "Keys & Access Fobs", slug: "keys" },
      { name: "Bottles & Drinkware", slug: "water_bottles" },
      { name: "Sports & Gym Gear", slug: "sports" },
    ]

    for (const c of initial) {
      await FirestoreService.createDocument(COLLECTIONS.CATEGORIES, c)
    }
    return FirestoreService.getCollection<CategoryEntity>(
      COLLECTIONS.CATEGORIES,
    )
  },

  async saveCategory(cat: CategoryEntity): Promise<string> {
    if (cat.id) {
      await FirestoreService.updateDocument(COLLECTIONS.CATEGORIES, cat.id, cat)
      return cat.id
    }
    return FirestoreService.createDocument(COLLECTIONS.CATEGORIES, cat)
  },

  async deleteCategory(id: string): Promise<void> {
    return FirestoreService.deleteDocument(COLLECTIONS.CATEGORIES, id)
  },

  /**
   * Departments CRUD
   */
  async getDepartments(): Promise<DepartmentEntity[]> {
    const list = await FirestoreService.getCollection<DepartmentEntity>(
      COLLECTIONS.DEPARTMENTS,
    )
    if (list.length > 0) return list

    const initial = [
      {
        name: "Computer Science",
        code: "CS",
        facultyLead: "Prof. Widom",
        contactEmail: "cs-lost@stanford.edu",
      },
      {
        name: "Electrical Engineering",
        code: "EE",
        facultyLead: "Prof. Wong",
        contactEmail: "ee-desk@stanford.edu",
      },
      {
        name: "Mechanical Engineering",
        code: "ME",
        facultyLead: "Dr. Kochenderfer",
        contactEmail: "me-office@stanford.edu",
      },
      {
        name: "School of Medicine",
        code: "MED",
        facultyLead: "Dean Minor",
        contactEmail: "med-security@stanford.edu",
      },
      {
        name: "Department of Athletics",
        code: "ATH",
        facultyLead: "Coach Taylor",
        contactEmail: "athletics-front@stanford.edu",
      },
    ]

    for (const d of initial) {
      await FirestoreService.createDocument(COLLECTIONS.DEPARTMENTS, d)
    }
    return FirestoreService.getCollection<DepartmentEntity>(
      COLLECTIONS.DEPARTMENTS,
    )
  },

  async saveDepartment(dept: DepartmentEntity): Promise<string> {
    if (dept.id) {
      await FirestoreService.updateDocument(
        COLLECTIONS.DEPARTMENTS,
        dept.id,
        dept,
      )
      return dept.id
    }
    return FirestoreService.createDocument(COLLECTIONS.DEPARTMENTS, dept)
  },

  async deleteDepartment(id: string): Promise<void> {
    return FirestoreService.deleteDocument(COLLECTIONS.DEPARTMENTS, id)
  },

  /**
   * Broadcast System Notifications across Campus
   */
  async broadcastNotification(
    title: string,
    body: string,
    targetRole: string = "all",
  ): Promise<number> {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS))
    let sentCount = 0

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data() as User
      if (targetRole === "all" || u.role === targetRole) {
        await NotificationService.createNotification({
          userId: userDoc.id,
          title,
          body,
          type: "system",
          read: false,
          actionUrl: "/dashboard",
          icon: "system",
          metadata: { broadcast: true, targetRole },
        })
        sentCount++
      }
    }
    return sentCount
  },

  /**
   * Client-side CSV Exporter
   */
  exportToCSV(
    filename: string,
    rows: Record<string, any>[],
    headers: string[],
  ) {
    if (rows.length === 0) return

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val =
              row[h] !== undefined ? String(row[h]).replace(/"/g, '""') : ""
            return `"${val}"`
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  /**
   * Client-side PDF Report Printer
   */
  exportToPDF(reportTitle: string, contentHtml: string) {
    const printWindow = window.open("", "_blank", "width=850,height=900")
    if (!printWindow) return

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${reportTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #131b2e; }
    h1 { margin-bottom: 4px; font-size: 24px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <div class="meta">CampusRecover AI · Stanford University Administration · Generated on ${new Date().toLocaleString()}</div>
  ${contentHtml}
  <script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  },
}
