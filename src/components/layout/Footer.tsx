import { Link } from "react-router"
import { MapPin, ShieldCheck, Heart, ArrowUpRight, Lock, KeyRound, Building2 } from "lucide-react"
import { Logo } from "../ui/Logo"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Wordmark & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <Logo size={36} />
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-normal">
              <strong>Lost something? Found something? Let&apos;s reunite it.</strong> The official,
              privacy-respecting lost-and-found recovery platform engineered specifically for MVGR College of Engineering.
            </p>
            <div className="pt-2 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span>3C65+24W, Raghumanda Road, Chintalavalasa, Vizianagaram, AP 535005</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-emerald-400 shrink-0" />
                <span>Central Handover: MVGR Administrative Office (Ground Floor)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Directory & Discovery */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Campus Directory
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/items" className="hover:text-white transition-colors">
                  All Items
                </Link>
              </li>
              <li>
                <Link to="/items?type=LOST" className="hover:text-white transition-colors">
                  Lost Belongings
                </Link>
              </li>
              <li>
                <Link to="/items?type=FOUND" className="hover:text-white transition-colors">
                  Found Property
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-white transition-colors">
                  Campus Block Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Safe Handover & Platform */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform &amp; Trust
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-white transition-colors">
                  Safety &amp; Privacy
                </Link>
              </li>
              <li>
                <Link to="/safety#handover" className="hover:text-white transition-colors">
                  Safe Handover Desks
                </Link>
              </li>
              <li>
                <Link to="/safety#campus-rules" className="hover:text-white transition-colors">
                  Custody Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Action & Account */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Reporting &amp; Access
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/report/lost" className="hover:text-white transition-colors">
                  Report Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report/found" className="hover:text-white transition-colors">
                  Report Found Item
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Student / Staff Login
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Campus Admin Portal</span>
                  <ArrowUpRight size={11} className="text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} CampusRecover AI · MVGR College of Engineering. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock size={12} /> Zero Public PII
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <KeyRound size={12} /> 6-Digit OTP Handover
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer
