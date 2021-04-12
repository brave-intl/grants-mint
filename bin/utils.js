const path = require('path')
const querystring = require('querystring')
const http = require('http')
const https = require('https')
const fs = require('fs')
const _ = require('lodash')
module.exports = {
  request,
  saveFile
}

function saveFile(name, data) {
  if (_.isObject(data)) {
    data = JSON.stringify(data, null, 2)
  }
  const prefix = '../results'
  const filepath = path.join(__dirname, prefix, name)
  fs.mkdirSync(path.join(__dirname, prefix), { recursive: true })
  console.log('writing to', filepath, data.length)
  fs.writeFileSync(filepath, data)
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
    const { method, protocol } = opts
    const methodIsGet = method.toLowerCase() === 'get'
    if (payload && methodIsGet) {
      opts.path = `${opts.path}?${querystring.stringify(payload)}`
      delete opts.body
    }
    const req = (protocol === 'https:' ? https : http).request(opts, (res) => {
      res.setEncoding('utf8')
      const chunks = []
      res.on('data', (chunk) => {
        chunks.push(chunk)
      })
      res.on('end', () => {
        const body = chunks.join('')
        const { statusCode } = res
        try {
          if (statusCode < 200 || statusCode >= 400) {
            failure(new Error(`request failed`), statusCode, null, body)
          } else {
            const json = JSON.parse(body)
            resolve(json)
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
