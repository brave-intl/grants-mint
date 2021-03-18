const { request } = require('./bin/utils')
const { URL } = require('url')
module.exports = {
  getInfo,
  incrementLimit
}

async function getInfo (argv) {
  const parsed = new URL(argv.hostname)
  return request({
    hostname: parsed.hostname,
    port: parsed.port,
    protocol: parsed.protocol,
    path: `/v3/wallet/${argv.custodian}/linking-info`,
    method: 'GET',
    headers: { Authorization: `Bearer ${argv.auth}` },
    body: {
      paymentId: argv.wallet
    }
  }).then(console.log)
}

async function incrementLimit () {}
