import { useRouteError, isRouteErrorResponse, Link } from "react-router"
import { AlertOctagon, Home, RefreshCw } from "lucide-react"

export function RouteErrorBoundary() {
  const error = useRouteError()

  let errorMessage = "An unexpected application error occurred."
  let errorCode = "500"

  if (isRouteErrorResponse(error)) {
    errorCode = `${error.status}`
    errorMessage =
      error.statusText ||
      error.data?.message ||
      "Route not found or failed to load."
  } else if (error instanceof Error) {
    errorMessage = error.message
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertOctagon size={32} />
        </div>

        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          Error {errorCode}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
          Failed to load page
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {errorMessage}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={15} /> Reload page
          </button>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-colors"
          >
            <Home size={15} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RouteErrorBoundary
