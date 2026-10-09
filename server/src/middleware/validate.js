const { validationResult } = require('express-validator')

// Reads the validation results that express-validator attached to req,
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    })
  }
  next()
}

module.exports = validate
