import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export default function Contact() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#131b2e] tracking-tight mb-4">
          Contact Sales
        </h1>
        <p className="text-xl text-gray-600">
          Interested in deploying CampusRecover AI at your institution? Let's
          talk.
        </p>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                First Name
              </label>
              <Input placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Last Name
              </label>
              <Input placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              University / Institution
            </label>
            <Input placeholder="Stanford University" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Work Email
            </label>
            <Input type="email" placeholder="jane@stanford.edu" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Message</label>
            <textarea
              className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#131b2e] placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 min-h-[120px] transition-all"
              placeholder="Tell us about your campus needs..."
            ></textarea>
          </div>
          <Button size="lg" className="w-full">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  )
}
