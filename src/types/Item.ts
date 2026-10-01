export type ItemType = "LOST" | "FOUND"

export type ItemStatus = "pending" | "possible_match" | "match_confirmed" | "contact_shared" | "handover_pending" | "handover_verified" | "recovered" | "closed"

export interface Item {
  id: string
  referenceNumber: string // e.g. CR-LST-1024 or CR-FND-1025
  type: ItemType
  userId: string
  userName: string
  userEmail: string
  userMobile?: string
  itemName: string
  title?: string // backward compatibility alias
  category: string
  description: string
  color?: string
  brand?: string
  imageUrl?: string
  imageUrls?: string[]
  location: string
  locationLost?: string // backward compatibility alias
  locationFound?: string // backward compatibility alias
  date: string
  dateLost?: string // backward compatibility alias
  dateFound?: string // backward compatibility alias
  time?: string
  status: ItemStatus
  additionalDetails?: string
  createdAt?: any
  updatedAt?: any
}
