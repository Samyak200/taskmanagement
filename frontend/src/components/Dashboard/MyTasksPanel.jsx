import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { canManageProject } from '../../utils/project'

const STATUSES = ['Todo', 'In-Progress', 'Done']

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export default function MyTasksPanel() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const qs = new URLSearchParams()
    if (statusFilter) qs.set('status', statusFilter)
    if (overdueOnly) qs.set('overdue', 'true')
    const path = qs.toString() ? `/api/me/tasks?${qs}` : '/api/me/tasks'
    try {
      const res = await api(path)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to load tasks')
      setTasks(data.tasks || [])
    } catch (e) {
      setError(e.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, overdueOnly])

  useEffect(() => {
    load()
  }, [load])

  async function updateStatus(task, nextStatus) {
    const res = await api(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Could not update')
      return
    }
    setError('')
    load()
  }

  /** Assignees + project creators + global admin can patch status here. */
  function canQuickEdit(task) {
    if (user.role === 'admin') return true
    const assignees = (task.assignedTo || []).map((a) => String(a._id ?? a))
    if (assignees.includes(String(user._id))) return true
    const p = task.projectId
    if (p && typeof p === 'object' && p.createdBy != null) {
      return canManageProject(user, p)
    }
    return false
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            My assigned tasks
          </h2>
          <p className="text-xs text-slate-400">
            Only tasks where you are in <code className="text-slate-600">assignedTo</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
            />
            Overdue only
          </label>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks match your filters.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-2 font-medium">Title</th>
                <th className="pb-2 pr-2 font-medium">Project</th>
                <th className="pb-2 pr-2 font-medium">Deadline</th>
                <th className="pb-2 pr-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => {
                const pname =
                  t.projectId && typeof t.projectId === 'object' ? t.projectId.name : '—'
                const editable = canQuickEdit(t)
                return (
                  <tr key={t._id}>
                    <td className="py-3 pr-2 font-medium text-slate-800">{t.title}</td>
                    <td className="py-3 pr-2 text-slate-600">{pname}</td>
                    <td className="py-3 pr-2 text-slate-600">{fmtDate(t.deadline)}</td>
                    <td className="py-3 pr-2">
                      {editable ? (
                        <select
                          className="w-full max-w-9 rounded border border-slate-300 px-2 py-1 text-sm"
                          value={t.status}
                          onChange={(e) =>
                            updateStatus(t, e.target.value)
                          }
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{t.status}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <details className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-700">Your user id (for invites)</summary>
        <code className="mt-2 block select-all rounded bg-white px-2 py-1 text-slate-800">
          {user?._id}
        </code>
      </details>
    </section>
  )
}
