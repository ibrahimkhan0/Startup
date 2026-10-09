import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../services/api'
import { formatUSD } from '../utils/format'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

function BreakdownList({ title, items }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item._id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-700">{item._id}</span>
            <span className="font-medium text-slate-900">{item.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function DashboardPage() {
  const [result, setResult] = useState(null) // { stats, error } once the request finishes
  const isLoading = result === null
  const stats = result?.stats ?? null
  const error = result?.error ?? null

  useEffect(() => {
    const controller = new AbortController()

    getDashboardStats(controller.signal)
      .then((res) => setResult({ stats: res.data, error: null }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({ stats: null, error: err.message || 'Failed to load dashboard' })
      })

    return () => controller.abort()
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  if (!stats || stats.totalStartups === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <EmptyState message="No data yet. Add a startup to see statistics." />
        <div className="mt-4 text-center">
          <Link to="/startups/new" className="text-sm font-medium text-indigo-600 hover:underline">
            Add a startup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total startups" value={stats.totalStartups} />
        <StatCard label="Top industry" value={stats.byIndustry[0]?._id ?? '—'} />
        <StatCard label="Total funding required" value={formatUSD(stats.totalFundingRequired)} />
        <StatCard label="Average funding required" value={formatUSD(stats.averageFundingRequired)} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <BreakdownList title="Startups by industry" items={stats.byIndustry} />
        <BreakdownList title="Startups by funding stage" items={stats.byStage} />
      </div>
    </div>
  )
}
