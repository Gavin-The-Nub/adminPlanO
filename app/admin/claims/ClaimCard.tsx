'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type ClaimCardData = {
  id: string
  businessName: string
  category: string
  city: string | null
  socialUrl: string | null
  contactName: string
  email: string
  phone: string
  proofUrl: string | null
  proofIsPdf: boolean
  submitted: string
}

export default function ClaimCard({ claim }: { claim: ClaimCardData }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function act(payload: { action: 'approve' } | { action: 'reject'; note: string }) {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/admin/claims/${claim.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(json.error ?? 'Action failed.'); return }
    router.refresh()
  }

  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border p-5 space-y-3">
      <div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">PENDING</span>
        <h2 className="text-text font-semibold mt-2">{claim.businessName}</h2>
        <p className="text-text-muted text-sm">
          {claim.category}{claim.city ? ` · ${claim.city}` : ''}
        </p>
      </div>

      <ul className="text-sm text-text space-y-0.5">
        <li>Applicant: {claim.contactName}</li>
        <li>Email: {claim.email}</li>
        <li>Phone: {claim.phone}</li>
        {claim.socialUrl && (
          <li>Social: <a href={claim.socialUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{claim.socialUrl}</a></li>
        )}
      </ul>

      <div>
        <p className="text-xs text-text-muted mb-1">Uploaded proof</p>
        {claim.proofUrl ? (
          claim.proofIsPdf ? (
            <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">Open PDF</a>
          ) : (
            <a href={claim.proofUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={claim.proofUrl} alt={`Proof for ${claim.businessName}`} className="h-32 rounded border border-border object-cover" />
            </a>
          )
        ) : (
          <p className="text-sm text-error">Proof unavailable.</p>
        )}
      </div>

      <p className="text-xs text-text-muted">Submitted {claim.submitted}</p>

      {error && <p className="text-sm text-error">{error}</p>}

      {rejecting ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason, e.g. Proof was blurry, please re-upload"
            rows={3}
            className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-surface text-text text-sm focus:border-primary"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRejecting(false)} disabled={busy} className="px-3 py-2 text-sm text-text-muted">Cancel</button>
            <button
              onClick={() => act({ action: 'reject', note })}
              disabled={busy || !note.trim()}
              className="px-4 py-2 text-sm rounded-[var(--radius-control)] bg-error text-white disabled:opacity-50"
            >
              {busy ? 'Sending...' : 'Confirm reject'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setRejecting(true)} disabled={busy} className="px-4 py-2 text-sm rounded-[var(--radius-control)] border border-border text-text disabled:opacity-50">
            Reject with Note
          </button>
          <button onClick={() => act({ action: 'approve' })} disabled={busy} className="px-4 py-2 text-sm rounded-[var(--radius-control)] bg-primary text-white hover:bg-primary-dark disabled:opacity-50">
            {busy ? 'Approving...' : 'Approve'}
          </button>
        </div>
      )}
    </div>
  )
}
