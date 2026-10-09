import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStartupById, updateStartup } from '../services/api'
import StartupForm from '../components/StartupForm'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function EditStartupPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Result of the latest finished fetch, tagged with the id it answered. While it
  // differs from the current id a request is in flight, so isFetching is derived.
  const [result, setResult] = useState({ id: null, startup: null, error: null, notFound: false })
  const isFetching = result.id !== id
  const { startup, error: fetchError, notFound } = result

  const [isSaving, setIsSaving] = useState(false)
  const [serverErrors, setServerErrors] = useState([])
  const [generalError, setGeneralError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    getStartupById(id, controller.signal)
      .then((res) => setResult({ id, startup: res.data, error: null, notFound: false }))
      .catch((err) => {
        if (err.name === 'AbortError') return
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

  async function handleSubmit(values) {
    setIsSaving(true)
    setServerErrors([])
    setGeneralError(null)
    try {
      await updateStartup(id, values)
      navigate(`/startups/${id}`)
    } catch (err) {
      if (err.status === 422 && Array.isArray(err.errors)) setServerErrors(err.errors)
      else setGeneralError(err.message || 'Something went wrong. Please try again.')
      setIsSaving(false)
    }
  }

  if (isFetching) return <LoadingSpinner />
  if (notFound) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Startup not found</h1>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Back to all startups
        </Link>
      </div>
    )
  }
  if (fetchError) return <ErrorMessage message={fetchError} />

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Edit {startup.name}</h1>
      {generalError && (
        <div className="mb-4">
          <ErrorMessage message={generalError} />
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {/* The form only reads initialData once, so it is rendered after the fetch finishes */}
        <StartupForm
          key={startup._id}
          initialData={startup}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          serverErrors={serverErrors}
          submitLabel="Save changes"
        />
      </div>
    </div>
  )
}
