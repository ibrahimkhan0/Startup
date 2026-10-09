// Temporary placeholder controllers — replaced in Task 5.
// Every route in startupRoutes.js needs a real function to call now,
// otherwise requiring the router would throw a ReferenceError.
// Returning 501 makes it obvious in testing that a route isn't implemented yet.

async function getStartups(req, res, next) {
  try {
    res.status(501).json({ message: 'Not implemented yet' })
  } catch (err) {
    next(err)
  }
}

async function getStartupById(req, res, next) {
  try {
    res.status(501).json({ message: 'Not implemented yet' })
  } catch (err) {
    next(err)
  }
}

async function createStartup(req, res, next) {
  try {
    res.status(501).json({ message: 'Not implemented yet' })
  } catch (err) {
    next(err)
  }
}

async function updateStartup(req, res, next) {
  try {
    res.status(501).json({ message: 'Not implemented yet' })
  } catch (err) {
    next(err)
  }
}

async function deleteStartup(req, res, next) {
  try {
    res.status(501).json({ message: 'Not implemented yet' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getStartups, getStartupById, createStartup, updateStartup, deleteStartup }
