import { useEffect, useState } from 'react'
import { getStartups } from '../services/api'
import FilterBar from '../components/FilterBar'
import StartupCard from '../components/StartupCard'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

const EMPTY_QUERY = { search: '', industry: '', stage: '', page: 1 }

// FilterBar may call its handlers with a value or with a DOM event; accept both.
const valueOf = (v) => (v && v.target ? v.target.value : v)

export default function HomePage() {
  const [searchInput, setSearchInput] = useState('') // what the user is typing
  const [query, setQuery] = useState(EMPTY_QUERY) // everything that triggers a fetch
  // The latest finished request, tagged with the query it answered. While result.query
  // differs from the current query a request is in flight, so isLoading is derived
  // instead of being set synchronously inside the effect.
  const [result, setResult] = useState({ query: null, startups: [], pagination: null, error: null })
  const isLoading = result.query !== query
  const { startups, pagination, error } = result

  // 1. Debounce typing into query.search (400 ms). No state change if the value is unchanged.
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchInput.trim()
      setQuery((prev) => (prev.search === value ? prev : { ...prev, search: value, page: 1 }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // 2. Fetch whenever query changes. Abort the previous request on cleanup.
  useEffect(() => {
    const controller = new AbortController()

    getStartups(query, controller.signal)
      .then((res) => {
        setResult({ query, startups: res.data, pagination: res.pagination, error: null })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return // cancelled on purpose: touch no state
        setResult({
          query,
          startups: [],
          pagination: null,
          error: err.message || 'Failed to load startups',
        })
      })

    return () => controller.abort()
  }, [query])

  const handleIndustryChange = (v) => setQuery((p) => ({ ...p, industry: valueOf(v), page: 1 }))
  const handleStageChange = (v) => setQuery((p) => ({ ...p, stage: valueOf(v), page: 1 }))
  const handlePageChange = (page) => setQuery((p) => ({ ...p, page }))
  const handleClear = () => {
    setSearchInput('')
    setQuery(EMPTY_QUERY)
  }

  const hasFilters = Boolean(searchInput || query.search || query.industry || query.stage)

  let content
  if (isLoading) {
    content = <LoadingSpinner />
  } else if (error) {
    content = <ErrorMessage message={error} />
  } else if (startups.length === 0) {
    content = (
      <EmptyState
        message={hasFilters ? 'No startups match your search.' : 'No startups yet. Add the first one.'}
        action={hasFilters ? { label: 'Clear filters', onClick: handleClear } : undefined}
      />
    )
  } else {
    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => (
            <StartupCard key={s._id} startup={s} />
          ))}
        </div>
        <div className="mt-8">
          <Pagination
            page={query.page}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={handlePageChange}
          />
        </div>
      </>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Startups</h1>
      {/* FilterBar stays mounted in every state so typing is never interrupted */}
      <div className="mb-6">
        <FilterBar
          searchInput={searchInput}
          industry={query.industry}
          stage={query.stage}
          onSearchChange={(v) => setSearchInput(valueOf(v))}
          onIndustryChange={handleIndustryChange}
          onStageChange={handleStageChange}
        />
      </div>
      {content}
    </div>
  )
}
