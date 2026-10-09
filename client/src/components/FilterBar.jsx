import { INDUSTRIES, FUNDING_STAGES } from '../utils/constants'

// Search input + two dropdowns for the startup list page.
// All state lives in HomePage — FilterBar is fully controlled.
//
// Props:
//   searchInput      — current text input value (raw, not yet debounced)
//   industry         — currently selected industry filter or ''
//   stage            — currently selected funding stage filter or ''
//   onSearchChange   — called with the new string on every keystroke
//   onIndustryChange — called with the selected industry string
//   onStageChange    — called with the selected stage string
export default function FilterBar({
  searchInput,
  industry,
  stage,
  onSearchChange,
  onIndustryChange,
  onStageChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Name search */}
      <input
        type="search"
        placeholder="Search by name…"
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-64"
        aria-label="Search startups by name"
      />

      {/* Industry dropdown */}
      <select
        value={industry}
        onChange={(e) => onIndustryChange(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Filter by industry"
      >
        <option value="">All industries</option>
        {INDUSTRIES.map((ind) => (
          <option key={ind} value={ind}>
            {ind}
          </option>
        ))}
      </select>

      {/* Funding stage dropdown */}
      <select
        value={stage}
        onChange={(e) => onStageChange(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Filter by funding stage"
      >
        <option value="">All stages</option>
        {FUNDING_STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}
