export type CampusLocationType =
  | "BUILDING"
  | "ACADEMIC"
  | "ADMIN"
  | "LIBRARY"
  | "CAFETERIA"
  | "SPORTS"
  | "HOSTEL"
  | "GATE"
  | "PARKING"
  | "FACILITY"
  | "OTHER"

export interface CampusLocation {
  id: string
  name: string
  description?: string
  type: CampusLocationType
  latitude: number
  longitude: number
  address?: string
  active: boolean
  createdAt?: any
  updatedAt?: any
}

export interface MeetingLocation {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  address?: string
  active: boolean
  createdAt?: any
  updatedAt?: any
}

// MVGR College of Engineering Anchor
export const MVGR_CAMPUS_CENTER = {
  name: "MVGR College of Engineering",
  address: "3C65+24W, Raghumanda Road, Chintalavalasa, Andhra Pradesh 535005",
  latitude: 18.0675,
  longitude: 83.4336,
  zoom: 17,
}
