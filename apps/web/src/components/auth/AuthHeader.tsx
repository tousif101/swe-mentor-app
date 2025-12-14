interface AuthHeaderProps {
  title: string
  subtitle?: string
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}
    </div>
  )
}
