const _ = require('lodash')
const { request } = require('./bin/utils')

module.exports = async function create(argv) {
  const { auth, count, hostname, protocol, value, type, platform, walletIds } = argv
  const shards = 4
  const limit = value * shards === parseInt(value * shards) ? value : ((parseInt(value * shards) + 1) / shards)
  const options = {
    hostname,
    protocol,
    path: `/v1/promotions`,
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + auth
    },
    body: {
      type,
      numGrants: type === 'ugp' ? count : walletIds.length,
      value: limit,
      platform,
      active: true,
    }
  }
  if (type === 'ugp') {
    return request(options).then((res) => ([res]))
  } else {
    return Promise.all(Array(count).fill().map(() => {
      return request(options)
    }))
  }
}
