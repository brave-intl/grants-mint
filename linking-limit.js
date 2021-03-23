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
    path: `/v3/wallet/linking-info`,
    method: 'GET',
    headers: argv.auth ? { Authorization: `Bearer ${argv.auth}` } : null,
    body: argv.wallet ? {
      paymentId: argv.wallet
    } : {
      custodianId: argv['member-id']
    }
  }).then((res) => {
    console.log(JSON.stringify(res, null, 2))
  })
}

async function incrementLimit () {}
