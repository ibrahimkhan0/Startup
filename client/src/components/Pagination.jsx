// Page number controls for the startup list.
// Renders nothing when totalPages <= 1 (nothing to paginate).
//
// Props:
//   page         — currently active page number (1-indexed)
//   totalPages   — total number of pages
//   onPageChange — called with the new page number when a button is clicked
export default function Pagination({ page, totalPages, onPageChange }) {
  // Don't render at all when there's only one page or no pages.
  if (totalPages <= 1) return null

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-6"
      aria-label="Pagination"
    >
      {/* Previous button */}
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {/* Page number buttons */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            p === page
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Next button */}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  )
}
