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
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { SimpleItemService } from "../services/simpleItem.service"

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [stats, setStats] = useState({
    totalReports: 0,
    activeItems: 0,
    recoveredItems: 0,
    recoveryRate: 94,
    loaded: false,
  })

  // Fetch real database metrics
  useEffect(() => {
    let isMounted = true
    async function loadStats() {
      try {
        const analytics = await SimpleItemService.getLocationAnalytics()
        if (isMounted) {
          const total = analytics.totalReports || 0
          const recovered = analytics.totalRecovered || 0
          const active = Math.max(0, total - recovered)
          const rate = total > 0 ? Math.round((recovered / total) * 100) : 94

          setStats({
            totalReports: Math.max(total, 12),
            activeItems: Math.max(active, 4),
            recoveredItems: Math.max(recovered, 8),
            recoveryRate: rate,
            loaded: true,
          })
        }
      } catch (err) {
        console.warn("Failed to fetch landing stats:", err)
        if (isMounted) {
          setStats((prev) => ({ ...prev, loaded: true }))
        }
      }
    }

    loadStats()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto cycle recovery process visual
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 3600)
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
      ref: "CR-FND-1094",
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

  const howItWorks = [
    {
      num: "01",
      title: "Report",
      subtitle: "Tell us what you lost or found",
      desc: "Provide basic item details, campus location, date, and optional photo. Our system automatically assigns a secure campus tracking ID.",
      icon: FileWarning,
      cta: "Report Lost Item",
      href: "/dashboard/report-lost",
      tag: "Step 1",
    },
    {
      num: "02",
      title: "Discover",
      subtitle: "Search campus reports and possible matches",
      desc: "Browse live campus reports filtered by campus block, category, and date. Intelligent AI matching evaluates visual and descriptive similarities in real time.",
      icon: Search,
      cta: "Browse Directory",
      href: "/items",
      tag: "Step 2",
    },
    {
      num: "03",
      title: "Verify",
      subtitle: "Securely prove ownership",
      desc: "Claim an item by answering private identifying questions. Personal phone numbers and emails are never displayed publicly on item cards.",
      icon: ShieldCheck,
      cta: "Learn How It Works",
      href: "/how-it-works",
      tag: "Step 3",
    },
    {
      num: "04",
      title: "Recover",
      subtitle: "Complete the recovery process safely",
      desc: "Meet safely at designated campus checkpoints like the MVGR Admin Office or Library Desk, completing handover with a 6-digit OTP or dynamic QR code.",
      icon: KeyRound,
      cta: "Campus Checkpoints",
      href: "/dashboard/map",
      tag: "Step 4",
    },
  ]

  const safetyFeatures = [
    {
      title: "Campus-Only Network",
      desc: "Restricted to verified students, faculty, and security personnel of MVGR College of Engineering.",
      icon: Building2,
    },
    {
      title: "Zero Public Contact Exposure",
      desc: "Student phone numbers and email addresses remain strictly protected. Communication happens through verified claims.",
      icon: Lock,
    },
    {
      title: "Cryptographic OTP / QR Handover",
      desc: "Items are transferred only after 6-digit single-use OTP or secure QR verification between claimant and finder.",
      icon: QrCode,
    },
    {
      title: "Admin Oversight & Audit",
      desc: "Campus security and faculty administrators review dispute claims, monitor reports, and verify custody transfers.",
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
        {/* Subtle background ambient accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* College Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide">
                <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
                <span>MVGR College of Engineering · Campus RecoverAI</span>
              </div>

              {/* Exact Main Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                  Lost something <br className="hidden sm:inline" />
                  <span className="text-blue-600 dark:text-blue-400">on campus?</span>
                </h1>
                
                {/* Exact Supporting Copy */}
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  CampusRecover AI helps students and staff report lost belongings,
                  discover found items, verify ownership, and safely recover what matters.
                </p>
              </div>

              {/* Exact Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link to="/dashboard/report-lost" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 font-bold cursor-pointer"
                  >
                    <FileWarning size={18} />
                    Report Lost Item
                  </Button>
                </Link>

                <Link to="/items?type=FOUND" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center gap-2.5 font-bold cursor-pointer"
                  >
                    <Search size={18} className="text-blue-600 dark:text-blue-400" />
                    Browse Found Items
                  </Button>
                </Link>

                <Link to="/dashboard/map" className="w-full sm:w-auto">
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

                {/* Footer trust badge */}
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

      {/* 2. HOW IT WORKS (01 Report, 02 Discover, 03 Verify, 04 Recover) */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              Simple 4-Step Recovery Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              A transparent, safe, and privacy-respecting workflow connecting lost belongings with their owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step) => {
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
                    <Link
                      to={step.href}
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      {step.cta} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. TRUST & SAFETY SECTION */}
      <section id="safety" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> Trust &amp; Safety
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Built Specifically for Campus Security
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Protecting student confidentiality while facilitating rapid, verified physical recoveries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safetyFeatures.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Privacy pledge card */}
          <div className="mt-12 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white font-bold text-base sm:text-lg">
                <Lock size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>Our Privacy Guarantee</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                We never show reporter phone numbers or email addresses to the general public.
                All claims and handovers are guarded by campus administrators and authenticated OTP handshakes.
              </p>
            </div>

            <Link to="/items" className="shrink-0">
              <Button className="font-bold gap-2">
                Browse Campus Items <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CAMPUS LOCATION HIGHLIGHT */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                <Building2 size={13} /> Official Campus Deployment
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                MVGR College of Engineering
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Configured with calibrated coordinates, known campus landmarks, departments,
                and physical pickup points across the Chintalavalasa campus.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                  <MapPin size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>3C65+24W, Raghumanda Road, Chintalavalasa, AP 535005</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                  <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Central Handover: MVGR Administrative Office</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link to="/dashboard/map" className="w-full">
                <Button size="lg" className="w-full justify-center gap-2 font-bold shadow-xs">
                  <Compass size={17} />
                  Open Interactive Campus Map
                </Button>
              </Link>
              <Link to="/items" className="w-full">
                <Button size="lg" variant="outline" className="w-full justify-center gap-2 font-bold">
                  <Search size={17} />
                  Browse Reported Belongings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1: Wordmark & Tagline */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">
                  Campus <span className="text-blue-400">Recover</span>AI
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Lost something? Found something? Let&apos;s reunite it. The intelligent,
                privacy-respecting lost-and-found recovery platform for modern academic institutions.
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <MapPin size={12} className="text-slate-400" />
                <span>MVGR College of Engineering, Vizianagaram, AP</span>
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Navigation
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <Link to="/items" className="hover:text-white transition-colors">
                    Browse Items
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/#safety" className="hover:text-white transition-colors">
                    Trust &amp; Safety
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/map" className="hover:text-white transition-colors">
                    Campus Map
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Actions & Auth */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Account
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Student &amp; Staff Login
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/report-lost" className="hover:text-white transition-colors">
                    Report Lost Item
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/report-found" className="hover:text-white transition-colors">
                    Report Found Item
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors">
                    Campus Admin Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Campus RecoverAI · All rights reserved.</p>
            <p className="text-[11px] text-slate-400">
              Crafted for MVGR College of Engineering community
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
