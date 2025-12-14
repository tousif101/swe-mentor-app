'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarNavItemProps {
  href: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

export function SidebarNavItem({ href, label, icon, onClick }: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  const content = (
    <>
      <div className="w-5 h-5">{icon}</div>
      <span className="text-sm">{label}</span>
    </>
  )

  const className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
    isActive
      ? 'bg-primary-600/20 text-primary-400'
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
  }`

  if (onClick) {
    return (
      <button onClick={onClick} className={`w-full ${className}`}>
        {content}
      </button>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}
