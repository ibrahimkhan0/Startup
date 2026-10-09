const express = require('express')
const { body } = require('express-validator')

const { readLimiter, writeLimiter } = require('../middleware/rateLimiter')
const validate = require('../middleware/validate')
const validateId = require('../middleware/validateId')
const {
  getStartups,
  getStartupById,
  createStartup,
  updateStartup,
  deleteStartup,
} = require('../controllers/startupController')

const Startup = require('../models/Startup')
const { INDUSTRIES, FUNDING_STAGES, MAX_FUNDING } = Startup

const router = express.Router()


// Validator helper — reused for every required text field.
const requiredText = (field, label, { min = 1, max }) =>
  body(field)
    .isString().withMessage(`${label} must be text`).bail()
    .trim()
    .notEmpty().withMessage(`${label} is required`).bail()
    .isLength({ min, max }).withMessage(`${label} must be ${min}–${max} characters`)

// One validator array reused by both POST and PUT.
// PUT is a full replacement, so it requires all 8 fields just like POST.
const startupValidators = [
  requiredText('name', 'Name', { max: 100 }),
  requiredText('tagline', 'Tagline', { max: 150 }),
  requiredText('description', 'Description', { min: 10, max: 2000 }),
  requiredText('location', 'Location', { max: 100 }),

  body('industry')
    .notEmpty().withMessage('Industry is required').bail()
    .isIn(INDUSTRIES).withMessage('Invalid industry'),

  body('fundingStage')
    .notEmpty().withMessage('Funding stage is required').bail()
    .isIn(FUNDING_STAGES).withMessage('Invalid funding stage'),

  body('fundingRequired')
    .notEmpty().withMessage('Funding required is required').bail()
    // isFloat also accepts integers — "float" here just means "numeric"
    .isFloat({ min: 0, max: MAX_FUNDING })
    .withMessage(`Funding required must be a number between 0 and ${MAX_FUNDING.toLocaleString()}`)
    .toFloat(), // converts the string from the JSON body to a JS number

  // website is optional — skip all checks when the value is absent or falsy.
  // When present it must be a valid http/https URL.
  body('website')
    .optional({ values: 'falsy' })
    .isString().withMessage('Website must be text').bail()
    .trim()
    .isLength({ max: 200 }).withMessage('Website cannot exceed 200 characters').bail()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Website must be a valid URL starting with http:// or https://'),
]

router.get('/',       readLimiter, getStartups)
router.get('/:id',    readLimiter, validateId, getStartupById)
router.post('/',      writeLimiter, startupValidators, validate, createStartup)
router.put('/:id',    writeLimiter, validateId, startupValidators, validate, updateStartup)
router.delete('/:id', writeLimiter, validateId, deleteStartup)

module.exports = router
