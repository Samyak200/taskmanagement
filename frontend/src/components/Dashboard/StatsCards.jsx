import React from 'react'

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const items = [
    {
      label: 'Total',
      value: stats.total,
      className:
        'rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100',
    },
    {
      label: 'Todo',
      value: stats.todo,
      className:
        'rounded-xl border border-amber-100 bg-amber-50/80 p-4 shadow-sm ring-1 ring-amber-100',
    },
    {
      label: 'In progress',
      value: stats.inProgress,
      className:
        'rounded-xl border border-sky-100 bg-sky-50/80 p-4 shadow-sm ring-1 ring-sky-100',
    },
    {
      label: 'Done',
      value: stats.done,
      className:
        'rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm ring-1 ring-emerald-100',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      className:
        'rounded-xl border border-rose-100 bg-rose-50/80 p-4 shadow-sm ring-1 ring-rose-100',
    },
  ]

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        My task overview
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(({ label, value, className }) => (
          <div key={label} className={className}>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
