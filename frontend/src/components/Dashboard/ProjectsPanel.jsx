import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { canManageProject, userId } from '../../utils/project'

const STATUSES = ['Todo', 'In-Progress', 'Done']

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function parseIdList(raw) {
  return raw
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export default function ProjectsPanel() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [error, setError] = useState('')

  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [memberInput, setMemberInput] = useState('')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [taskStatus, setTaskStatus] = useState('Todo')
  const [taskAssignees, setTaskAssignees] = useState([])

  const selected = projects.find((p) => String(p._id) === String(selectedId)) || null
  const manage = selected ? canManageProject(user, selected) : false

  const loadProjects = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const res = await api('/api/projects')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to load projects')
      setProjects(data.projects || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingList(false)
    }
  }, [])

  const loadTasks = useCallback(async (projectId) => {
    if (!projectId) {
      setTasks([])
      return
    }
    setLoadingTasks(true)
    try {
      const res = await api(`/api/projects/${projectId}/tasks`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to load tasks')
      setTasks(data.tasks || [])
    } catch (e) {
      setError(e.message)
      setTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (selectedId) loadTasks(selectedId)
  }, [selectedId, loadTasks])

  useEffect(() => {
    if (!selected) {
      setTaskAssignees([])
      return
    }
    const mids = [...(selected.members || [])].map((m) => userId(m))
    if (mids.includes(String(user._id))) {
      setTaskAssignees([String(user._id)])
    } else if (mids.length) {
      setTaskAssignees([mids[0]])
    } else {
      setTaskAssignees([])
    }
  }, [selectedId, selected, user._id])

  async function createProject(e) {
    e.preventDefault()
    setError('')
    const res = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Create failed')
      return
    }
    setNewName('')
    setNewDesc('')
    await loadProjects()
    setSelectedId(String(data.project._id))
  }

  async function patchProject(e) {
    e.preventDefault()
    if (!selected || !manage) return
    setError('')
    const res = await api(`/api/projects/${selected._id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: selected.name,
        description: selected.description ?? '',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Update failed')
      return
    }
    await loadProjects()
  }

  async function deleteProject() {
    if (!selected || !manage) return
    if (!window.confirm('Delete this project and all its tasks?')) return
    setError('')
    const res = await api(`/api/projects/${selected._id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Delete failed')
      return
    }
    setSelectedId(null)
    await loadProjects()
  }

  async function addMembers(e) {
    e.preventDefault()
    if (!selected || !manage) return
    const userIds = parseIdList(memberInput)
    if (!userIds.length) {
      setError('Paste at least one user id.')
      return
    }
    setError('')
    const res = await api(`/api/projects/${selected._id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Add members failed')
      return
    }
    setMemberInput('')
    await loadProjects()
  }

  async function removeMember(uid) {
    if (!selected || !manage) return
    setError('')
    const res = await api(`/api/projects/${selected._id}/members`, {
      method: 'DELETE',
      body: JSON.stringify({ userIds: [uid] }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Remove failed')
      return
    }
    await loadProjects()
  }

  async function createTask(e) {
    e.preventDefault()
    if (!selected || !manage) return
    if (!taskTitle.trim()) {
      setError('Task title required')
      return
    }
    if (!taskAssignees.length) {
      setError('Pick at least one assignee from project members.')
      return
    }
    setError('')
    const body = {
      title: taskTitle.trim(),
      assignedTo: taskAssignees,
      status: taskStatus,
    }
    if (taskDeadline) body.deadline = new Date(taskDeadline).toISOString()

    const res = await api(`/api/projects/${selected._id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Task create failed')
      return
    }
    setTaskTitle('')
    setTaskDeadline('')
    setTaskStatus('Todo')
    await loadTasks(selected._id)
  }

  async function deleteTask(taskId) {
    if (!manage) return
    if (!window.confirm('Delete this task?')) return
    setError('')
    const res = await api(`/api/tasks/${taskId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Delete task failed')
      return
    }
    await loadTasks(selectedId)
  }

  async function patchTaskField(task, body) {
    setError('')
    const res = await api(`/api/tasks/${task._id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.message || 'Update failed')
      return
    }
    await loadTasks(selectedId)
  }

  function toggleAssignee(id) {
    const s = String(id)
    setTaskAssignees((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function updateSelectedField(field, value) {
    setProjects((list) =>
      list.map((p) =>
        String(p._id) === String(selectedId) ? { ...p, [field]: value } : p
      )
    )
  }

  const memberList = selected
    ? [...(selected.members || [])].map((m) => ({
        id: userId(m),
        username: m.username,
        email: m.email,
        role: m.role,
      }))
    : []

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Projects &amp; tasks
      </h2>
      <p className="text-xs text-slate-400">
        Anyone logged in can create a project; only admins and project creators manage members/tasks.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <form
        className="mt-4 flex flex-wrap items-end gap-3 border-b border-slate-100 pb-5"
        onSubmit={createProject}
      >
        <div className="min-w-10 flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-600">New project name</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Marketing website"
            required
          />
        </div>
        <div className="min-w-12 flex-2 space-y-1">
          <label className="text-xs font-medium text-slate-600">Description</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => loadProjects()}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          Reload list
        </button>
      </form>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <h3 className="text-xs font-semibold text-slate-500">Your projects</h3>
          {loadingList ? (
            <p className="mt-2 text-sm text-slate-500">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No projects yet.</p>
          ) : (
            <ul className="mt-2 flex max-h-80 flex-col gap-2 overflow-auto pr-1">
              {projects.map((p) => {
                const active = String(selectedId) === String(p._id)
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(String(p._id))}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:border-indigo-300 ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <span className="font-medium text-slate-900">{p.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {(p.members || []).length} members
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="min-h-12 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a project to see details.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  {manage ? (
                    <>
                      <input
                        className="w-full rounded border border-slate-300 px-2 py-1 text-base font-semibold"
                        value={selected.name}
                        onChange={(e) => updateSelectedField('name', e.target.value)}
                      />
                      <textarea
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        rows={2}
                        value={selected.description || ''}
                        onChange={(e) =>
                          updateSelectedField('description', e.target.value)
                        }
                        placeholder="Description"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={patchProject}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-900"
                        >
                          Save project
                        </button>
                        <button
                          type="button"
                          onClick={deleteProject}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                        >
                          Delete project
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-semibold text-slate-900">
                        {selected.name}
                      </h4>
                      <p className="text-sm text-slate-600">{selected.description || '—'}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-500">Members</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {memberList.map((m) => {
                    const creatorId = userId(selected.createdBy)
                    const isCreator = m.id === creatorId
                    return (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2 py-1.5 ring-1 ring-slate-100"
                      >
                        <span>
                          <span className="font-medium">{m.username}</span>
                          <span className="text-slate-400"> · {m.email}</span>
                          {isCreator ? (
                            <span className="ml-2 text-xs text-indigo-600">creator</span>
                          ) : null}
                        </span>
                        {manage && !isCreator ? (
                          <button
                            type="button"
                            className="text-xs text-rose-600 hover:underline"
                            onClick={() => removeMember(m.id)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>

                {manage ? (
                  <form className="mt-3 flex flex-wrap gap-2" onSubmit={addMembers}>
                    <input
                      className="min-w-12 flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                      placeholder="Paste user ids (comma or space separated)"
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                    >
                      Add members
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-semibold uppercase text-slate-500">Tasks</h4>
                {loadingTasks ? (
                  <p className="mt-2 text-sm text-slate-500">Loading tasks…</p>
                ) : tasks.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No tasks in this project.</p>
                ) : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-560px text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-2 pr-2 font-medium">Title</th>
                          <th className="pb-2 pr-2 font-medium">Assignees</th>
                          <th className="pb-2 pr-2 font-medium">Deadline</th>
                          <th className="pb-2 pr-2 font-medium">Status</th>
                          <th className="pb-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tasks.map((t) => (
                          <tr key={t._id}>
                            <td className="py-2 pr-2">
                              {manage ? (
                                <input
                                  className="w-full min-w-8 rounded border border-slate-200 px-1 py-0.5 text-sm"
                                  defaultValue={t.title}
                                  onBlur={(e) => {
                                    const v = e.target.value.trim()
                                    if (v && v !== t.title)
                                      patchTaskField(t, { title: v })
                                  }}
                                />
                              ) : (
                                t.title
                              )}
                            </td>
                            <td className="py-2 pr-2 text-xs text-slate-600">
                              {(t.assignedTo || [])
                                .map((a) => a.username || userId(a))
                                .join(', ')}
                            </td>
                            <td className="py-2 pr-2 text-slate-600">
                              {fmtDate(t.deadline)}
                            </td>
                            <td className="py-2 pr-2">
                              {manage ? (
                                <select
                                  className="rounded border border-slate-300 px-1 py-0.5 text-sm"
                                  value={t.status}
                                  onChange={(e) =>
                                    patchTaskField(t, { status: e.target.value })
                                  }
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                t.status
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {manage ? (
                                <button
                                  type="button"
                                  className="text-xs text-rose-600 hover:underline"
                                  onClick={() => deleteTask(t._id)}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {manage ? (
                  <form
                    className="mt-4 space-y-3 rounded-lg bg-white p-3 ring-1 ring-slate-100"
                    onSubmit={createTask}
                  >
                    <p className="text-xs font-semibold text-slate-600">New task</p>
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      placeholder="Title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="text-xs text-slate-500">Deadline</label>
                        <input
                          type="datetime-local"
                          className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
                          value={taskDeadline}
                          onChange={(e) => setTaskDeadline(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Initial status</label>
                        <select
                          className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
                          value={taskStatus}
                          onChange={(e) => setTaskStatus(e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Assign to</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {memberList.map((m) => (
                          <label
                            key={m.id}
                            className="flex cursor-pointer items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={taskAssignees.includes(m.id)}
                              onChange={() => toggleAssignee(m.id)}
                            />
                            {m.username}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Add task
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
