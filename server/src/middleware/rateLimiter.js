const rateLimit = require('express-rate-limit')

// A shared handler so both limiters return the same JSON shape.
// express-rate-limit's default response is plain text — we override it
// so the client always gets { message: '...' } just like every other error.
const handler = (req, res) =>
  res.status(429).json({ message: 'Too many requests, please try again later' })

// Used on every GET route (reads are cheap, allow more).
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,  // sends RateLimit-* headers (RFC 6585)
  legacyHeaders: false,   // suppresses the older X-RateLimit-* headers
  handler,
})

// Used on POST, PUT, DELETE (writes hit the DB harder, be stricter).
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

module.exports = { readLimiter, writeLimiter }
