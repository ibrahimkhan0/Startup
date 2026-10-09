import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createStartup } from '../services/api'
import StartupForm from '../components/StartupForm'
import ErrorMessage from '../components/ErrorMessage'

export default function CreateStartupPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState([])
  const [generalError, setGeneralError] = useState(null)

  async function handleSubmit(values) {
    setIsLoading(true)
    setServerErrors([]) // clear old server errors before the new request
    setGeneralError(null)
    try {
      const res = await createStartup(values)
      navigate(`/startups/${res.data._id}`)
    } catch (err) {
      if (err.status === 422 && Array.isArray(err.errors)) setServerErrors(err.errors)
      else setGeneralError(err.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Add a startup</h1>
      {generalError && (
        <div className="mb-4">
          <ErrorMessage message={generalError} />
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <StartupForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          serverErrors={serverErrors}
          submitLabel="Create startup"
        />
      </div>
    </div>
  )
}
