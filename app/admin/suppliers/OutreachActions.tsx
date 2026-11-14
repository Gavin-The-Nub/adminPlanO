'use client'

import { useState } from 'react'

interface OutreachActionsProps {
  supplierId: string | null
  coordSupplierIds?: string[]
  supplierName: string
  isClaimed: boolean
}

export default function OutreachActions({
  supplierId,
  coordSupplierIds,
  supplierName,
  isClaimed,
}: OutreachActionsProps) {
  const [resolvedSupplierId, setResolvedSupplierId] = useState<string | null>(supplierId)
  const [promoting, setPromoting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPitch, setCopiedPitch] = useState(false)

  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://planoevents.site'
  ).replace(/\/+$/, '')

  const buildClaimUrl = (id: string) => `${origin}/claim/${id}`

  const buildPitchMessage = (id: string) =>
    `Hi ${supplierName}! Wedding coordinators in PlanO have added your business to client proposals. Claim your free verified profile to manage your official packages and rates: ${buildClaimUrl(id)}`

  async function ensureSupplierId(): Promise<string | null> {
    if (resolvedSupplierId) return resolvedSupplierId
    if (!coordSupplierIds || coordSupplierIds.length === 0) return null

    setPromoting(true)
    try {
      const res = await fetch('/api/admin/suppliers/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordSupplierIds }),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data?.supplierId) {
        setResolvedSupplierId(data.supplierId)
        return data.supplierId as string
      }
      return null
    } catch (e) {
      console.error('Failed to promote supplier for claim link', e)
      return null
    } finally {
      setPromoting(false)
    }
  }

  async function handleCopyLink() {
    const id = await ensureSupplierId()
    if (!id) return
    try {
      await navigator.clipboard.writeText(buildClaimUrl(id))
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (e) {
      console.error('Failed to copy link', e)
    }
  }

  async function handleCopyPitch() {
    const id = await ensureSupplierId()
    if (!id) return
    try {
      await navigator.clipboard.writeText(buildPitchMessage(id))
      setCopiedPitch(true)
      setTimeout(() => setCopiedPitch(false), 2000)
    } catch (e) {
      console.error('Failed to copy pitch', e)
    }
  }

  async function handlePreviewClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (resolvedSupplierId) return
    e.preventDefault()
    const id = await ensureSupplierId()
    if (id) {
      window.open(`/claim/${id}`, '_blank', 'noopener,noreferrer')
    }
  }

  if (isClaimed) {
    return (
      <span className="text-xs text-text-muted italic">Profile already claimed</span>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        disabled={promoting}
        onClick={handleCopyLink}
        className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-control)] border border-border bg-surface text-text hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-1 disabled:opacity-50"
        title="Copy raw claim link"
      >
        {copiedLink ? (
          <>
            <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-primary">Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Copy Link</span>
          </>
        )}
      </button>

      <button
        type="button"
        disabled={promoting}
        onClick={handleCopyPitch}
        className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-control)] bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1 disabled:opacity-50"
        title="Copy complete outreach message for Instagram DM / WhatsApp"
      >
        {copiedPitch ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Pitch Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Copy Pitch</span>
          </>
        )}
      </button>

      <a
        href={resolvedSupplierId ? `/claim/${resolvedSupplierId}` : '#'}
        onClick={handlePreviewClick}
        target="_blank"
        rel="noreferrer"
        className="p-1 text-text-muted hover:text-text transition-colors"
        title="Preview claim page in new tab"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
