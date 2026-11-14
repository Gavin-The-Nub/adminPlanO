import type { SupabaseClient } from '@supabase/supabase-js'

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  )
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://planoevents.site'
  ).replace(/\/+$/, '')
}

export interface SendEmailArgs {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Sends an email via Resend when RESEND_API_KEY is set.
 * Without a key, logs the email to the server console (dev fallback).
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ id?: string; skipped?: boolean }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[email:dev] to=${Array.isArray(args.to) ? args.to.join(',') : args.to} subject="${args.subject}"\n${args.html}`)
    return { skipped: true }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? process.env.RESEND_SENDER ?? 'PlanO <onboarding@resend.dev>',
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.text ? { text: args.text } : {}),
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error(`Email failed: ${res.status} ${await res.text()}`)
  }

  return res.json().catch(() => ({}))
}

/**
 * Non-throwing wrapper for notification emails so background/webhook/API flows
 * never fail if email delivery encounters an error.
 */
export async function sendEmailSafe(context: string, args: SendEmailArgs): Promise<void> {
  try {
    await sendEmail(args)
  } catch (err) {
    console.error(`[email:${context}] failed`, err)
  }
}

/**
 * Looks up a user's auth email by user ID using a service-role Supabase client.
 */
export async function getUserEmailById(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (error || !data?.user?.email) return null
    return data.user.email
  } catch {
    return null
  }
}

/**
 * Resolves email addresses for all admins (`coordinator_profiles.is_admin = true`),
 * falling back to `ADMIN_ALERT_EMAIL` if configured.
 */
export async function getAdminEmails(admin: SupabaseClient): Promise<string[]> {
  const emails = new Set<string>()
  try {
    const { data: admins } = await admin
      .from('coordinator_profiles')
      .select('id')
      .eq('is_admin', true)

    if (admins?.length) {
      const resolved = await Promise.all(admins.map((a) => getUserEmailById(admin, a.id)))
      for (const email of resolved) {
        if (email) emails.add(email)
      }
    }
  } catch {
    // ignore lookup failure, fall back to env
  }

  if (process.env.ADMIN_ALERT_EMAIL) {
    for (const e of process.env.ADMIN_ALERT_EMAIL.split(',')) {
      const trimmed = e.trim()
      if (trimmed) emails.add(trimmed)
    }
  }

  return Array.from(emails)
}
