import { createAdminClient } from '@/lib/supabase/admin'
import SuppliersTable, { type SupplierRowData } from './SuppliersTable'

export const metadata = { title: 'Suppliers & Outreach | PlanO Admin' }
export const dynamic = 'force-dynamic'

interface CoordinatorProfileRef {
  brand_name: string | null
  display_name: string | null
}

interface CoordinatorSupplierRow {
  id: string
  supplier_id: string | null
  name: string | null
  category: string | null
  city: string | null
  social_url: string | null
  coordinator_profiles: CoordinatorProfileRef | CoordinatorProfileRef[] | null
}

function getCoordinatorName(
  profiles: CoordinatorProfileRef | CoordinatorProfileRef[] | null
): string {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles
  return profile?.brand_name || profile?.display_name || 'Anonymous Coordinator'
}

export default async function AdminSuppliersPage() {
  const admin = createAdminClient()

  // 1. Fetch all suppliers (both public PlanO network and private supplier rows)
  const { data: rawSuppliers } = await admin
    .from('suppliers')
    .select('id, name, category, city, social_url, is_claimed, is_verified, is_public, created_at')
    .order('name', { ascending: true })

  // 2. Fetch all coordinator network links (including My Network entries without a supplier_id)
  const { data: links } = await admin
    .from('coordinator_suppliers')
    .select('id, supplier_id, name, category, city, social_url, coordinator_profiles(brand_name, display_name)')

  const supplierIdSet = new Set((rawSuppliers ?? []).map((s) => s.id))

  // Group traction for existing suppliers rows, and collect unlinked My Network entries
  const tractionMap = new Map<string, string[]>()
  const unlinkedGroups = new Map<
    string,
    {
      name: string
      category: string
      city: string | null
      socialUrl: string | null
      coordSupplierIds: string[]
      coordinatorNames: string[]
    }
  >()

  if (links) {
    for (const item of links as CoordinatorSupplierRow[]) {
      const coordName = getCoordinatorName(item.coordinator_profiles)

      if (item.supplier_id && supplierIdSet.has(item.supplier_id)) {
        const existing = tractionMap.get(item.supplier_id) ?? []
        existing.push(coordName)
        tractionMap.set(item.supplier_id, existing)
      } else if (item.name) {
        const key = `${item.name.trim().toLowerCase()}::${(item.category || '').trim().toLowerCase()}`
        const group = unlinkedGroups.get(key)
        if (group) {
          group.coordSupplierIds.push(item.id)
          group.coordinatorNames.push(coordName)
          if (!group.city && item.city) group.city = item.city
          if (!group.socialUrl && item.social_url) group.socialUrl = item.social_url
        } else {
          unlinkedGroups.set(key, {
            name: item.name.trim(),
            category: item.category || 'Uncategorized',
            city: item.city,
            socialUrl: item.social_url,
            coordSupplierIds: [item.id],
            coordinatorNames: [coordName],
          })
        }
      }
    }
  }

  // 3. Transform data for client table
  const linkedSuppliers: SupplierRowData[] = (rawSuppliers ?? []).map((s) => {
    const coords = tractionMap.get(s.id) ?? []
    return {
      id: s.id,
      supplierId: s.id,
      name: s.name,
      category: s.category,
      city: s.city,
      socialUrl: s.social_url,
      isClaimed: Boolean(s.is_claimed),
      isVerified: Boolean(s.is_verified),
      inPlanoNetwork: s.is_public !== false,
      inCoordinatorNetwork: coords.length > 0 || s.is_public === false,
      coordinatorTractionCount: coords.length,
      coordinatorNames: coords,
    }
  })

  const unlinkedSuppliers: SupplierRowData[] = Array.from(unlinkedGroups.values()).map(
    (g) => ({
      id: `coord:${g.coordSupplierIds[0]}`,
      supplierId: null,
      coordSupplierIds: g.coordSupplierIds,
      name: g.name,
      category: g.category,
      city: g.city,
      socialUrl: g.socialUrl,
      isClaimed: false,
      isVerified: false,
      inPlanoNetwork: false,
      inCoordinatorNetwork: true,
      coordinatorTractionCount: g.coordinatorNames.length,
      coordinatorNames: g.coordinatorNames,
    })
  )

  const suppliers: SupplierRowData[] = [...linkedSuppliers, ...unlinkedSuppliers].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Collect unique categories for dropdown
  const categories = Array.from(
    new Set(suppliers.map((s) => s.category).filter(Boolean))
  ).sort()

  const totalCount = suppliers.length
  const unclaimedCount = suppliers.filter((s) => !s.isClaimed).length
  const claimedCount = suppliers.filter((s) => s.isClaimed).length
  const withTractionCount = suppliers.filter(
    (s) => !s.isClaimed && s.coordinatorTractionCount > 0
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-display-sm text-text">Suppliers Directory & Outreach</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Identify high-traction vendors added by coordinators, copy claim links, and send outreach messages.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            Total Vendors
          </p>
          <p className="text-2xl font-bold text-text mt-1">{totalCount}</p>
        </div>

        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            Unclaimed Opportunities
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{unclaimedCount}</p>
        </div>

        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            High Traction Outreach
          </p>
          <p className="text-2xl font-bold text-primary mt-1">{withTractionCount}</p>
        </div>

        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
            Claimed & Verified
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{claimedCount}</p>
        </div>
      </div>

      {/* Interactive Suppliers Table */}
      <SuppliersTable
        initialSuppliers={suppliers}
        categories={categories}
      />
    </div>
  )
}
