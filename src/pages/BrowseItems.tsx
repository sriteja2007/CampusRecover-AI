import { Search, Filter, MapPin, Clock, ChevronRight } from "lucide-react"
import { Link } from "react-router"

export default function BrowseItems() {
  const items = [
    {
      id: 1,
      name: "AirPods Pro (Gen 2)",
      location: "Engineering Library",
      time: "2h ago",
      status: "Lost",
      color: "bg-red-100 text-red-700",
    },
    {
      id: 2,
      name: "HydroFlask Water Bottle",
      location: "Main Quad",
      time: "5h ago",
      status: "Found",
      color: "bg-teal-100 text-teal-700",
    },
    {
      id: 3,
      name: "Student ID - Alex Chen",
      location: "Memorial Auditorium",
      time: "1d ago",
      status: "Lost",
      color: "bg-red-100 text-red-700",
    },
    {
      id: 4,
      name: "MacBook Charger",
      location: "Student Center",
      time: "2d ago",
      status: "Found",
      color: "bg-teal-100 text-teal-700",
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">
      {/* Breadcrumb / Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/" className="hover:text-teal-600">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Browse Items</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">
          Browse Items
        </h1>
        <p className="text-gray-500 mt-1">
          Search through recently reported lost and found items on campus.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search for items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
                <Search size={20} />
              </div>
            </div>
            <div className="flex flex-col justify-between py-1 flex-1">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-[#131b2e] group-hover:text-teal-600 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.color}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                  <MapPin size={14} />{" "}
                  <span className="line-clamp-1">{item.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={14} /> {item.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
