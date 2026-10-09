// Central error handler — must be the last app.use() in app.js.
// Express recognises it as an error handler because it has 4 parameters (err, req, res, next).
function errorHandler(err, req, res, next) {
  // Log the full error internally so we can debug, but never send the stack to the client.
  console.error(err.stack || err)

  // Malformed JSON body — Express's body parser throws this when the JSON is invalid.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' })
  }

  // Body too large — thrown when the payload exceeds the 10kb limit set in app.js.
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' })
  }

  // Mongoose CastError — happens when findById receives a value that cannot be
  // cast to ObjectId (e.g. a string that slipped past validateId).
  // kind === 'ObjectId' narrows it to id-casting failures only.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid ID format' })
  }

  // Mongoose ValidationError — schema-level constraint violations (e.g. a value
  // outside an enum that somehow bypassed express-validator).
  // We return the same { errors: [{ field, message }] } shape as validate.js
  // so the client has one consistent format to handle.
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(422).json({
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    })
  }

  // Everything else — use statusCode if the error set one, otherwise 500.
  // In production we hide the real message to avoid leaking internals.
  const status = err.statusCode || err.status || 500
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Something went wrong'
      : err.message

  res.status(status).json({ message })
}

module.exports = errorHandler
