import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Search,
  ShieldCheck,
  Brain,
  QrCode,
  KeyRound,
  Users,
  Building2,
  ArrowDown,
  Layers,
  Clock,
  ChevronRight,
  Eye,
  Check,
  Lock,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { LogoMark } from "../components/ui/Logo"

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0)

  // Auto cycle through recovery flow steps in hero visual
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  const recoverySteps = [
    {
      title: "1. Lost Report Logged",
      badge: "Lost Item",
      badgeVariant: "lost" as const,
      item: "Black HP Pavilion Laptop",
      ref: "CR-LST-1042",
      loc: "Engineering Block · 2nd Floor",
      time: "10:30 AM",
      desc: "Reported lost with stickers and USB dongle attached.",
    },
    {
      title: "2. Multimodal AI Analysis",
      badge: "Gemini AI Engine",
      badgeVariant: "ai" as const,
      item: "Scanning 94 opposite open reports...",
      ref: "92% Confidence Match",
      loc: "Matching: Brand, Color, Physical Location",
      time: "Real-time",
      desc: "Vision analysis matches keyboard markings and serial prefix.",
    },
    {
      title: "3. Potential Match Found",
      badge: "Found Item",
      badgeVariant: "found" as const,
      item: "Black HP Laptop with stickers",
      ref: "CR-FND-1078",
      loc: "Library 1st Floor Study Carrel",
      time: "11:15 AM",
      desc: "Found by Sarah Davis (Student 2) and submitted.",
    },
    {
      title: "4. OTP / QR Handover Verified",
      badge: "Recovered",
      badgeVariant: "recovered" as const,
      item: "Status: Case Closed & Recovered",
      ref: "OTP: 839-201 Verified",
      loc: "Handed over safely on campus",
      time: "Complete",
      desc: "Secure 6-digit cryptographic OTP validated. Belonging returned!",
    },
  ]

  const howItWorks = [
    {
      num: "01",
      title: "Report",
      subtitle: "Lost or Found in seconds",
      desc: "Provide basic item details, campus location, date, and optionally upload a snapshot. A unique tracking reference is automatically assigned.",
      icon: FileWarning,
      accent: "from-rose-500/10 to-transparent text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
      cta: "Report Lost",
      href: "/report-lost",
    },
    {
      num: "02",
      title: "AI Match",
      subtitle: "Multimodal Intelligence",
      desc: "Gemini AI immediately evaluates reported items using semantic keyword descriptions, category, location, and visual photo analysis with calculated similarity scores.",
      icon: Brain,
      accent: "from-purple-500/10 to-transparent text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
      cta: "Explore AI",
      href: "/search",
    },
    {
      num: "03",
      title: "Recover",
      subtitle: "OTP & QR Verified Handover",
      desc: "Admin confirms the match, unlocking verified student contacts. Coordinate a physical meetup and verify custody transfer with a 6-digit OTP or secure QR code.",
      icon: ShieldCheck,
      accent: "from-teal-500/10 to-transparent text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/40",
      cta: "Verify Code",
      href: "/verify",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
                <Sparkles size={14} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                <span>Next-Gen Campus Recovery Engine</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
                  Find it. <br />
                  <span className="text-blue-600 dark:text-blue-400">Match it.</span> <br />
                  Recover it.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  CampusRecover AI connects lost and found items across your campus
                  using intelligent matching and secure verification.
                </p>
              </div>

              {/* Hero Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/report-lost" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 font-bold cursor-pointer"
                  >
                    <FileWarning size={18} /> Report Lost Item
                  </Button>
                </Link>

                <Link to="/report-found" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center gap-2 font-bold cursor-pointer"
                  >
                    <CheckCircle2 size={18} className="text-teal-600 dark:text-teal-400" />
                    Report Found Item
                  </Button>
                </Link>

                <Link to="/search" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                  >
                    <Search size={16} /> Explore Items
                  </Button>
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    94.8%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    AI Match Accuracy
                  </p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    &lt; 3 mins
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Average Pair Speed
                  </p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    100%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    OTP Verified Handovers
                  </p>
                </div>
              </div>
            </div>

            {/* Right Hero: Product-Focused Interactive Recovery Flow Visual */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Live Recovery Pipeline
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Step {activeStep + 1} of 4
                  </span>
                </div>

                {/* Stepper pills */}
                <div className="grid grid-cols-4 gap-1.5 mb-6">
                  {recoverySteps.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        activeStep === idx
                          ? "bg-blue-600 dark:bg-blue-400"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                      aria-label={`Show ${s.title}`}
                    />
                  ))}
                </div>

                {/* Active Stage Card */}
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <Badge variant={recoverySteps[activeStep].badgeVariant} dot>
                      {recoverySteps[activeStep].badge}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {recoverySteps[activeStep].ref}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {recoverySteps[activeStep].item}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{recoverySteps[activeStep].loc}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                    {recoverySteps[activeStep].desc}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{recoverySteps[activeStep].title}</span>
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                      Automated Pipeline <ChevronRight size={13} />
                    </span>
                  </div>
                </div>

                {/* Flow preview path */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Lock size={12} className="text-emerald-500" /> Zero False Claims
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain size={12} className="text-purple-500" /> Gemini 1.5 Powered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How CampusRecover Works" */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              Simple 3-Party Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              How CampusRecover Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              A frictionless campus workflow uniting students who lost belongings,
              finders who want to help, and campus administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="bg-slate-50 dark:bg-slate-950/40 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-3xl font-black text-slate-300 dark:text-slate-700">
                        {step.num}
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs group-hover:scale-110 transition-transform">
                        <Icon size={22} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {step.subtitle}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800/80">
                    <Link
                      to={step.href}
                      className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                    >
                      {step.cta} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Multimodal AI Matching Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-indigo-800/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                <Brain size={14} />
                <span>Multimodal Vision & NLP</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                AI Matching that looks beyond simple text keywords.
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                When a wallet or laptop is reported, our Gemini-backed matching
                engine simultaneously inspects image colors, brand emblems,
                physical condition, campus building proximity, and incident timestamps.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Image Feature & Color Extraction</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Building & Location Proximity</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Semantic Description Similarity</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Clear Human-Readable AI Reasoning</span>
                </div>
              </div>

              <div className="pt-4">
                <Link to="/search">
                  <Button
                    size="lg"
                    className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-sm shadow-lg shadow-white/10 cursor-pointer"
                  >
                    View Search Directory <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* AI Signal Visual Card */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  AI Matching Signals
                </span>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  92% Confidence
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span className="text-slate-300">Category Compatibility</span>
                  <span className="font-bold text-emerald-400">100% (Electronics)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span className="text-slate-300">Location Proximity</span>
                  <span className="font-bold text-emerald-400">95% (Library Block)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span className="text-slate-300">Visual Color & Tone</span>
                  <span className="font-bold text-emerald-400">90% (Black Leather)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span className="text-slate-300">Incident Date Range</span>
                  <span className="font-bold text-emerald-400">Within 24 Hours</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 italic pt-1">
                &ldquo;Both reports describe a black leather item lost and recovered
                around the central library block with matching serial stamps.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secure Recovery / Verification Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold uppercase tracking-wider">
                <KeyRound size={14} /> Secure Custody Chain
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Zero Fraud with Two-Party OTP &amp; QR Handover
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                CampusRecover guarantees items are only returned to their rightful
                owners. Once a match is confirmed, an encrypted single-use 6-digit OTP
                and dynamic QR token are issued.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      6-Digit Expiring OTP Code
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Valid for 15 minutes during physical handover. Entered directly
                      by the finder or campus officer.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Instant QR Token Verification
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Quick scan using any smartphone camera marks both reports as
                      Recovered instantly in the database.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Handover Card Mockup */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-md mx-auto w-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Campus Custody Handover
                  </span>
                  <p className="text-[11px] text-slate-500">Session ID: #CR-HO-9201</p>
                </div>
                <Badge variant="recovered" dot>
                  Verified
                </Badge>
              </div>

              <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  One-Time Verification OTP
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-widest">
                  8 4 9 · 2 1 0
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  ✓ Validated by Security Desk
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Lost Item Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    CR-LST-1042
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Found Item Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    CR-FND-1078
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Handover Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Recovered &amp; Closed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Final CTA */}
      <section className="py-24 max-w-5xl mx-auto px-6 text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
          <LogoMark size={32} />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Help return what belongs on campus.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base max-w-xl mx-auto">
            Join your university lost &amp; found network. Report what you lost, help
            peers recover what was misplaced.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/report-lost">
            <Button size="lg" className="w-full sm:w-auto font-bold cursor-pointer">
              Report a Lost Item
            </Button>
          </Link>
          <Link to="/report-found">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto font-bold cursor-pointer"
            >
              Report a Found Item
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-bold text-slate-900 dark:text-white">
              CampusRecover AI
            </span>
            <span>· Campus Lost &amp; Found Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/features" className="hover:text-slate-900 dark:hover:text-white">
              Features
            </Link>
            <Link to="/how-it-works" className="hover:text-slate-900 dark:hover:text-white">
              How it Works
            </Link>
            <Link to="/about" className="hover:text-slate-900 dark:hover:text-white">
              About
            </Link>
            <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
