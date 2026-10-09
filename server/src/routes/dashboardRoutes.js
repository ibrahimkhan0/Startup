const express = require('express')
const { readLimiter } = require('../middleware/rateLimiter')
const { getDashboardStats } = require('../controllers/dashboardController')

const router = express.Router()

// GET /api/dashboard/stats
// readLimiter is applied here — dashboard is a read-only, data-heavy endpoint.
router.get('/stats', readLimiter, getDashboardStats)

module.exports = router
