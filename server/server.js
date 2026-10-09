// dotenv must be the very first thing that runs so that every file required
// afterwards (including app.js) already has access to process.env.
require('dotenv').config()

// Fail fast: if a required variable is missing, print a clear message and exit
// before we even try to connect to the database or start Express.
const REQUIRED_ENV = ['MONGODB_URI', 'CLIENT_URL']
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

const connectDB = require('./src/config/db')
const app = require('./src/app')

const PORT = process.env.PORT || 5000

// start() is an async function so we can await the DB connection before
// calling app.listen. Express 4 does not support top-level await, so we
// define and immediately call an async function here.
async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()
