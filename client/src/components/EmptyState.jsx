// Shown when a list returns no results.
// action is optional: { label: string, onClick: fn }
export default function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500">
      {/* Simple inbox icon built from SVG — no icon library needed */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-slate-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 9.75h16.5M3.75 14.25h16.5M9 3.75 3.75 9.75v10.5h16.5V9.75L15 3.75H9z"
        />
      </svg>
      <p className="text-base">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
