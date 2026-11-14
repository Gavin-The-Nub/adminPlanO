'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavProps {
  pendingClaimsCount: number
}

export default function AdminNav({ pendingClaimsCount }: AdminNavProps) {
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Claims Queue',
      href: '/admin/claims',
      badge: pendingClaimsCount > 0 ? pendingClaimsCount : null,
    },
    {
      label: 'Suppliers & Outreach',
      href: '/admin/suppliers',
    },
    {
      label: 'Coordinators',
      href: '/admin/coordinators',
    },
  ]

  return (
    <nav className="flex space-x-2 border-b border-border mb-6">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text hover:border-border'
            }`}
          >
            {tab.label}
            {tab.badge !== null && tab.badge !== undefined && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
