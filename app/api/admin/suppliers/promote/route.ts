import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/claims'

const promoteSchema = z.object({
  coordSupplierIds: z.array(z.string().uuid()).min(1),
})

/**
 * POST /api/admin/suppliers/promote
 * Promotes an unlinked coordinator_suppliers entry (My Network) into a
 * non-public suppliers row so an admin can generate a claim link for outreach.
 */
export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = promoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const { coordSupplierIds } = parsed.data
  const admin = createAdminClient()

  const { data: rows, error: fetchErr } = await admin
    .from('coordinator_suppliers')
    .select('id, supplier_id, name, category, city, social_url, contact')
    .in('id', coordSupplierIds)

  if (fetchErr || !rows || rows.length === 0) {
    return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 })
  }

  // If any matching row already links to a valid suppliers row, reuse it
  const existingLinked = rows.find((r) => Boolean(r.supplier_id))
  if (existingLinked?.supplier_id) {
    const { data: existingSupplier } = await admin
      .from('suppliers')
      .select('id')
      .eq('id', existingLinked.supplier_id)
      .maybeSingle()

    if (existingSupplier) {
      return NextResponse.json({ supplierId: existingSupplier.id })
    }
  }

  const source = rows[0]
  const { data: newSupplier, error: insertErr } = await admin
    .from('suppliers')
    .insert({
      name: source.name,
      category: source.category,
      city: source.city || null,
      social_url: source.social_url || null,
      contact: source.contact || null,
      is_public: false,
      is_verified: false,
      is_claimed: false,
    })
    .select('id')
    .single()

  if (insertErr || !newSupplier) {
    return NextResponse.json(
      { error: insertErr?.message ?? 'Could not create supplier record.' },
      { status: 500 }
    )
  }

  await admin
    .from('coordinator_suppliers')
    .update({ supplier_id: newSupplier.id })
    .in('id', coordSupplierIds)
    .is('supplier_id', null)

  return NextResponse.json({ supplierId: newSupplier.id })
}

