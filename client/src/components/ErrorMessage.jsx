// Displays an error message in a styled red box.
// Used both inline (inside pages) and as a full-page fallback.
export default function ErrorMessage({ message }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </div>
  )
}
