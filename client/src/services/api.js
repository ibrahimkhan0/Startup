// The base URL comes from the Vite env variable injected at build time.
// The fallback uses port 5001 to match the local server configuration.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'


function buildQueryString(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  return new URLSearchParams(clean).toString()
}

// Central fetch wrapper used by every exported function.
// Error handling contract:
//   - AbortError (intentional cancellation) → re-thrown unchanged so callers can detect it
//   - Network failure (no connection, DNS error) → throws { status: 0, message: '...' }
//   - Non-JSON response → throws { status, message: 'Unexpected server response' }
//   - Non-2xx JSON response → throws { status, ...body } (body contains message or errors)
async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch (err) {
    // Re-throw AbortError unchanged — it is intentional, not a failure.
    // Callers (e.g. HomePage) check err.name === 'AbortError' to silently ignore it.
    if (err.name === 'AbortError') throw err
    // Any other fetch() throw is a network-level failure.
    throw { status: 0, message: 'Network error — please check your connection' }
  }

  // Guard against HTML error pages, proxy responses, or misconfigured servers
  // returning non-JSON. Even a 200 with text/html is treated as an error.
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw { status: res.status, message: 'Unexpected server response' }
  }

  const data = await res.json()

  // Throw on any non-2xx status so callers always use .catch() for errors.
  if (!res.ok) throw { status: res.status, ...data }

  return data
}

// --- Exported API functions ---

// signal is an AbortSignal from an AbortController, used by HomePage to
// cancel in-flight requests when the query changes or the component unmounts.
export const getStartups = (params, signal) =>
  request(`/startups?${buildQueryString(params)}`, { signal })

export const getStartupById = (id, signal) =>
  request(`/startups/${id}`, { signal })

export const createStartup = (body) =>
  request('/startups', { method: 'POST', body: JSON.stringify(body) })

export const updateStartup = (id, body) =>
  request(`/startups/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteStartup = (id) =>
  request(`/startups/${id}`, { method: 'DELETE' })

export const getDashboardStats = (signal) =>
  request('/dashboard/stats', { signal })
