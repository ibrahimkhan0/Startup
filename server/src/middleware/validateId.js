// A 24-character hex string is the canonical ObjectId format.
// We use a regex rather than mongoose.Types.ObjectId.isValid() because
// isValid() also accepts 12-character strings (a legacy Mongoose quirk),
// which would let malformed ids reach the database.
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

function validateId(req, res, next) {
  if (!OBJECT_ID_REGEX.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' })
  }
  next()
}

module.exports = validateId
