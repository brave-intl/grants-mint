const _ = require('lodash')
const https = require('https')

module.exports = async function create(argv) {
  const { auth, count, hostname, protocol, value, type, platform, walletIds } = argv
  let total = []
  const options = {
    hostname,
    protocol,
    path: '/v1/promotions',
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + auth
    },
    body: {
      type,
      numGrants: type === 'ugp' ? count : (walletIds.length * count),
      value,
      platform,
      active: true,
    }
  }
  const result = await request(options)
  return result
}

async function request (options) {
  return new Promise((resolve, reject) => {
    const {
      headers,
      body: payload
    } = options
    const opts = Object.assign({
      protocol: 'https:',
      method: 'GET',
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, headers)
    }, options)
    const { method } = opts
    const methodIsGet = method.toLowerCase() === 'get'
    const req = https.request(options, (res) => {
      res.setEncoding('utf8')
      const chunks = []
      res.on('data', (chunk) => {
        chunks.push(chunk)
      })
      res.on('end', () => {
        const body = chunks.join('')
        const { statusCode } = res
        try {
          const json = JSON.parse(body)
          if (statusCode < 200 || statusCode >= 400) {
            failure(new Error(`request failed`), statusCode, json, body)
          } else {
            resolve([json])
          }
        } catch (e) {
          failure(e, statusCode, null, body)
        }
      })
    })
    req.on('error', (e) => failure(e))
    if (payload && !methodIsGet) {
      const data = _.isObject(payload) ? JSON.stringify(payload) : payload
      req.write(data)
    }
    req.end()

    function failure (err, statusCode, json, body) {
      reject(Object.assign(err, {
        statusCode,
        opts,
        body,
        payload,
        json
      }))
    }
  })
}
