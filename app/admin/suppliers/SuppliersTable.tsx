'use client'

import { useState, useMemo } from 'react'
import OutreachActions from './OutreachActions'

export interface SupplierRowData {
  id: string
  supplierId: string | null
  coordSupplierIds?: string[]
  name: string
  category: string
  city: string | null
  socialUrl: string | null
  isClaimed: boolean
  isVerified: boolean
  inPlanoNetwork: boolean
  inCoordinatorNetwork: boolean
  coordinatorTractionCount: number
  coordinatorNames: string[]
}

interface SuppliersTableProps {
  initialSuppliers: SupplierRowData[]
  categories: string[]
}

export default function SuppliersTable({
  initialSuppliers,
  categories,
}: SuppliersTableProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all')
  const [networkFilter, setNetworkFilter] = useState<'all' | 'plano' | 'my_network'>('all')
  const [sortBy, setSortBy] = useState<'traction' | 'name'>('traction')

  const filteredSuppliers = useMemo(() => {
    return initialSuppliers
      .filter((s) => {
        if (statusFilter === 'unclaimed' && s.isClaimed) return false
        if (statusFilter === 'claimed' && !s.isClaimed) return false
        if (networkFilter === 'plano' && !s.inPlanoNetwork) return false
        if (networkFilter === 'my_network' && !s.inCoordinatorNetwork) return false
        if (selectedCategory && s.category !== selectedCategory) return false

        if (search.trim()) {
          const q = search.toLowerCase()
          const nameMatch = s.name.toLowerCase().includes(q)
          const cityMatch = s.city ? s.city.toLowerCase().includes(q) : false
          if (!nameMatch && !cityMatch) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'traction') {
          if (b.coordinatorTractionCount !== a.coordinatorTractionCount) {
            return b.coordinatorTractionCount - a.coordinatorTractionCount
          }
        }
        return a.name.localeCompare(b.name)
      })
  }, [initialSuppliers, search, selectedCategory, statusFilter, networkFilter, sortBy])

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="bg-surface rounded-[var(--radius-card)] border border-border p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor name or city..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-[var(--radius-control)] border border-border bg-surface text-text placeholder:text-text-muted focus:border-primary"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm rounded-[var(--radius-control)] border border-border bg-surface text-text focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter & Sort toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-[var(--radius-control)] border border-border bg-accent/40 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-[calc(var(--radius-control)-2px)] transition-colors ${
                statusFilter === 'all'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              All ({initialSuppliers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unclaimed')}
              className={`px-2.5 py-1 rounded-[calc(var(--radius-control)-2px)] transition-colors ${
                statusFilter === 'unclaimed'
                  ? 'bg-surface text-text shadow-sm font-semibold text-primary'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Unclaimed ({initialSuppliers.filter((s) => !s.isClaimed).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('claimed')}
              className={`px-2.5 py-1 rounded-[calc(var(--radius-control)-2px)] transition-colors ${
                statusFilter === 'claimed'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Claimed ({initialSuppliers.filter((s) => s.isClaimed).length})
            </button>
          </div>

          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value as 'all' | 'plano' | 'my_network')}
            className="px-3 py-2 text-xs rounded-[var(--radius-control)] border border-border bg-surface text-text"
          >
            <option value="all">All Networks</option>
            <option value="plano">PlanO Network</option>
            <option value="my_network">My Network (Coordinators)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'traction' | 'name')}
            className="px-3 py-2 text-xs rounded-[var(--radius-control)] border border-border bg-surface text-text"
          >
            <option value="traction">Sort: Most Traction</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-surface rounded-[var(--radius-card)] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent/60 text-xs font-semibold text-text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3">Supplier Name & Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Coordinators Traction</th>
                <th className="px-4 py-3 text-right">Outreach Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    No suppliers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{s.name}</div>
                      <div className="text-xs text-text-muted flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span>{s.category}</span>
                        {s.inPlanoNetwork && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-text-muted">
                            PlanO Network
                          </span>
                        )}
                        {s.inCoordinatorNetwork && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            My Network
                          </span>
                        )}
                        {s.socialUrl && (
                          <a
                            href={s.socialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-xs"
                          >
                            Social ↗
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-text-muted">
                      {s.city || '—'}
                    </td>

                    <td className="px-4 py-3">
                      {s.isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Claimed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">
                          Unclaimed
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {s.coordinatorTractionCount > 0 ? (
                        <div className="group relative inline-block">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary cursor-help">
                            ★ In {s.coordinatorTractionCount} coordinator{s.coordinatorTractionCount === 1 ? '' : 's'}
                          </span>
                          {/* Hover list of coordinators */}
                          <div className="hidden group-hover:block absolute z-20 bottom-full left-0 mb-1 w-64 p-2 bg-surface rounded shadow-lg border border-border text-xs text-text">
                            <p className="font-semibold mb-1 text-text-muted text-[10px] uppercase">
                              Added by coordinators:
                            </p>
                            <ul className="list-disc pl-3.5 space-y-0.5 text-text">
                              {s.coordinatorNames.map((name, i) => (
                                <li key={i}>{name}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">None yet</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <OutreachActions
                          supplierId={s.supplierId}
                          coordSupplierIds={s.coordSupplierIds}
                          supplierName={s.name}
                          isClaimed={s.isClaimed}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-accent/40 border-t border-border text-xs text-text-muted flex items-center justify-between">
          <span>
            Showing {filteredSuppliers.length} of {initialSuppliers.length} suppliers
          </span>
          <span>Tip: Click <b>Copy Pitch</b> to paste directly into Instagram DM or WhatsApp.</span>
        </div>
      </div>
    </div>
  )
}
