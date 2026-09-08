import {
  Shield,
  Brain,
  Zap,
  Map as MapIcon,
  Lock,
  Smartphone,
} from "lucide-react"
import { Link } from "react-router"
import { Button } from "../components/ui/Button"

const FEATURES = [
  {
    title: "AI Image Recognition",
    description:
      "Upload a photo of a found item, and our AI instantly analyzes it to find matching lost reports with 98% accuracy.",
    icon: Brain,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Secure Verification",
    description:
      "We use a unique QR and OTP based handover system to ensure items are only returned to their rightful owners.",
    icon: Shield,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Interactive Campus Map",
    description:
      "See exactly where items were lost or found on a real-time interactive 3D map of your campus.",
    icon: MapIcon,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Real-time Notifications",
    description:
      "Get instant alerts on your phone or email the moment a potential match is found for your lost item.",
    icon: Zap,
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Privacy First",
    description:
      "Your identity and personal information are kept completely anonymous until the handover is approved.",
    icon: Lock,
    color: "bg-slate-100 text-slate-600",
  },
  {
    title: "Mobile Optimized",
    description:
      "Report lost items on the go. Our progressive web app works seamlessly on all iOS and Android devices.",
    icon: Smartphone,
    color: "bg-pink-100 text-pink-600",
  },
]

export default function Features() {
  return (
    <div className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#131b2e] tracking-tight mb-6">
          Enterprise-Grade Recovery System
        </h1>
        <p className="text-xl text-gray-600">
          Built for modern university campuses, combining state-of-the-art AI
          with rigorous security protocols.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className="p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all"
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}
            >
              <feature.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#131b2e] mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-24 text-center p-12 bg-blue-600 rounded-3xl text-white">
        <h2 className="text-3xl font-bold mb-6">
          Ready to bring CampusRecover to your university?
        </h2>
        <Link to="/contact">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
            Request a Demo
          </Button>
        </Link>
      </div>
    </div>
  )
}
