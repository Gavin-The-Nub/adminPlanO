import { createAdminClient } from '@/lib/supabase/admin'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Coordinators | PlanO Admin' }
export const dynamic = 'force-dynamic'

interface CoordinatorRow {
  id: string
  display_name: string | null
  brand_name: string | null
  preferred_language: string | null
  service_areas: string[] | null
  pricing_tier: string | null
  onboarding_completed: boolean | null
  created_at: string
}

export default async function AdminCoordinatorsPage() {
  const admin = createAdminClient()

  // 1. Fetch coordinators
  const { data: rawCoordinators } = await admin
    .from('coordinator_profiles')
    .select('id, display_name, brand_name, preferred_language, service_areas, pricing_tier, onboarding_completed, created_at')
    .order('created_at', { ascending: false })

  // 2. Fetch coordinator supplier counts
  const { data: vendorLinks } = await admin
    .from('coordinator_suppliers')
    .select('coordinator_id')

  const countMap = new Map<string, number>()
  if (vendorLinks) {
    for (const link of vendorLinks) {
      if (!link.coordinator_id) continue
      countMap.set(link.coordinator_id, (countMap.get(link.coordinator_id) ?? 0) + 1)
    }
  }

  const coordinators = (rawCoordinators ?? []) as CoordinatorRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-text">Coordinators Directory</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Active wedding & event coordinators using PlanO and curating vendor networks.
        </p>
      </div>

      {/* Metric */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            Total Coordinators
          </p>
          <p className="text-2xl font-bold text-text mt-1">{coordinators.length}</p>
        </div>

        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            Completed Onboarding
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {coordinators.filter((c) => c.onboarding_completed).length}
          </p>
        </div>

        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            Total Vendor Links Created
          </p>
          <p className="text-2xl font-bold text-primary mt-1">{vendorLinks?.length ?? 0}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-[var(--radius-card)] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent/60 text-xs font-semibold text-text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3">Coordinator Brand</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Service Areas</th>
                <th className="px-4 py-3">Network Size</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coordinators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    No coordinators registered yet.
                  </td>
                </tr>
              ) : (
                coordinators.map((c) => {
                  const vendorCount = countMap.get(c.id) ?? 0
                  return (
                    <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">
                          {c.brand_name || 'Unnamed Brand'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {c.pricing_tier || 'Standard tier'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-text">{c.display_name || '—'}</div>
                        <div className="text-xs text-text-muted">
                          Language: {c.preferred_language || 'English'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-text-muted text-xs max-w-xs truncate">
                        {c.service_areas && c.service_areas.length > 0
                          ? c.service_areas.join(', ')
                          : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {vendorCount} vendor{vendorCount === 1 ? '' : 's'} in network
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right text-xs text-text-muted">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
