const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  'promotion-id': {
    alias: 'p',
    default: '6e85d5fd-be79-43d0-b418-e6db099c1f26',
    type: 'string',
    description: 'use a different promotion id for refunds'
  }
}