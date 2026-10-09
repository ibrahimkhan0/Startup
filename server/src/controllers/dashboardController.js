const Startup = require('../models/Startup')

// GET /api/dashboard/stats
async function getDashboardStats(req, res, next) {
  try {
    // All four queries are independent — none depends on the result of another.
    // Running them in parallel with Promise.all means we wait only for the
    // slowest one, rather than waiting for all four in sequence.
    const [totalStartups, byIndustry, byStage, funding] = await Promise.all([

      // 1. Total count of all startup documents.
      Startup.countDocuments(),

      // 2. Group by industry, sorted so the most popular appears first.
      //    Each result item looks like: { _id: 'Technology', count: 8 }
      Startup.aggregate([
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 3. Same pattern, grouped by funding stage.
      Startup.aggregate([
        { $group: { _id: '$fundingStage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 4. Sum and average of fundingRequired across all documents.
      //    _id: null groups every document into one bucket.
      //    Returns an array with one element, or an empty array when the
      //    collection is empty — handled below with optional chaining.
      Startup.aggregate([
        {
          $group: {
            _id: null,
            totalFundingRequired: { $sum: '$fundingRequired' },
            averageFundingRequired: { $avg: '$fundingRequired' },
          },
        },
      ]),

    ])

    res.json({
      data: {
        totalStartups,
        byIndustry,
        byStage,
        // funding is [] when the collection is empty, so funding[0] is undefined.
        // The ?. and ?? 0 guards ensure we return 0 instead of undefined/NaN.
        totalFundingRequired: funding[0]?.totalFundingRequired ?? 0,
        // Math.round removes fractional cents — the dashboard shows a whole number.
        averageFundingRequired: Math.round(funding[0]?.averageFundingRequired ?? 0),
      },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getDashboardStats }
