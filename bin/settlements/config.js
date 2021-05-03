const uuid = require('uuid')
module.exports = {
  emails: {
    default: [],
    type: 'array',
    describe: 'publisher emails to settle'
  },
  channels: {
    default: [],
    type: 'array',
    describe: 'publisher channels to settle'
  },
  databaseurl: {
    describe: 'the url of the database to get creator info from',
    default: process.env.DATABASE_URL
  },
  'publisher-ids': {
    default: [],
    type: 'array',
    describe: 'a series of publisher ids to settle'
  },
  'eyeshade-hostname': {
    default: process.env.EYESHADE_HOSTNAME,
    type: 'string',
    describe: 'the hostname of eyeshade to be used to compute payout amounts'
  },
  'eyeshade-auth': {
    default: process.env.EYESHADE_AUTH,
    type: 'string',
    describe: 'the auth key of eyeshade to be used to compute payout amounts'
  },
  'eyeshade-protocol': {
    default: process.env.EYESHADE_PROTOCOL,
    type: 'string',
    describe: 'the protocol eyeshade is being communicated over'
  },
  'ratios-hostname': {
    default: process.env.RATIOS_HOSTNAME,
    type: 'string',
    describe: 'the hostname of ratios to be used to get rates'
  },
  'ratios-auth': {
    default: process.env.RATIOS_AUTH,
    type: 'string',
    describe: 'the auth of ratios to be used to get rates'
  },
  'ratios-protocol': {
    default: process.env.RATIOS_PROTOCOL,
    type: 'string',
    describe: 'the protocol ratios is being communicated over'
  },
  step: {
    default: 'grants',
    type: 'array',
    describe: 'the steps to form the desired object'
  },
  address: {
    default: '0x0',
    type: 'string',
    describe: 'the address where the stated amount is paid out'
  },
  verified: {
    default: true,
    type: 'boolean',
    describe: 'check whether or not the channel is verified'
  },
  id: {
    describe: 'settlement id',
    default: uuid.v4(),
    type: 'string'
  }
}