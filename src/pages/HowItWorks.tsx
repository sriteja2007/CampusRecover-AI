import { useState } from "react"
import { Link } from "react-router"
import {
  FileWarning,
  Search,
  KeyRound,
  CheckCircle2,
  Brain,
  ShieldCheck,
  QrCode,
  MapPin,
  Building2,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronRight,
  Clock,
  HelpCircle,
  Camera,
  Layers,
  Check,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { useAuth } from "../context/AuthContext"

export default function HowItWorks() {
  const { user } = useAuth()
  const [activeStepTab, setActiveStepTab] = useState(0)

  const steps = [
    {
      num: "01",
      title: "Report",
      subtitle: "Log your lost belonging or found property",
      icon: FileWarning,
      color: "rose",
      tag: "Step 1: Submission",
      description:
        "Whether you misplaced your calculator in the CSE block or discovered a wallet near the library, the process starts with a simple 60-second campus report.",
      bulletPoints: [
        "Upload optional clear photos of the item",
        "Select the exact MVGR campus block or landmark (e.g. Central Library, Admin Block, Mechanical)",
        "Provide public identifying details: category, brand, color, date, and approximate time",
        "Specify private verification questions (only visible to you and campus security) to verify future claims",
        "System automatically generates a unique tracking code (e.g., CR-LST-1082)",
      ],
      sampleOutput: {
        badge: "Report Active",
        title: "Scientific Calculator (TI-84 Plus)",
        ref: "CR-LST-1082",
        loc: "CSE / CSM Block · Floor 2",
        status: "Active Search",
      },
    },
    {
      num: "02",
      title: "Discover",
      subtitle: "Multimodal Gemini AI & Real-Time Campus Search",
      icon: Brain,
      color: "blue",
      tag: "Step 2: Matching",
      description:
        "Our intelligent engine processes your report in real time, comparing image visual features, textual descriptions, and geographic campus proximity.",
      bulletPoints: [
        "Multimodal Gemini AI vectorizes photos to detect color patterns, logo stamps, and brand geometry",
        "Campus directory automatically cross-references lost items against newly deposited found items",
        "Students can filter and browse live reports by campus block, category, date, and keywords",
        "Automated notifications alert both parties when high-confidence matches are discovered",
        "Visual confidence gauge indicates matching probability (e.g., 94% similarity score)",
      ],
      sampleOutput: {
        badge: "AI Match Candidate",
        title: "Calculators Correlated · 94% Confidence",
        ref: "CR-FND-1049",
        loc: "Central Library · Circulation Desk",
        status: "Match Suggested",
      },
    },
    {
      num: "03",
      title: "Verify",
      subtitle: "Confidential Ownership Proof Without Exposure",
      icon: ShieldCheck,
      color: "purple",
      tag: "Step 3: Verification",
      description:
        "Before any item is released or personal meetings are scheduled, ownership must be proven through secure administrative channels.",
      bulletPoints: [
        "Claimant answers private identifying questions (e.g., phone lock screen photo, internal wallet contents, unique engravings)",
        "Student phone numbers and email addresses remain strictly protected and are never displayed publicly",
        "Trained campus faculty and security administrators review the submitted evidence against original report notes",
        "False claims and suspicious submissions are instantly flagged and blocked by automated abuse filters",
        "Once verified, the system issues a secure handover clearance",
      ],
      sampleOutput: {
        badge: "Claim Approved",
        title: "Ownership Proof Confirmed by Admin",
        ref: "Security Verified",
        loc: "MVGR Admin Office",
        status: "Handover Authorized",
      },
    },
    {
      num: "04",
      title: "Recover",
      subtitle: "Cryptographic OTP / QR Code Campus Handover",
      icon: KeyRound,
      color: "emerald",
      tag: "Step 4: Custody Transfer",
      description:
        "Item exchange takes place safely at designated, monitored campus recovery desks with two-party cryptographic authorization.",
      bulletPoints: [
        "Claimant receives a single-use 6-digit cryptographic OTP and dynamic QR code on their dashboard",
        "Parties meet at the designated campus recovery desk (MVGR Administrative Office or Central Library Desk)",
        "The holding officer enters the 6-digit OTP into the portal to authenticate the claimant in person",
        "Physical custody is transferred and the item status immediately updates to 'RECOVERED'",
        "An immutable timestamped audit log records the transaction to prevent disputes",
      ],
      sampleOutput: {
        badge: "Case Closed",
        title: "Handover Complete · Item Returned",
        ref: "OTP: 839-204 Verified",
        loc: "Main Admin Counter",
        status: "Returned to Owner",
      },
    },
  ]

  const reportUrl = user ? "/report/lost" : "/login?redirect=/report/lost"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 border-b border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span>The Campus Recovery Workflow</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            How CampusRecover AI Reconnects You With Your Belongings
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
            A seamless 4-step framework uniting AI visual matching, student privacy protections,
            and cryptographic in-person handovers across MVGR College of Engineering.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-8">
            <Link to={reportUrl}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-xl shadow-lg shadow-blue-500/20">
                <FileWarning size={18} />
                Report Lost Item
              </Button>
            </Link>
            <Link to="/items">
              <Button size="lg" variant="outline" className="font-bold gap-2 rounded-xl border-slate-300 dark:border-slate-700">
                <Search size={18} className="text-blue-600" />
                Browse Campus Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE 4-STEP WALKTHROUGH */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            Step-by-Step Breakdown
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            The 4 Stages of Recovery
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Explore what happens from the moment an item is lost to its verified handover.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isActive = activeStepTab === idx
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStepTab(idx)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-slate-900 border-blue-600 shadow-md ring-2 ring-blue-600/20"
                    : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                    {s.num}
                  </span>
                  <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{s.subtitle}</p>
              </button>
            )
          })}
        </div>

        {/* Active Step Detailed Card */}
        {(() => {
          const step = steps[activeStepTab]
          const Icon = step.icon
          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                  <Icon size={14} />
                  <span>{step.tag}</span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {step.title}: {step.subtitle}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Key Features in this Phase:
                  </p>
                  <ul className="space-y-2">
                    {step.bulletPoints.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <Check size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sample Visual Mockup for the Active Step */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    System State Preview
                  </span>
                  <Badge variant="blue" dot>
                    {step.sampleOutput.badge}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {step.sampleOutput.ref}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {step.sampleOutput.title}
                    </h4>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{step.sampleOutput.loc}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock size={13} className="text-slate-400" />
                      <span>Status: <strong className="text-slate-900 dark:text-white">{step.sampleOutput.status}</strong></span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Lock size={13} className="text-blue-600 shrink-0" />
                    <span>Protected by Campus Security Ledger</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </section>

      {/* 3. CAMPUS RECOVERY ARCHITECTURE SUMMARY */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600">
                <Brain size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multimodal Gemini AI</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Images are analyzed for visual characteristics, logo emblems, color histograms, and dimensions, generating semantic matches with lost reports.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Zero Public PII</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No phone numbers or emails are ever exposed on public cards. All communication is authenticated and moderated by campus administrators.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600">
                <KeyRound size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cryptographic OTP</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Physical handover is completed only after a single-use 6-digit OTP or dynamic QR handshake is verified at the MVGR Administrative Office.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Begin?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Report your lost belonging now to initiate AI scanning and campus security tracking.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link to={reportUrl}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-xl shadow-lg shadow-blue-500/25">
                <FileWarning size={18} />
                Report Lost Item Now
              </Button>
            </Link>
            <Link to="/items">
              <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold gap-2 rounded-xl">
                <Search size={18} />
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
