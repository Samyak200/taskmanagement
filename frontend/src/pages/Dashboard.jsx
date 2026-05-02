import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatsCards from '../components/dashboard/StatsCards'
import MyTasksPanel from '../components/dashboard/MyTasksPanel'
import ProjectsPanel from '../components/dashboard/ProjectsPanel'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api('/api/me/stats')
        const data = await res.json().catch(() => ({}))
        if (!cancelled && res.ok) setStats(data)
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">
      <StatsCards stats={stats} loading={loadingStats} />
      <MyTasksPanel />
      <ProjectsPanel />
    </div>
  )
}
