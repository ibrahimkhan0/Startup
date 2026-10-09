const mongoose = require('mongoose')

// connectDB is called once at startup in server.js.
// If the connection fails we exit the process — there is no point running
// the API without a database, and a clean exit is easier to diagnose than
// a server that starts but crashes on every request.
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
