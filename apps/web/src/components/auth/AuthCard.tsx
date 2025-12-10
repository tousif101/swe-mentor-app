export interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div
      className={`glass rounded-2xl w-full max-w-md p-8 md:p-10 animate-fade-in ${className}`}
    >
      {children}
    </div>
  )
}
