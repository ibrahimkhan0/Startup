import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStartupById, deleteStartup } from '../services/api'
import { formatUSD } from '../utils/format'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function Row({ label, children }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 sm:col-span-2">{children}</dd>
    </div>
  )
}

export default function StartupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Result of the latest finished request, tagged with the id it answered. While it
  // differs from the current id a request is in flight, so isLoading is derived.
  const [result, setResult] = useState({ id: null, startup: null, error: null, notFound: false })
  const isLoading = result.id !== id
  const { startup, error, notFound } = result
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    getStartupById(id, controller.signal)
      .then((res) => setResult({ id, startup: res.data, error: null, notFound: false }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        // 404 = not found, 400 = malformed id: both mean "no such startup"
        const missing = err.status === 404 || err.status === 400
        setResult({
          id,
          startup: null,
          error: missing ? null : err.message || 'Failed to load startup',
          notFound: missing,
        })
      })

    return () => controller.abort()
  }, [id])

  async function handleDelete() {
    if (!window.confirm(`Delete "${startup.name}"? This cannot be undone.`)) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteStartup(id)
      navigate('/')
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this startup')
      setIsDeleting(false)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (notFound) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Startup not found</h1>
        <p className="mt-2 text-slate-600">It may have been deleted, or the link is wrong.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Back to all startups
        </Link>
      </div>
    )
  }
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        Back to all startups
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">{startup.name}</h1>
        <p className="mt-1 text-slate-600">{startup.tagline}</p>

        <dl className="mt-6 divide-y divide-slate-100">
          <Row label="Description">
            <p className="whitespace-pre-line">{startup.description}</p>
          </Row>
          <Row label="Industry">{startup.industry}</Row>
          <Row label="Funding stage">{startup.fundingStage}</Row>
          <Row label="Funding required">{formatUSD(startup.fundingRequired)}</Row>
          <Row label="Location">{startup.location}</Row>
          {startup.website && (
            <Row label="Website">
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-indigo-600 hover:underline"
              >
                {startup.website}
              </a>
            </Row>
          )}
        </dl>

        {deleteError && (
          <div className="mt-4">
            <ErrorMessage message={deleteError} />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/startups/${id}/edit`)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
