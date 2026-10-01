export default function About() {
  return (
    <div className="py-24 max-w-4xl mx-auto px-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">
        About CampusRecover AI
      </h1>
      <div className="prose prose-lg text-gray-600 dark:text-gray-300">
        <p className="text-xl leading-relaxed mb-8 text-gray-700 dark:text-gray-200">
          CampusRecover AI was born out of a simple observation: universities
          manage thousands of lost items every year using outdated spreadsheets,
          disorganized physical logs, and fragmented communication systems.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          Our Mission
        </h2>
        <p className="mb-6">
          We believe that returning a lost item shouldn't be a game of chance.
          Our mission is to leverage artificial intelligence and modern SaaS
          architecture to create the world's most efficient, secure, and
          user-friendly lost and found ecosystem for educational institutions.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          The Technology
        </h2>
        <p className="mb-6">
          At the core of CampusRecover is our proprietary image recognition
          engine. By instantly analyzing shape, color, brand logos, and text
          (OCR), we reduce the time campus security spends verifying items by
          over 80%.
        </p>
      </div>
    </div>
  )
}
