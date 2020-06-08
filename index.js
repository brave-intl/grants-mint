const create = require('./create')
const setupClaims = require('./setup-claims')
const setupLegacyClaims = require('./setup-legacy-claims')
const dbclient = require('./dbclient')

module.exports = {
  create,
  setupClaims,
  setupLegacyClaims,
  dbclient,
}
