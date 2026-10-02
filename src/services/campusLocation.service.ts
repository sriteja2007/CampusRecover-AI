/**
 * Campus Location & Safe Meeting Points Service
 * Configurable system for MVGR College of Engineering blocks and safe handover meeting points.
 * Provides resilient Firestore database persistence with local storage fallback and real-time syncing.
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import {
  CampusLocation,
  MeetingLocation,
  MVGR_CAMPUS_CENTER,
} from "../types/CampusLocation"
import { cleanFirestoreData } from "../utils/firestoreUtils"

const COLLECTIONS_CAMPUS_LOCATIONS = "campusLocations"
const COLLECTIONS_MEETING_LOCATIONS = "meetingLocations"

const LOCAL_CAMPUS_LOCATIONS_KEY = "campusrecover_campus_locations_mvgr_v4"
const LOCAL_MEETING_LOCATIONS_KEY = "campusrecover_meeting_locations_mvgr_v4"

// Default initial campus locations for MVGR College of Engineering
// Calibrated from official OpenStreetMap view of MVGR Campus
// Central pin anchor: MVGR Admin Office at 18.0675 N, 83.4336 E
const DEFAULT_CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: "loc_admin_office",
    name: "MVGR Admin Office",
    description: "Central Administrative Block, Principal's chamber, Registrar & Student Affairs",
    type: "ADMIN",
    latitude: 18.0675,
    longitude: 83.4336,
    address: "MVGR Admin Office, Central Campus Circle",
    active: true,
  },
  {
    id: "loc_open_auditorium",
    name: "MVGR Open Auditorium",
    description: "Main campus open-air auditorium and event amphitheater",
    type: "FACILITY",
    latitude: 18.0674,
    longitude: 83.4330,
    address: "Immediately West of MVGR Admin Office",
    active: true,
  },
  {
    id: "loc_dept_it",
    name: "Department of IT",
    description: "Department of Information Technology classrooms & computer labs",
    type: "ACADEMIC",
    latitude: 18.0679,
    longitude: 83.4331,
    address: "North of MVGR Open Auditorium",
    active: true,
  },
  {
    id: "loc_dept_data_eng",
    name: "Department of Data Engineering",
    description: "Data Engineering, AI/ML Labs & First Year Foundations Program (FYFP)",
    type: "ACADEMIC",
    latitude: 18.0691,
    longitude: 83.4320,
    address: "North-West Campus Academic Block",
    active: true,
  },
  {
    id: "loc_dept_mech",
    name: "Department of Mechanical Engineering",
    description: "Mechanical Engineering Department studios, CAD labs and lecture halls",
    type: "ACADEMIC",
    latitude: 18.0673,
    longitude: 83.4321,
    address: "West Campus Wing",
    active: true,
  },
  {
    id: "loc_mech_workshop",
    name: "Mechanical Workshop",
    description: "Foundry, machine shop, welding, carpentry & mechanical workshops",
    type: "ACADEMIC",
    latitude: 18.0680,
    longitude: 83.4322,
    address: "Adjacent to Mechanical Engineering Department",
    active: true,
  },
  {
    id: "loc_library_periodicals",
    name: "Periodicals Section / Central Library",
    description: "Dr. P.V.G. Raju Central Library, Periodicals Section, study halls & reference racks",
    type: "LIBRARY",
    latitude: 18.0681,
    longitude: 83.4338,
    address: "North-East of Admin Office, near Civil Pond",
    active: true,
  },
  {
    id: "loc_anjani_food_court",
    name: "Anjani Food Court",
    description: "Central college food court, cafeteria and student refreshments area",
    type: "CAFETERIA",
    latitude: 18.0695,
    longitude: 83.4331,
    address: "North Campus near Department of Data Engineering & Parking",
    active: true,
  },
  {
    id: "loc_sports_cricket",
    name: "Sports Complex & Cricket Ground",
    description: "College cricket stadium, sports pavilion and athletic complex",
    type: "SPORTS",
    latitude: 18.0678,
    longitude: 83.4348,
    address: "East Campus Sports Grounds",
    active: true,
  },
  {
    id: "loc_basketball_court",
    name: "MVGR Basketball Court",
    description: "Floodlit outdoor basketball court adjacent to admin circle",
    type: "SPORTS",
    latitude: 18.0669,
    longitude: 83.4339,
    address: "South of MVGR Admin Office",
    active: true,
  },
  {
    id: "loc_cse_badminton",
    name: "CSE Badminton Court",
    description: "Badminton court near Open Auditorium and Vinayaka Temple",
    type: "SPORTS",
    latitude: 18.0669,
    longitude: 83.4331,
    address: "South-West of MVGR Admin Office",
    active: true,
  },
  {
    id: "loc_practice_ground",
    name: "Practice Play Ground",
    description: "Student athletic practice play ground",
    type: "SPORTS",
    latitude: 18.0667,
    longitude: 83.4349,
    address: "South of Cricket Ground",
    active: true,
  },
  {
    id: "loc_boys_hostel",
    name: "MVGR Boys Hostel (B & C Blocks)",
    description: "Campus residential hostels B Block and C Block for boys",
    type: "HOSTEL",
    latitude: 18.0654,
    longitude: 83.4322,
    address: "South-West Campus Residential Complex",
    active: true,
  },
  {
    id: "loc_girls_hostel",
    name: "MVGR Girls Hostel",
    description: "Secure campus residential hostels on MVGR Girls Hostel Road",
    type: "HOSTEL",
    latitude: 18.0702,
    longitude: 83.4344,
    address: "North-East Campus, MVGR Girls Hostel Road",
    active: true,
  },
  {
    id: "loc_main_gate",
    name: "Main Entrance Gate (Chintalavalasa Road)",
    description: "Primary college entrance gate on Chintalavalasa - Ayinada Junction Road (MDR0116)",
    type: "GATE",
    latitude: 18.0666,
    longitude: 83.4358,
    address: "Chintalavalasa - Ayinada Junction Road MDR0116, near Ambedkar Statue",
    active: true,
  },
  {
    id: "loc_vinayaka_temple",
    name: "Vinayaka Temple Area",
    description: "Campus shrine and quiet courtyard walkway",
    type: "FACILITY",
    latitude: 18.0663,
    longitude: 83.4332,
    address: "South of Open Auditorium & Badminton Court",
    active: true,
  },
  {
    id: "loc_other",
    name: "Other Campus Area",
    description: "Walkways, central lawns, parking sheds or unlisted campus location",
    type: "OTHER",
    latitude: MVGR_CAMPUS_CENTER.latitude,
    longitude: MVGR_CAMPUS_CENTER.longitude,
    address: "MVGR College of Engineering Campus",
    active: true,
  },
]

// Default verified safe meeting points for item handovers
const DEFAULT_MEETING_LOCATIONS: MeetingLocation[] = [
  {
    id: "meet_security_gate",
    name: "Security Post (Main Entrance Gate)",
    description: "24/7 Security cabin with CCTV surveillance at the Chintalavalasa Road gate.",
    latitude: 18.0666,
    longitude: 83.4358,
    address: "Main Gate, Chintalavalasa - Ayinada Junction Road (MDR0116)",
    active: true,
  },
  {
    id: "meet_admin_desk",
    name: "MVGR Admin Office Reception",
    description: "Ground floor reception and administrative lobby at the central campus circle.",
    latitude: 18.0675,
    longitude: 83.4336,
    address: "MVGR Admin Office, Central Campus",
    active: true,
  },
  {
    id: "meet_library_counter",
    name: "Periodicals Section / Central Library Helpdesk",
    description: "Main circulation counter inside the Central Library entrance.",
    latitude: 18.0681,
    longitude: 83.4338,
    address: "Periodicals Section / Central Library Building",
    active: true,
  },
  {
    id: "meet_food_court",
    name: "Anjani Food Court Counter",
    description: "High-visibility, well-lit entrance and seating area at Anjani Food Court.",
    latitude: 18.0695,
    longitude: 83.4331,
    address: "Anjani Food Court Entrance, North Campus",
    active: true,
  },
  {
    id: "meet_sports_pavilion",
    name: "Sports Complex Pavilion Desk",
    description: "Physical Education department office and sports pavilion at the cricket ground.",
    latitude: 18.0678,
    longitude: 83.4348,
    address: "Sports Complex Pavilion, Cricket Ground",
    active: true,
  },
]

function getLocalLocations(): CampusLocation[] {
  if (typeof window === "undefined") return DEFAULT_CAMPUS_LOCATIONS
  try {
    const raw = localStorage.getItem(LOCAL_CAMPUS_LOCATIONS_KEY)
    if (!raw) {
      localStorage.setItem(
        LOCAL_CAMPUS_LOCATIONS_KEY,
        JSON.stringify(DEFAULT_CAMPUS_LOCATIONS),
      )
      return DEFAULT_CAMPUS_LOCATIONS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_CAMPUS_LOCATIONS
  }
}

function saveLocalLocations(locations: CampusLocation[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_CAMPUS_LOCATIONS_KEY, JSON.stringify(locations))
  } catch {}
}

function getLocalMeetingLocations(): MeetingLocation[] {
  if (typeof window === "undefined") return DEFAULT_MEETING_LOCATIONS
  try {
    const raw = localStorage.getItem(LOCAL_MEETING_LOCATIONS_KEY)
    if (!raw) {
      localStorage.setItem(
        LOCAL_MEETING_LOCATIONS_KEY,
        JSON.stringify(DEFAULT_MEETING_LOCATIONS),
      )
      return DEFAULT_MEETING_LOCATIONS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_MEETING_LOCATIONS
  }
}

function saveLocalMeetingLocations(locations: MeetingLocation[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_MEETING_LOCATIONS_KEY, JSON.stringify(locations))
  } catch {}
}

export const CampusLocationService = {
  getCampusCenter() {
    return MVGR_CAMPUS_CENTER
  },

  /**
   * Fetch all campus locations
   */
  async getLocations(includeInactive = false): Promise<CampusLocation[]> {
    const local = getLocalLocations()
    const map = new Map<string, CampusLocation>()
    for (const loc of local) {
      map.set(loc.id, loc)
    }

    try {
      const snap = await getDocs(collection(db, COLLECTIONS_CAMPUS_LOCATIONS))
      if (!snap.empty) {
        snap.forEach((d) => {
          map.set(d.id, { id: d.id, ...d.data() } as CampusLocation)
        })
        saveLocalLocations(Array.from(map.values()))
      } else {
        // If remote collection is empty, seed defaults
        for (const def of DEFAULT_CAMPUS_LOCATIONS) {
          addDoc(collection(db, COLLECTIONS_CAMPUS_LOCATIONS), cleanFirestoreData(def)).catch(() => {})
        }
      }
    } catch (err) {
      console.warn("CampusLocationService.getLocations Firestore notice:", err)
    }

    let results = Array.from(map.values())
    if (!includeInactive) {
      results = results.filter((loc) => loc.active !== false)
    }
    return results.sort((a, b) => a.name.localeCompare(b.name))
  },

  /**
   * Get single campus location by ID
   */
  async getLocationById(id: string): Promise<CampusLocation | null> {
    const list = await this.getLocations(true)
    return list.find((l) => l.id === id) || null
  },

  /**
   * Find campus location by name (fuzzy match)
   */
  async getLocationByName(name: string): Promise<CampusLocation | null> {
    if (!name) return null
    const list = await this.getLocations(true)
    const lower = name.toLowerCase().trim()
    return (
      list.find(
        (l) =>
          l.name.toLowerCase() === lower ||
          lower.includes(l.name.toLowerCase()) ||
          l.name.toLowerCase().includes(lower),
      ) || null
    )
  },

  /**
   * Admin adds a new campus location block
   */
  async createLocation(
    data: Omit<CampusLocation, "id" | "createdAt" | "updatedAt">,
  ): Promise<CampusLocation> {
    const localId = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const payload = cleanFirestoreData({
      ...data,
      active: data.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    let newLocation: CampusLocation = {
      id: localId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const current = getLocalLocations()
    saveLocalLocations([newLocation, ...current])

    try {
      const docRef = await addDoc(
        collection(db, COLLECTIONS_CAMPUS_LOCATIONS),
        payload,
      )
      newLocation = { ...newLocation, id: docRef.id }
      const updated = getLocalLocations().map((l) =>
        l.id === localId ? newLocation : l,
      )
      saveLocalLocations(updated)
    } catch (err) {
      console.warn("createLocation Firestore notice:", err)
    }

    return newLocation
  },

  /**
   * Admin updates an existing campus location
   */
  async updateLocation(
    id: string,
    updates: Partial<CampusLocation>,
  ): Promise<void> {
    const cleaned = cleanFirestoreData(updates)
    const current = getLocalLocations()
    const updated = current.map((l) =>
      l.id === id ? { ...l, ...cleaned, updatedAt: new Date().toISOString() } : l,
    )
    saveLocalLocations(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS_CAMPUS_LOCATIONS, id), {
        ...cleaned,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("updateLocation Firestore notice:", err)
    }
  },

  /**
   * Admin deletes or deactivates a campus location
   */
  async deleteLocation(id: string): Promise<void> {
    const current = getLocalLocations()
    saveLocalLocations(current.filter((l) => l.id !== id))

    try {
      await deleteDoc(doc(db, COLLECTIONS_CAMPUS_LOCATIONS, id))
    } catch (err) {
      console.warn("deleteLocation Firestore notice:", err)
    }
  },

  // ─── Meeting Locations (Safe Handover Points) ──────────────────────

  async getMeetingLocations(includeInactive = false): Promise<MeetingLocation[]> {
    const local = getLocalMeetingLocations()
    const map = new Map<string, MeetingLocation>()
    for (const m of local) {
      map.set(m.id, m)
    }

    try {
      const snap = await getDocs(collection(db, COLLECTIONS_MEETING_LOCATIONS))
      if (!snap.empty) {
        snap.forEach((d) => {
          map.set(d.id, { id: d.id, ...d.data() } as MeetingLocation)
        })
        saveLocalMeetingLocations(Array.from(map.values()))
      } else {
        for (const def of DEFAULT_MEETING_LOCATIONS) {
          addDoc(collection(db, COLLECTIONS_MEETING_LOCATIONS), cleanFirestoreData(def)).catch(() => {})
        }
      }
    } catch (err) {
      console.warn("CampusLocationService.getMeetingLocations Firestore notice:", err)
    }

    let results = Array.from(map.values())
    if (!includeInactive) {
      results = results.filter((m) => m.active !== false)
    }
    return results
  },

  async createMeetingLocation(
    data: Omit<MeetingLocation, "id" | "createdAt" | "updatedAt">,
  ): Promise<MeetingLocation> {
    const localId = `meet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const payload = cleanFirestoreData({
      ...data,
      active: data.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    let newMeeting: MeetingLocation = {
      id: localId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const current = getLocalMeetingLocations()
    saveLocalMeetingLocations([newMeeting, ...current])

    try {
      const docRef = await addDoc(
        collection(db, COLLECTIONS_MEETING_LOCATIONS),
        payload,
      )
      newMeeting = { ...newMeeting, id: docRef.id }
      const updated = getLocalMeetingLocations().map((m) =>
        m.id === localId ? newMeeting : m,
      )
      saveLocalMeetingLocations(updated)
    } catch (err) {
      console.warn("createMeetingLocation Firestore notice:", err)
    }

    return newMeeting
  },

  async updateMeetingLocation(
    id: string,
    updates: Partial<MeetingLocation>,
  ): Promise<void> {
    const cleaned = cleanFirestoreData(updates)
    const current = getLocalMeetingLocations()
    const updated = current.map((m) =>
      m.id === id ? { ...m, ...cleaned, updatedAt: new Date().toISOString() } : m,
    )
    saveLocalMeetingLocations(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS_MEETING_LOCATIONS, id), {
        ...cleaned,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("updateMeetingLocation Firestore notice:", err)
    }
  },

  async deleteMeetingLocation(id: string): Promise<void> {
    const current = getLocalMeetingLocations()
    saveLocalMeetingLocations(current.filter((m) => m.id !== id))

    try {
      await deleteDoc(doc(db, COLLECTIONS_MEETING_LOCATIONS, id))
    } catch (err) {
      console.warn("deleteMeetingLocation Firestore notice:", err)
    }
  },
}
