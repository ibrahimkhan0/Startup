const mongoose = require('mongoose')

// These arrays are defined here and exported so the validators in
// startupRoutes.js and the seed script can import the same values.
// This means the enums are defined in one place only — changing them
// here automatically updates both the schema and the validators.
const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'SaaS',
  'Consumer',
  'Deep Tech',
  'Climate Tech',
  'Other',
]

const FUNDING_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+']

// 1 trillion USD — a practical upper bound that prevents absurd values
// while still covering any realistic funding round.
const MAX_FUNDING = 1_000_000_000_000

const startupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,      // removes leading/trailing whitespace before saving
      minlength: 1,
      maxlength: 100,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,   // forces at least a sentence, not just "ok"
      maxlength: 2000,
    },
    industry: {
      type: String,
      required: true,
      enum: INDUSTRIES, // Mongoose rejects any value not in this array
    },
    fundingStage: {
      type: String,
      required: true,
      enum: FUNDING_STAGES,
    },
    fundingRequired: {
      type: Number,
      required: true,
      min: 0,
      max: MAX_FUNDING,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '', // optional field — stored as empty string rather than null
    },
  },
  {
    // timestamps: true tells Mongoose to automatically manage
    // createdAt and updatedAt fields on every document.
    timestamps: true,
  }
)

// Compound index on the two most common filter fields.
// A compound index covers queries that filter by industry only,
// by both industry + fundingStage, but NOT by fundingStage alone
// (the order matters — put the higher-cardinality field first).
// We do NOT add a text index on name because we use a regex search instead,
// which doesn't require a special index and works fine at this scale.
startupSchema.index({ industry: 1, fundingStage: 1 })

const Startup = mongoose.model('Startup', startupSchema)

// Export the model as the default export, then attach the constants
// as properties so callers can do:
//   const Startup = require('../models/Startup')
//   const { INDUSTRIES } = require('../models/Startup')
// Both work from the same require() call.
Startup.INDUSTRIES = INDUSTRIES
Startup.FUNDING_STAGES = FUNDING_STAGES
Startup.MAX_FUNDING = MAX_FUNDING

module.exports = Startup
