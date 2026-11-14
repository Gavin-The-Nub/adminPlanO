import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { requireAdmin } from '@/lib/claims'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/email'
import { signOut } from '@/app/login/actions'
import AdminNav from './AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()
  if (!admin) redirect('/login')

  const appUrl = getAppUrl()

  const adminClient = createAdminClient()
  const { count: pendingClaimsCount } = await adminClient
    .from('supplier_claims')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="min-h-screen bg-accent">
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-block">
              <Image
                src="/plano-bk.svg"
                alt="PlanO Logo"
                width={110}
                height={32}
                priority
                style={{ height: 'auto' }}
              />
            </Link>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <a
              href={`${appUrl}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text transition-colors font-medium"
            >
              Coordinator Dashboard →
            </a>
            <form action={signOut}>
              <button
                type="submit"
                className="text-text-muted hover:text-error transition-colors font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AdminNav pendingClaimsCount={pendingClaimsCount ?? 0} />
        {children}
      </main>
    </div>
  )
}
