import { Link } from 'react-router-dom'

// Compact card shown in the startup list grid.
// startup — a single startup document from the API
export default function StartupCard({ startup }) {
  return (
    <Link
      to={`/startups/${startup._id}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-300"
    >
      {/* Badges row */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {startup.industry}
        </span>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {startup.fundingStage}
        </span>
      </div>

      {/* Name */}
      <h2 className="text-base font-semibold text-slate-900 leading-snug">
        {startup.name}
      </h2>

      {/* Tagline */}
      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
        {startup.tagline}
      </p>

      {/* Location */}
      <p className="mt-3 text-xs text-slate-400">{startup.location}</p>
    </Link>
  )
}
