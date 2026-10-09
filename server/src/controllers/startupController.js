const Startup = require('../models/Startup')

// Escapes special regex characters in a string so user input can be used
// safely inside a MongoDB $regex query without accidentally being interpreted
// as a regex operator. For example: "C++" becomes "C\+\+" which matches the
// literal string rather than treating + as a regex quantifier.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Helper: returns the trimmed string if the value is a string, otherwise ''.
// Protects against non-string query params (e.g. ?search[]=a which Express
// parses as an array) without throwing.
const str = (v) => (typeof v === 'string' ? v.trim() : '')

// GET /api/startups
// Supports: ?search=, ?industry=, ?stage=, ?page=, ?limit=
async function getStartups(req, res, next) {
  try {
    // --- Pagination ---
    // parseInt with radix 10 avoids octal parsing. || 1 handles NaN (non-numeric
    // strings). Math.max clamps negative page values to 1.
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1)
    // limit is clamped between 1 and 50: Math.max prevents 0/negative,
    // Math.min prevents requests for huge result sets.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50)

    // --- Filter params ---
    // Cap search at 100 chars to prevent extremely long regex strings.
    const search   = str(req.query.search).slice(0, 100)
    const industry = str(req.query.industry)
    const stage    = str(req.query.stage)

    // --- Build MongoDB filter ---
    // Only add a field to the filter object when the user actually provided a value.
    // An empty filter {} matches every document (no filter applied).
    const filter = {}

    if (search) {
      // $options: 'i' makes the match case-insensitive.
      // escapeRegex prevents user input from injecting regex operators.
      filter.name = { $regex: escapeRegex(search), $options: 'i' }
    }

    if (industry) {
      filter.industry = industry
    }

    if (stage) {
      filter.fundingStage = stage
    }

    // --- Query ---
    // countDocuments and find both use the same filter, so total reflects the
    // filtered count, not the total collection size.
    const total    = await Startup.countDocuments(filter)
    const startups = await Startup.find(filter)
      .sort({ createdAt: -1 })         // newest first
      .skip((page - 1) * limit)        // skip documents from previous pages
      .limit(limit)                    // take only one page worth

    res.json({
      data: startups,
      pagination: {
        page,
        limit,
        total,
        // Math.ceil ensures the last partial page still gets a page number.
        // e.g. 11 items with limit 10 → 2 pages, not 1.
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/startups/:id
// :id has already been validated as a 24-char hex string by validateId middleware.
async function getStartupById(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.id)
    // findById returns null when no document matches — this is a normal 404,
    // not an error, so we handle it directly rather than throwing.
    if (!startup) return res.status(404).json({ message: 'Startup not found' })
    res.json({ data: startup })
  } catch (err) {
    next(err)
  }
}

// POST /api/startups
// Body has already been validated by startupValidators + validate middleware.
async function createStartup(req, res, next) {
  try {
    // Destructure only the 8 allowed fields — never pass req.body directly to
    // Mongoose. This prevents mass assignment (e.g. a client sending _id or
    // createdAt to overwrite those fields).
    const {
      name, tagline, description, industry,
      fundingStage, fundingRequired, location, website,
    } = req.body

    const startup = await Startup.create({
      name,
      tagline,
      description,
      industry,
      fundingStage,
      fundingRequired,
      location,
      website: website || '', // normalise absent/falsy website to empty string
    })

    // 201 Created — signals that a new resource was created, not just fetched.
    res.status(201).json({ data: startup })
  } catch (err) {
    next(err)
  }
}

// PUT /api/startups/:id — full replacement update
// The client must send all 8 editable fields (same validation as POST).
async function updateStartup(req, res, next) {
  try {
    const {
      name, tagline, description, industry,
      fundingStage, fundingRequired, location, website,
    } = req.body

    const updated = await Startup.findByIdAndUpdate(
      req.params.id,
      // $set: replaces only the listed fields, leaving _id and timestamps alone.
      // Listing each field explicitly (instead of { $set: req.body }) means
      // extra keys sent by the client are silently ignored.
      {
        $set: {
          name,
          tagline,
          description,
          industry,
          fundingStage,
          fundingRequired,
          location,
          website: website || '',
        },
      },
      {
        new: true,           // return the updated document, not the original
        runValidators: true, // re-run schema validators on the new values
      }
    )

    if (!updated) return res.status(404).json({ message: 'Startup not found' })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/startups/:id
async function deleteStartup(req, res, next) {
  try {
    const deleted = await Startup.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Startup not found' })
    res.json({ message: 'Startup deleted successfully' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getStartups,
  getStartupById,
  createStartup,
  updateStartup,
  deleteStartup,
}
