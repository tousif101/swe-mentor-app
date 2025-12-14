export default function PlannerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Planner</h1>

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
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
        <p className="text-gray-400 mb-2">Coming soon</p>
        <p className="text-gray-500 text-sm">This feature is under development</p>
      </div>
    </div>
  )
}
