const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize')

const startupRoutes = require('./routes/startupRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// Trust a reverse proxy only when explicitly configured via TRUST_PROXY.
// Setting this unconditionally would let any client spoof X-Forwarded-For,
// which would break IP-based rate limiting. On Render/Railway set TRUST_PROXY=1.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY))
}

// Security headers (Content-Security-Policy, X-Frame-Options, etc.)
app.use(helmet())

// CORS — only the exact CLIENT_URL origin is allowed, no wildcard.
// Methods are listed explicitly so OPTIONS preflight requests are handled correctly.
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
)

// Parse JSON bodies and reject anything over 10 KB.
// The size limit protects against request flooding.
app.use(express.json({ limit: '10kb' }))

// Strip any key that starts with $ or contains a dot from req.body and req.query.
// This prevents NoSQL injection attacks like { "password": { "$gt": "" } }.
app.use(mongoSanitize())

// Routers are mounted here, exactly once.
// Rate limiters live inside each router (not here) to avoid a circular import:
// app.js would import the routers while the routers would need to import from app.js.
app.use('/api/startups', startupRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404 catch-all — must come after all routers so it only fires for unmatched routes.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Central error handler — must be last. Express knows it is an error handler
// because it has exactly 4 parameters (err, req, res, next).
app.use(errorHandler)

module.exports = app
