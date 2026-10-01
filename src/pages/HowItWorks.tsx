import { FileWarning, Search, KeyRound, CheckCircle2 } from "lucide-react"
import { Link } from "react-router"
import { Button } from "../components/ui/Button"

export default function HowItWorks() {
  const steps = [
    {
      title: "Report an Item",
      desc: "Whether you lost or found something, simply fill out a quick report. Upload photos if you have them.",
      icon: FileWarning,
    },
    {
      title: "AI Matching",
      desc: "Our AI scans thousands of records and images in milliseconds to find exact matches between lost and found items.",
      icon: Search,
    },
    {
      title: "Secure Verification",
      desc: "Once a match is found, verify ownership via our secure Chat and generate a one-time QR code.",
      icon: KeyRound,
    },
    {
      title: "Successful Handover",
      desc: "Meet at a designated campus security office to scan the QR code and safely recover your belongings.",
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
          How It Works
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          A seamless, 4-step process designed to get lost items back to their
          owners as fast as possible.
        </p>
      </div>

      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -translate-y-1/2 hidden lg:block rounded-full"></div>
        <div className="grid lg:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl absolute -top-6 left-1/2 -translate-x-1/2 ring-8 ring-[#faf8ff] dark:ring-gray-950">
                {i + 1}
              </div>
              <div className="flex justify-center mb-6 mt-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <step.icon size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 text-center">
        <Link to="/signup">
          <Button size="lg">Get Started Now</Button>
        </Link>
      </div>
    </div>
  )
}
