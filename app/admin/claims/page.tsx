import { formatDistanceToNow } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import ClaimCard, { type ClaimCardData } from './ClaimCard'

export const metadata = { title: 'Supplier claims | PlanO Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminClaimsPage() {
  const admin = createAdminClient()
  const { data: claims } = await admin
    .from('supplier_claims')
    .select('id, contact_name, email, phone, proof_path, created_at, suppliers(name, category, city, social_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const cards: ClaimCardData[] = await Promise.all(
    (claims ?? []).map(async (c) => {
      const s = (Array.isArray(c.suppliers) ? c.suppliers[0] : c.suppliers) as
        | { name: string; category: string; city: string | null; social_url: string | null }
        | null
      const { data: signed } = await admin.storage.from('claim-proofs').createSignedUrl(c.proof_path, 3600)
      return {
        id: c.id,
        businessName: s?.name ?? 'Unknown business',
        category: s?.category ?? '',
        city: s?.city ?? null,
        socialUrl: s?.social_url ?? null,
        contactName: c.contact_name,
        email: c.email,
        phone: c.phone,
        proofUrl: signed?.signedUrl ?? null,
        proofIsPdf: c.proof_path.toLowerCase().endsWith('.pdf'),
        submitted: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
      }
    })
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display-sm text-text">Pending Claims Queue</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Review proof of ownership submissions and approve supplier accounts.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-border text-text">
          {cards.length} pending
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="bg-surface rounded-[var(--radius-card)] border border-border p-12 text-center">
          <p className="text-text font-medium mb-1">All caught up!</p>
          <p className="text-text-muted text-sm">No pending supplier claims to review right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((c) => <ClaimCard key={c.id} claim={c} />)}
        </div>
      )}
    </div>
  )
}
