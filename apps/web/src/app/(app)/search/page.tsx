export default function SearchPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Search</h1>

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
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <p className="text-gray-400 mb-2">Coming soon</p>
        <p className="text-gray-500 text-sm">This feature is under development</p>
      </div>
    </div>
  )
}
