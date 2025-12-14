export default function JournalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Journal</h1>

      <div className="rounded-xl bg-gray-800/30 p-8 text-center max-w-md">
        <svg
          className="w-12 h-12 text-gray-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
          />
        </svg>
        <p className="text-gray-400 mb-2">Coming soon</p>
        <p className="text-gray-500 text-sm">This feature is under development</p>
      </div>
    </div>
  )
}
