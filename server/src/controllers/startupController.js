const Startup = require('../models/Startup')

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const str = (v) => (typeof v === 'string' ? v.trim() : '')

// GET /api/startups
async function getStartups(req, res, next) {
  try {

    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1)
    // limit is clamped between 1 and 50: Math.max prevents 0/negative,
    // Math.min prevents requests for huge result sets.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50)

    const search   = str(req.query.search).slice(0, 100)
    const industry = str(req.query.industry)
    const stage    = str(req.query.stage)

    const filter = {}

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: 'i' }
    }

    if (industry) {
      filter.industry = industry
    }

    if (stage) {
      filter.fundingStage = stage
    }

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
    if (!startup) return res.status(404).json({ message: 'Startup not found' })
    res.json({ data: startup })
  } catch (err) {
    next(err)
  }
}

// POST /api/startups
async function createStartup(req, res, next) {
  try {
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
async function updateStartup(req, res, next) {
  try {
    const {
      name, tagline, description, industry,
      fundingStage, fundingRequired, location, website,
    } = req.body

    const updated = await Startup.findByIdAndUpdate(
      req.params.id,
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
