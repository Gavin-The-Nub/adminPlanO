'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { login } from './actions'

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <Image
            src="/plano-bk.svg"
            alt="PlanO Logo"
            width={110}
            height={32}
            priority
            style={{ height: 'auto' }}
          />
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Local Admin
          </span>
        </div>

        <h1 className="text-xl font-bold text-text mb-1">Admin Sign In</h1>
        <p className="text-sm text-text-muted mb-6">
          Sign in with your PlanO administrator account.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-error/30 bg-error-light px-3.5 py-2.5 text-sm text-error">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@planoevents.site"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

