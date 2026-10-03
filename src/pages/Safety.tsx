import { useState } from "react"
import { Link } from "react-router"
import {
  ShieldCheck,
  Lock,
  EyeOff,
  QrCode,
  KeyRound,
  AlertTriangle,
  Building2,
  FileCheck2,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  HelpCircle,
  FileWarning,
  Search,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { useAuth } from "../context/AuthContext"

export default function Safety() {
  const { user } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const safetyPillars = [
    {
      id: "privacy",
      title: "1. Privacy & Confidentiality",
      tagline: "Zero public personal contact exposure",
      icon: Lock,
      color: "blue",
      highlights: [
        "No phone numbers or emails are ever displayed on public item listings.",
        "Reporters and finders communicate exclusively through verified claims and administrative mediation.",
        "Student roll numbers and campus profile data remain protected by university role-based access rules.",
        "Item descriptions allow public visual discovery while concealing private internal contents.",
      ],
      description:
        "At CampusRecover AI, student and faculty privacy is our foundational invariant. When you report a lost backpack or find a set of keys, your personal contact information is never exposed to the internet. Potential claimants must prove ownership before any custody contact is facilitated.",
    },
    {
      id: "verification",
      title: "2. Rigorous Ownership Verification",
      tagline: "Multi-factor proof before custody transfer",
      icon: ShieldCheck,
      color: "emerald",
      highlights: [
        "Claimants must submit private identifying details (e.g. lock screen image, serial number, interior pockets).",
        "Visual AI matching provides similarity scores only; it never automatically approves item ownership.",
        "High-value belongings require in-person proof (device passcode unlock or original purchase receipt).",
        "Every claim undergoes human administrative inspection before pickup authorization.",
      ],
      description:
        "To prevent fraudulent claiming, CampusRecover AI enforces strict ownership verification. When an item is found, the finder notes secret identifying markers that are hidden from public view. Claimants must independently describe these secret features to be granted pickup authorization.",
    },
    {
      id: "handover",
      title: "3. Safe Campus Handover",
      tagline: "Designated checkpoints with cryptographic verification",
      icon: QrCode,
      color: "purple",
      highlights: [
        "All physical transfers take place at designated campus checkpoints: MVGR Administrative Office or Central Library.",
        "Exchange is authenticated with a single-use 6-digit cryptographic OTP or dynamic QR code.",
        "Handovers are supervised by campus security or authorized faculty coordinators.",
        "Chain-of-custody timestamp and verifying officer ID are permanently logged to immutable audit records.",
      ],
      description:
        "We eliminate unsafe off-campus or unmonitored meetings. All physical item recoveries take place at official, well-lit campus security stations. The claimant presents their single-use OTP or QR code, which the holding staff member verifies on the system before releasing the item.",
    },
    {
      id: "reporting-abuse",
      title: "4. Abuse Prevention & Rapid Moderation",
      tagline: "Immediate reporting and automated threat detection",
      icon: AlertTriangle,
      color: "rose",
      highlights: [
        "1-click 'Report Incorrect Info' button on every item page for suspicious or inaccurate reports.",
        "Automated rate-limiting prevents bot spamming and rapid brute-force claim submissions.",
        "Accounts engaging in fraudulent claims are immediately suspended across the entire platform.",
        "Campus administrators receive high-priority alerts for flagged content within the moderation dashboard.",
      ],
      description:
        "CampusRecover AI maintains an active defense against spam, trolling, and dishonest claims. Our system tracks anomaly patterns, limits claim velocity, and allows any member of the MVGR community to flag inappropriate content. Flagged reports are immediately quarantined for administrative review.",
    },
    {
      id: "campus-rules",
      title: "5. Institutional Rules & Custody Policies",
      tagline: "Compliant with MVGR College of Engineering regulations",
      icon: Building2,
      color: "amber",
      highlights: [
        "Standard items (books, water bottles, umbrellas) are held in campus custody for a minimum of 30 days.",
        "Valuable items (laptops, phones, wallets, jewelry, official IDs) are secured in campus lockers for 60 days.",
        "Deliberate false claims constitute a violation of the MVGR Student Code of Conduct and will be referred to the Disciplinary Committee.",
        "Unclaimed items after the retention period are audited and donated to institutional charity drives.",
      ],
      description:
        "CampusRecover AI operates in complete alignment with MVGR College of Engineering institutional bylaws. Items handed in to security are cataloged in our digital ledger and physically tagged in secure campus storage cabinets until claimed by their legitimate owners.",
    },
  ]

  const faqs = [
    {
      q: "Can other students see my phone number or email when I report an item?",
      a: "No. Never. Your institutional contact details are stored securely in encrypted records and are only accessible to verified campus administrators. Public listings only show the item details, campus location, date, and general description.",
    },
    {
      q: "What happens if someone tries to claim an item that isn't theirs?",
      a: "They will not be able to provide the confidential verification details (such as device passcode unlock, serial numbers, or hidden bag contents). In addition, all claims are reviewed by campus staff, and fraudulent claim attempts are logged and reported to college administration.",
    },
    {
      q: "Where do I go to collect an approved item?",
      a: "Once your claim is approved by campus security, your dashboard will display an approval notice with your 6-digit OTP. You can visit the MVGR Administrative Office (Ground Floor) or Central Library Helpdesk during standard campus hours to collect your belonging.",
    },
    {
      q: "What should I do if I find a high-value item like a laptop, wallet, or phone?",
      a: "Please report it immediately on CampusRecover AI and deposit the physical item with the nearest campus security officer or the MVGR Administrative Office for secure locker storage.",
    },
    {
      q: "How does the cryptographic OTP code work?",
      a: "When a claim is approved, the system generates a unique, time-sensitive 6-digit one-time password (OTP). When you arrive at the handover desk, the campus staff member enters this code into the portal to complete and finalize the recovery.",
    },
  ]

  const reportUrl = user ? "/report/lost" : "/login?redirect=/report/lost"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 border-b border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Campus Safety, Privacy &amp; Trust Guidelines</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            How We Protect Your Belongings &amp; Your Privacy
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
            CampusRecover AI is engineered specifically for university campuses with zero public contact exposure,
            multi-layer ownership proof, and cryptographically verified physical handovers.
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
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FIVE CORE SAFETY PILLARS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            Institutional Safeguards
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Five Pillars of Campus Safety
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Every feature on CampusRecover AI is designed around student safety and fraud prevention.
          </p>
        </div>

        <div className="space-y-12">
          {safetyPillars.map((pillar, index) => {
            const Icon = pillar.icon
            const isEven = index % 2 === 1
            return (
              <div
                key={pillar.id}
                id={pillar.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className={`lg:col-span-7 space-y-4 ${isEven ? "lg:order-2" : ""}`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                    <Icon size={14} />
                    <span>{pillar.tagline}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {pillar.description}
                  </p>

                  <ul className="space-y-2.5 pt-2">
                    {pillar.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`lg:col-span-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 ${isEven ? "lg:order-1" : ""}`}>
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Campus Enforcement Invariant
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Designed in consultation with campus security at MVGR College of Engineering. All reports,
                    verification attempts, and physical custody transfers are archived to an immutable audit ledger.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-500">
                    <MapPin size={12} className="text-blue-500" />
                    <span>MVGR Chintalavalasa Campus</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. DESIGNATED CAMPUS CHECKPOINTS */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                <MapPin size={13} /> Safe Meeting Locations
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Official Campus Handover Checkpoints
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Never agree to meet unverified individuals in isolated parking areas or off-campus locations.
                Always conduct belongings exchanges at one of our two official staffed recovery stations:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Building2 size={16} className="text-blue-600" />
                    <span>MVGR Administrative Office</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Main Administration Block, Ground Floor. Staffed Mon–Sat, 9:00 AM – 5:00 PM.
                  </p>
                  <span className="inline-block text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Primary Locker Storage
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Building2 size={16} className="text-purple-600" />
                    <span>Central Library Desk</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Library Entrance Circulation Counter. Staffed Mon–Sat, 8:00 AM – 8:00 PM.
                  </p>
                  <span className="inline-block text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                    Secondary Study Checkpoint
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-blue-600 text-white rounded-3xl p-8 shadow-xl space-y-4">
              <h3 className="text-xl font-black tracking-tight">Need Urgent Security Assistance?</h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                If you lost emergency medical supplies, critical examination identity cards, or suspect an item was stolen, contact campus security immediately.
              </p>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-blue-200 font-bold block">
                  Campus Security Desk
                </span>
                <span className="text-lg font-mono font-black tracking-wide">
                  Main Gate Security Post
                </span>
                <span className="text-xs text-blue-100 block">
                  3C65+24W, Raghumanda Road, Chintalavalasa
                </span>
              </div>
              <Link to="/items" className="block pt-2">
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold justify-center rounded-xl">
                  Search Lost Directory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={13} /> Common Inquiries
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Safety Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. BOTTOM CTA */}
      <section className="py-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Recover Your Belongings?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Report your lost item in less than 2 minutes. Our AI matching engine and campus staff are ready to help reunite you with what matters.
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
                Browse Campus Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
