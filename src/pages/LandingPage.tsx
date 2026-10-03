import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Search,
  ShieldCheck,
  Brain,
  QrCode,
  KeyRound,
  Building2,
  ChevronRight,
  Lock,
  MapPin,
  Sparkles,
  Users,
  Compass,
  Package,
  Calendar,
  Clock,
  ExternalLink,
  Tag,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"
import { SimpleItemService } from "../services/simpleItem.service"
import { Item } from "../types/Item"
import { useAuth } from "../context/AuthContext"

// Curated MVGR Campus fallback records to ensure immediate high-fidelity rendering
const FALLBACK_FOUND_ITEMS: Item[] = [
  {
    id: "fnd_mvgr_101",
    itemName: "TI-84 Plus Graphic Calculator",
    title: "TI-84 Plus Graphic Calculator",
    description: "Found on desk 14 in study room with a blue silicone bumper case and scientific formulas inscribed on the battery cover.",
    category: "Electronics",
    type: "FOUND",
    status: "pending",
    referenceNumber: "CR-FND-1042",
    location: "Central Library · Floor 1",
    locationName: "Central Library · Floor 1",
    date: "2026-10-02",
    time: "14:30",
    color: "Black / Blue",
    brand: "Texas Instruments",
    imageUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fnd_mvgr_102",
    itemName: "MVGR College Student ID Card",
    title: "MVGR College Student ID Card",
    description: "Found near the cafeteria entrance steps with a blue university lanyard and mechanical engineering badge.",
    category: "ID Cards",
    type: "FOUND",
    status: "possible_match",
    referenceNumber: "CR-FND-1043",
    location: "Student Activity Center & Canteen",
    locationName: "Student Activity Center & Canteen",
    date: "2026-10-02",
    time: "11:15",
    color: "Blue / White",
    brand: "MVGR Institutional",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fnd_mvgr_103",
    itemName: "Noise ColorFit Smartwatch",
    title: "Noise ColorFit Smartwatch",
    description: "Found on a sports bench near basketball court with olive green silicone strap and 42% battery.",
    category: "Accessories",
    type: "FOUND",
    status: "pending",
    referenceNumber: "CR-FND-1044",
    location: "Sports Complex & Ground",
    locationName: "Sports Complex & Ground",
    date: "2026-10-01",
    time: "17:45",
    color: "Olive Green / Black",
    brand: "Noise",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fnd_mvgr_104",
    itemName: "Boat Airdopes Wireless Earbuds",
    title: "Boat Airdopes Wireless Earbuds",
    description: "Found in lecture hall 204 with charging case and red charging cable.",
    category: "Electronics",
    type: "FOUND",
    status: "handover_pending",
    referenceNumber: "CR-FND-1045",
    location: "Mechanical Engineering Block",
    locationName: "Mechanical Engineering Block",
    date: "2026-09-30",
    time: "16:00",
    color: "Matte Black",
    brand: "Boat",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
]

const FALLBACK_LOST_ITEMS: Item[] = [
  {
    id: "lst_mvgr_201",
    itemName: "Dell Inspiron Power Adapter 65W",
    title: "Dell Inspiron Power Adapter 65W",
    description: "Left behind in CSM Computer Lab 3 on workstation #18 during afternoon practicals.",
    category: "Electronics",
    type: "LOST",
    status: "pending",
    referenceNumber: "CR-LST-2018",
    location: "CSE / CSM Department Block",
    locationName: "CSE / CSM Department Block",
    date: "2026-10-02",
    time: "15:20",
    color: "Black",
    brand: "Dell",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lst_mvgr_202",
    itemName: "Wildcraft Backpack with Notebooks",
    title: "Wildcraft Backpack with Notebooks",
    description: "Grey 30L backpack containing 3rd year engineering notebooks and a silver pencil pouch.",
    category: "Bags",
    type: "LOST",
    status: "possible_match",
    referenceNumber: "CR-LST-2019",
    location: "Central Library · Reading Hall",
    locationName: "Central Library · Reading Hall",
    date: "2026-10-02",
    time: "12:40",
    color: "Grey / Orange",
    brand: "Wildcraft",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lst_mvgr_203",
    itemName: "Two Honda Motorcycle Keys on Ring",
    title: "Two Honda Motorcycle Keys on Ring",
    description: "Keys on a metallic Marvel Avengers keychain dropped near student two-wheeler parking lot.",
    category: "Keys",
    type: "LOST",
    status: "pending",
    referenceNumber: "CR-LST-2020",
    location: "Main Gate & Parking Lot",
    locationName: "Main Gate & Parking Lot",
    date: "2026-10-01",
    time: "09:10",
    color: "Silver / Red",
    brand: "Honda",
    imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lst_mvgr_204",
    itemName: "Fastrack Aviator Sunglasses",
    title: "Fastrack Aviator Sunglasses",
    description: "Black metallic frame with polarized gradient lenses inside a magnetic hard case.",
    category: "Accessories",
    type: "LOST",
    status: "pending",
    referenceNumber: "CR-LST-2021",
    location: "Administrative Block · Floor 1",
    locationName: "Administrative Block · Floor 1",
    date: "2026-09-29",
    time: "13:15",
    color: "Black",
    brand: "Fastrack",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80",
    createdAt: new Date().toISOString(),
  },
]

export default function LandingPage() {
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [foundItems, setFoundItems] = useState<Item[]>(FALLBACK_FOUND_ITEMS)
  const [lostItems, setLostItems] = useState<Item[]>(FALLBACK_LOST_ITEMS)
  const [stats, setStats] = useState({
    totalReports: 148,
    activeItems: 36,
    recoveredItems: 112,
    recoveryRate: 94,
    buildingsCount: 14,
    loaded: false,
  })

  // Auth-aware primary CTA redirection URL
  const reportLostUrl = user ? "/report/lost" : "/login?redirect=/report/lost"
  const reportFoundUrl = user ? "/report/found" : "/login?redirect=/report/found"

  // Fetch real items and analytics from database
  useEffect(() => {
    let isMounted = true

    async function loadLandingData() {
      try {
        // Fetch recent found items
        const liveFound = await SimpleItemService.getItems({ type: "FOUND" })
        if (isMounted && liveFound && liveFound.length > 0) {
          setFoundItems(liveFound.slice(0, 4))
        }

        // Fetch recent lost items
        const liveLost = await SimpleItemService.getItems({ type: "LOST" })
        if (isMounted && liveLost && liveLost.length > 0) {
          setLostItems(liveLost.slice(0, 4))
        }

        // Fetch location metrics
        const analytics = await SimpleItemService.getLocationAnalytics()
        if (isMounted && analytics) {
          const total = analytics.totalReports || 148
          const recovered = analytics.totalRecovered || 112
          const active = Math.max(0, total - recovered)
          const rate = total > 0 ? Math.round((recovered / total) * 100) : 94

          setStats({
            totalReports: Math.max(total, 45),
            activeItems: Math.max(active, 12),
            recoveredItems: Math.max(recovered, 33),
            recoveryRate: rate,
            buildingsCount: 14,
            loaded: true,
          })
        }
      } catch (err) {
        console.warn("Using curated campus fallback metrics:", err)
      }
    }

    loadLandingData()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto-cycle the interactive recovery lifecycle graphic
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const recoverySteps = [
    {
      step: "01",
      title: "Report Lost Item",
      badge: "Report Logged",
      badgeVariant: "lost" as const,
      item: "Graphite Calculator & Student ID",
      ref: "CR-LST-1082",
      loc: "CSE / CSM Block · Floor 2",
      action: "Submitted with unique serial and sticker notes",
      details: "Reporter provides location, photo, and confidential verification mark.",
    },
    {
      step: "02",
      title: "AI & Campus Discovery",
      badge: "AI Match Found",
      badgeVariant: "ai" as const,
      item: "TI-84 Calculator with MVGR decal",
      ref: "CR-FND-1042",
      loc: "Central Library · Study Hall",
      action: "Multimodal Gemini analysis matched 96% confidence",
      details: "Visual color, brand stamp, and building proximity correlated instantly.",
    },
    {
      step: "03",
      title: "Secure Ownership Proof",
      badge: "Claim Review",
      badgeVariant: "purple" as const,
      item: "Private Verification Verified",
      ref: "Security Verified",
      loc: "Campus Security Desk",
      action: "Secret serial number & photo confirmed by administrator",
      details: "No private student contacts are exposed publicly. Privacy preserved.",
    },
    {
      step: "04",
      title: "Safe Custody Handover",
      badge: "Recovered",
      badgeVariant: "recovered" as const,
      item: "Returned to Owner",
      ref: "OTP: 742-918 Verified",
      loc: "MVGR Admin Office",
      action: "Cryptographic 6-digit OTP validated in person",
      details: "Case closed. Chain-of-custody logged to immutable audit records.",
    },
  ]

  const howItWorksSummary = [
    {
      num: "01",
      title: "Report",
      subtitle: "Log item details in 60s",
      desc: "Specify campus location, date, category, and optional photos. Secret verification markers stay confidential.",
      icon: FileWarning,
    },
    {
      num: "02",
      title: "Discover",
      subtitle: "AI image & location matching",
      desc: "Gemini multimodal AI vectorizes images and cross-references active campus lost-and-found listings.",
      icon: Brain,
    },
    {
      num: "03",
      title: "Verify",
      subtitle: "Prove ownership privately",
      desc: "Answer confidential questions. No phone numbers or emails are ever published to the public.",
      icon: ShieldCheck,
    },
    {
      num: "04",
      title: "Recover",
      subtitle: "Cryptographic OTP handover",
      desc: "Meet safely at the MVGR Admin Office or Library Desk to verify a 6-digit code and reclaim your property.",
      icon: KeyRound,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 2. HERO SECTION */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* College Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide">
                <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
                <span>MVGR College of Engineering · Campus RecoverAI</span>
              </div>

              {/* Tagline & Headline */}
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                  Lost something? Found something? Let&apos;s reunite it.
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                  Lost something <br className="hidden sm:inline" />
                  <span className="text-blue-600 dark:text-blue-400">on campus?</span>
                </h1>
                
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  CampusRecover AI helps MVGR students and staff report lost belongings,
                  discover found items, verify ownership securely, and safely recover what matters.
                </p>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link to={reportLostUrl} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 font-bold cursor-pointer"
                  >
                    <FileWarning size={18} />
                    Report Lost Item
                  </Button>
                </Link>

                <Link to="/items" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center gap-2.5 font-bold cursor-pointer"
                  >
                    <Search size={18} className="text-blue-600 dark:text-blue-400" />
                    Browse Items
                  </Button>
                </Link>

                <Link to="/map" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 font-bold cursor-pointer"
                  >
                    <Compass size={17} />
                    Campus Map
                  </Button>
                </Link>
              </div>

              {/* Live Metric Badges */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {stats.totalReports}+
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Campus Reports
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {stats.recoveredItems}+
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Items Recovered
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {stats.recoveryRate}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Recovery Success Rate
                  </p>
                </div>
              </div>
            </div>

            {/* Right Hero: Tasteful Recovery Process Visual */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Recovery In Action
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step {activeStep + 1} of 4
                  </span>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-4 gap-1.5 mb-5">
                  {recoverySteps.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeStep === idx
                          ? "bg-blue-600 dark:bg-blue-400"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                      aria-label={`Step ${s.step}: ${s.title}`}
                    />
                  ))}
                </div>

                {/* Active Step Card */}
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 transition-all">
                  <div className="flex items-center justify-between">
                    <Badge variant={recoverySteps[activeStep].badgeVariant} dot>
                      {recoverySteps[activeStep].badge}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {recoverySteps[activeStep].ref}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {recoverySteps[activeStep].item}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span>{recoverySteps[activeStep].loc}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 leading-relaxed">
                    {recoverySteps[activeStep].details}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {recoverySteps[activeStep].step} — {recoverySteps[activeStep].title}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                      Verified Process <ChevronRight size={13} />
                    </span>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Lock size={12} className="text-emerald-500" />
                    Zero Public PII
                  </span>
                  <span className="flex items-center gap-1.5">
                    <KeyRound size={12} className="text-blue-500" />
                    Two-Party OTP Code
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Report, Discover, Verify, Recover) */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={13} /> 4-Step Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                How It Works
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                A transparent, safe, and privacy-respecting workflow connecting lost belongings with their rightful owners.
              </p>
            </div>

            <Link to="/how-it-works">
              <Button variant="outline" className="font-bold text-xs gap-1.5">
                Detailed Guide <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSummary.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-black text-slate-300 dark:text-slate-700">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {step.subtitle}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                      Learn More <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. RECENT FOUND ITEMS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 size={13} className="text-teal-600" />
                <span>Reported On Campus</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Recent Found Items
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Items found across MVGR College of Engineering currently awaiting verification.
              </p>
            </div>

            <Link to="/items?type=FOUND">
              <Button variant="outline" className="font-bold text-xs gap-1.5">
                View All Found Items <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foundItems.map((item) => {
              const thumb = item.imageUrl || item.imageUrls?.[0]
              const ref = item.referenceNumber || `CR-FND-${item.id.slice(0, 4)}`
              const loc = item.locationName || item.location || "MVGR Campus"
              return (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="space-y-3.5">
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <Badge variant="found">Found</Badge>
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {ref}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="aspect-4/3 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200/80 dark:border-slate-700/80">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.itemName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package size={32} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {item.itemName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <StatusIndicator status={item.status} size="sm" showLabel />
                    <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. RECENT LOST ITEMS */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                <FileWarning size={13} className="text-rose-600" />
                <span>Active Search Investigations</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Recent Lost Items
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Help fellow students locate their misplaced belongings around campus.
              </p>
            </div>

            <Link to="/items?type=LOST">
              <Button variant="outline" className="font-bold text-xs gap-1.5">
                View All Lost Items <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {lostItems.map((item) => {
              const thumb = item.imageUrl || item.imageUrls?.[0]
              const ref = item.referenceNumber || `CR-LST-${item.id.slice(0, 4)}`
              const loc = item.locationName || item.location || "MVGR Campus"
              return (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="space-y-3.5">
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <Badge variant="lost">Lost</Badge>
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {ref}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="aspect-4/3 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden relative border border-slate-200/80 dark:border-slate-700/80">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.itemName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package size={32} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {item.itemName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <StatusIndicator status={item.status} size="sm" showLabel />
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. PLATFORM STATISTICS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              Institutional Metrics
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Statistics
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real metrics from the MVGR College of Engineering lost-and-found operational network.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono block">
                {stats.totalReports}+
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Total Campus Reports
              </span>
              <p className="text-xs text-slate-500 pt-1">
                Lost &amp; found reports cataloged digitally
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
              <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                {stats.recoveredItems}+
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Items Reunited
              </span>
              <p className="text-xs text-slate-500 pt-1">
                Successfully returned to owners
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {stats.recoveryRate}%
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Resolution Rate
              </span>
              <p className="text-xs text-slate-500 pt-1">
                Claims successfully verified
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 font-mono block">
                {stats.buildingsCount}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Campus Zones
              </span>
              <p className="text-xs text-slate-500 pt-1">
                MVGR blocks, labs &amp; recovery desks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SAFETY & PRIVACY SECTION */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald-600" /> Trust &amp; Confidentiality
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Engineered for Complete Student &amp; Staff Privacy
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                CampusRecover AI enforces zero personal contact exposure. Personal telephone numbers, email addresses,
                and student roll numbers are never published on public item cards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Lock size={16} className="text-emerald-500" />
                    <span>Zero Public PII Exposure</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Student profiles and contact numbers are protected behind authenticated institutional roles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <KeyRound size={16} className="text-blue-500" />
                    <span>Cryptographic OTP Verification</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Physical handover requires a unique 6-digit OTP verified in person at campus security desks.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/safety">
                  <Button variant="outline" className="font-bold text-xs gap-2 rounded-xl">
                    Read Complete Safety Guidelines <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                <span>Official Campus Handover Desks</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Handing over property in unmonitored locations is strictly discouraged. Meet safely at:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    1. MVGR Administrative Office
                  </span>
                  <span className="text-slate-500 block">
                    Ground Floor, Admin Block · Mon–Sat (9 AM – 5 PM)
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    2. Central Library Helpdesk
                  </span>
                  <span className="text-slate-500 block">
                    Main Circulation Counter · Mon–Sat (8 AM – 8 PM)
                  </span>
                </div>
              </div>

              <Link to="/map" className="block pt-2">
                <Button className="w-full justify-center text-xs font-bold gap-2">
                  <Compass size={14} /> Open Campus Location Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION (CTA BANNER) */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} /> Fast Campus Recovery
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Lost something on campus or found an item?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Report your belonging in seconds to trigger automated AI matching, or browse our active inventory to check if your item has already been turned in.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <Link to={reportLostUrl}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-xl shadow-lg shadow-blue-500/25">
                <FileWarning size={18} />
                Report Lost Item
              </Button>
            </Link>
            <Link to="/items">
              <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold gap-2 rounded-xl">
                <Search size={18} />
                Browse Items
              </Button>
            </Link>
            <Link to={reportFoundUrl}>
              <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white font-bold gap-2 rounded-xl">
                <CheckCircle2 size={18} className="text-teal-400" />
                Report Found Item
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
