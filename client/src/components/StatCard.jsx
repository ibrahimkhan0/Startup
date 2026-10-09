// A single metric tile for the dashboard.
// label — the metric name, e.g. "Total Startups"
// value — the formatted value, e.g. "$12,500,000" or "42"
export default function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
