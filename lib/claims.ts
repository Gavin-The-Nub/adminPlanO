import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const claimSchema = z.object({
  supplierId: z.string().uuid(),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  contactName: z.string().trim().min(2, 'Enter the contact person name.'),
  phone: z.string().trim().min(7, 'Enter a valid mobile number.').max(20),
})

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_PROOF_BYTES = 8 * 1024 * 1024

export function validateProof(file: File): string | null {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) return 'Proof must be a JPG, PNG, WebP or PDF.'
  if (file.size > MAX_PROOF_BYTES) return 'Proof must be under 8MB.'
  return null
}

/** Returns the admin's user id, or null if the caller is not a signed-in admin. */
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('coordinator_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return data?.is_admin ? { userId: user.id } : null
}
