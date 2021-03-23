module.exports = {
  wallet: {
    type: 'string',
    // demandOption: true,
    describe: 'wallet id to run functions agains'
  },
  auth: {
    default: process.env.AUTH,
    describe: 'the auth key for grants',
    // demandOption: true
  },
  hostname: {
    describe: 'the hostname to send the create promotion requests to',
    demandOption: true,
    default: process.env.HOSTNAME
  },
  'member-id': {
    type: 'string',
    default: '',
    describe: 'the id linked to the custodian account'
  }
}
