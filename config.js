const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  auth: {
    default: process.env.AUTH,
    describe: 'the auth key for grants',
    demandOption: true
  },
  hostname: {
    describe: 'the hostname to send the create promotion requests to',
    default: process.env.HOSTNAME
  },
  databaseurl: {
    describe: 'the url of the database to update manually',
    default: process.env.DATABASE_URL
  },
  protocol: {
    default: 'https:',
    describe: 'the http protocol to use to send requests'
  },
  walletIds: {
    alias: 'w',
    default: [],
    type: 'array',
    describe: 'the wallet id to apply to ads grants'
  },
  type: {
    alias: 't',
    demandOption: true,
    describe: 'the type of promotion to create'
  },
  value: {
    default: 2,
    describe: 'the amount of bat to have in a grant'
  },
  bonus: {
    alias: 'b',
    default: 0,
    describe: 'bonus to apply to promotions'
  },
  count: {
    default: 1,
    describe: 'the number of promotions needed for this wallet'
  },
  legacy: {
    default: false,
    describe: 'whether or not the grant will be denoted as legacy'
  },
  environment: {
    alias: 'env',
    default: 'staging',
    describe: 'which environment should the promotion be created on'
  },
  platform: {
    default: 'desktop',
    describe: 'the platform that the grants should be available to'
  }
}
