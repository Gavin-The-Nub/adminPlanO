import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/claims'
import { sendEmailSafe } from '@/lib/email'
import { claimApprovedEmail, claimRejectedEmail } from '@/lib/email-templates'

/**
 * POST /api/admin/claims/:id
 * Body: { action: 'approve' } | { action: 'reject', note: string }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()

  const { data: claim } = await admin
    .from('supplier_claims')
    .select('*, suppliers(name)')
    .eq('id', id)
    .single()
  if (!claim || claim.status !== 'pending') {
    return NextResponse.json({ error: 'Claim not found or already reviewed.' }, { status: 404 })
  }

  const businessName = claim.suppliers?.name ?? 'your business'
  const contactName = String(claim.contact_name ?? '')
  const review = { reviewed_by: adminUser.userId, reviewed_at: new Date().toISOString() }

  if (body.action === 'approve') {
    const { error: e1 } = await admin
      .from('supplier_claims').update({ status: 'approved', ...review }).eq('id', id).eq('status', 'pending')
    if (e1) return NextResponse.json({ error: 'Could not update claim.' }, { status: 500 })

    await admin
      .from('suppliers')
      .update({ is_claimed: true, is_verified: true, claimed_user_id: claim.user_id })
      .eq('id', claim.supplier_id)
    await admin.auth.admin.updateUserById(claim.user_id, { ban_duration: 'none' })

    const tpl = claimApprovedEmail({ contactName, businessName })
    await sendEmailSafe('claims:approve', { to: claim.email, ...tpl })

    return NextResponse.json({ ok: true })
  }

  if (body.action === 'reject') {
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    if (!note) return NextResponse.json({ error: 'A rejection note is required.' }, { status: 400 })

    await admin
      .from('supplier_claims')
      .update({ status: 'rejected', review_note: note, ...review })
      .eq('id', id)
      .eq('status', 'pending')
    // Delete the unapproved account so the supplier can resubmit with the same email.
    await admin.auth.admin.deleteUser(claim.user_id)

    const tpl = claimRejectedEmail({
      contactName,
      businessName,
      supplierId: claim.supplier_id,
      note,
    })
    await sendEmailSafe('claims:reject', { to: claim.email, ...tpl })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
}
