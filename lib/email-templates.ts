import { escapeHtml, getAppUrl } from './email'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const BADGE_STYLES: Record<BadgeTone, { bg: string; text: string; border: string }> = {
  neutral: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
  success: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  warning: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  danger:  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  info:    { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
}

export interface DetailRow {
  label: string
  value: string
}

export interface EmailLayoutOptions {
  preheader: string
  title: string
  badge?: { label: string; tone?: BadgeTone }
  greeting: string
  bodyHtml: string
  details?: DetailRow[]
  cta?: { label: string; href: string }
  footnoteHtml?: string
}

export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const appUrl = getAppUrl()
  const badgeStyle = opts.badge ? BADGE_STYLES[opts.badge.tone ?? 'neutral'] : null

  const badgeHtml = opts.badge && badgeStyle
    ? `<div style="margin:0 0 14px 0;">
        <span style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;border-radius:999px;background:${badgeStyle.bg};color:${badgeStyle.text};border:1px solid ${badgeStyle.border};">
          ${escapeHtml(opts.badge.label)}
        </span>
      </div>`
    : ''

  const detailsHtml = opts.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate;overflow:hidden;background:#f8fafc;">
        ${opts.details
          .map(
            (row, idx) => `<tr>
              <td style="padding:10px 14px;font-size:13px;color:#64748b;width:38%;vertical-align:top;${idx > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">${escapeHtml(row.label)}</td>
              <td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:600;vertical-align:top;${idx > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">${escapeHtml(row.value)}</td>
            </tr>`
          )
          .join('')}
      </table>`
    : ''

  const ctaHtml = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
        <tr>
          <td style="border-radius:8px;background:#0f172a;">
            <a href="${escapeHtml(opts.cta.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
              ${escapeHtml(opts.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : ''

  const footnoteHtml = opts.footnoteHtml
    ? `<p style="margin:18px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;">${opts.footnoteHtml}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:0 4px 16px 4px;">
              <a href="${escapeHtml(appUrl)}" style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;text-decoration:none;">PlanO</a>
              <span style="font-size:12px;color:#64748b;margin-left:8px;">Event Coordination Platform</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px 28px;box-shadow:0 1px 2px rgba(15,23,42,0.04);">
              ${badgeHtml}
              <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.35;font-weight:700;color:#0f172a;">${escapeHtml(opts.title)}</h1>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#334155;">${escapeHtml(opts.greeting)}</p>
              <div style="font-size:14px;line-height:1.65;color:#334155;">
                ${opts.bodyHtml}
              </div>
              ${detailsHtml}
              ${ctaHtml}
              ${footnoteHtml}
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px 0;" />
              <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                Sincerely,<br />
                <strong style="color:#0f172a;">The PlanO Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 4px 0 4px;font-size:11px;line-height:1.6;color:#64748b;text-align:center;">
              This is an automated message from PlanO (<a href="${escapeHtml(appUrl)}" style="color:#64748b;text-decoration:underline;">${escapeHtml(appUrl.replace(/^https?:\/\//, ''))}</a>).
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function claimApprovedEmail(args: {
  contactName: string
  businessName: string
}) {
  const appUrl = getAppUrl()
  const firstName = args.contactName.trim().split(/\s+/)[0] || 'there'
  return {
    subject: `Approved: Your PlanO Supplier Profile (${args.businessName})`,
    html: renderEmailLayout({
      preheader: `Your business ${args.businessName} is now verified on PlanO.`,
      badge: { label: 'Verified & Approved', tone: 'success' },
      title: 'Your Supplier Profile Is Approved',
      greeting: `Dear ${firstName},`,
      bodyHtml: `<p style="margin:0 0 12px 0;">Congratulations! Your ownership claim for <strong>${escapeHtml(args.businessName)}</strong> has been verified and approved.</p>
        <p style="margin:0;">You may now sign in to your supplier dashboard to manage your packages, pricing, and portfolio.</p>`,
      details: [
        { label: 'Business Name', value: args.businessName },
        { label: 'Verification Status', value: 'Approved & Active' },
      ],
      cta: { label: 'Sign In to PlanO', href: `${appUrl}/login` },
    }),
  }
}

export function claimRejectedEmail(args: {
  contactName: string
  businessName: string
  supplierId: string
  note: string
}) {
  const appUrl = getAppUrl()
  const firstName = args.contactName.trim().split(/\s+/)[0] || 'there'
  return {
    subject: `Action Required: Your PlanO Claim for ${args.businessName}`,
    html: renderEmailLayout({
      preheader: `Additional verification is needed for ${args.businessName}.`,
      badge: { label: 'Action Required', tone: 'danger' },
      title: 'Supplier Claim Could Not Be Verified',
      greeting: `Dear ${firstName},`,
      bodyHtml: `<p style="margin:0 0 12px 0;">We reviewed your ownership claim for <strong>${escapeHtml(args.businessName)}</strong>, but we could not approve it at this time.</p>
        <div style="margin:14px 0;padding:12px 14px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px;color:#7f1d1d;">
          <strong>Reviewer Note:</strong> ${escapeHtml(args.note)}
        </div>
        <p style="margin:0;">Please submit a new claim with updated verification documents using the button below.</p>`,
      cta: { label: 'Resubmit Claim', href: `${appUrl}/claim/${args.supplierId}` },
    }),
  }
}

