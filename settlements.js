const BigNumber = require('bignumber.js')
const _ = require('lodash')
const { request } = require('./bin/utils')
const uuid = require('uuid')
module.exports = {
  collect
}
const currencyDecimals = {
  BAT: 18,
  JPY: 2,
  USD: 2
}

const identifierQuery = `select
CONCAT('publishers#uuid:', channels.publisher_id) as publisher_id,
publishers.default_currency as currency,
CASE
     WHEN channels.details_type = 'RedditChannelDetails'
          THEN CONCAT('reddit#channel:', reddit_channel_details.reddit_channel_id)
     WHEN channels.details_type = 'GithubChannelDetails'
          THEN CONCAT('github#channel:', github_channel_details.github_channel_id)
     WHEN channels.details_type = 'YoutubeChannelDetails'
          THEN CONCAT('youtube#channel:', youtube_channel_details.youtube_channel_id)
     WHEN channels.details_type = 'VimeoChannelDetails'
          THEN CONCAT('vimeo#channel:', vimeo_channel_details.vimeo_channel_id)
     WHEN channels.details_type = 'TwitchChannelDetails'
          THEN CONCAT('twitch#author:', twitch_channel_details.twitch_channel_id)
     WHEN channels.details_type = 'TwitterChannelDetails'
          THEN CONCAT('twitter#channel:', twitter_channel_details.twitter_channel_id)
     ELSE site_channel_details.brave_publisher_id
END as channel_id
from channels
full join site_channel_details
on channels.details_id = site_channel_details.id
full join reddit_channel_details
on channels.details_id = reddit_channel_details.id
full join twitter_channel_details
on channels.details_id = twitter_channel_details.id
full join github_channel_details
on channels.details_id = github_channel_details.id
full join vimeo_channel_details
on channels.details_id = vimeo_channel_details.id
full join youtube_channel_details
on channels.details_id = youtube_channel_details.id
full join twitch_channel_details
on channels.details_id = twitch_channel_details.id
full join publishers
on channels.publisher_id = publishers.id
where channels.publisher_id = any($1::uuid[])
order by publisher_id desc`

async function getIdentifiers(argv, pool) {
  const client = await pool.connect()
  let identifiers
  try {
    const publisherIds = await getPublisherIds(argv, client)
    ;({
      rows: identifiers
    } = await client.query(identifierQuery, [publisherIds]))
    return identifiers
  } catch (e) {
    throw e
  } finally {
    await client.release()
  }
}

async function collect(argv, pool) {
  const identifiers = await getIdentifiers(argv, pool)
  const bundle = await collectBalances(argv, identifiers)
  if (!argv.steps.includes('payout')) {
    return bundle.balances
  }
  const settlements = createSettlementObjects(
    argv,
    bundle
  )
  console.log('make sure to check the output file before uploading to eyeshade')
  return settlements
}

async function collectBalances(argv, identifiers) {
  const accountList = [] // [][]publisher_id,channel_id...
  const currencies = {}
  const idToCurrency = {}
  for (let i = 0; i < identifiers.length; i += 1) {
    let {
      publisher_id: publisherId,
      channel_id: channelId,
      currency
    } = identifiers[i]
    currency = currency || 'BAT'
    if (!accountList.length || accountList[accountList.length - 1][0] !== publisherId) {
      accountList.push([publisherId])
      idToCurrency[publisherId] = currency
    }
    currencies[currency] = true
    idToCurrency[channelId] = currency
    accountList[accountList.length - 1].push(channelId)
  }
  const rates = await getRates(argv, _.keys(currencies))
  let bals = []
  // for loop for serial exec
  for (let i = 0; i < accountList.length; i += 1) {
    bals = bals.concat(
      await getBalances(argv, accountList[i], rates, identifiers)
    )
  }
  return {
    balances: bals,
    identifiers,
    accountList,
    currencies,
    rates,
    idToCurrency
  }
}

function getRates(argv, currencies) {
  const {
    ratiosHostname: hostname = 'ratios.rewards.bravesoftware.com',
    protocol = 'https:',
    ratiosProtocol = protocol,
    ratiosAuth: auth = 'foobarfoobar'
  } = argv
  return request({
    hostname,
    protocol: ratiosProtocol,
    path: `/v1/relative/BAT`,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + auth
    },
    body: {
      currency: currencies
    }
  })
}

function createSettlementObjects(argv, {
  balances,
  idToCurrency,
  rates: {
    lastUpdated: now,
    payload: rates
  }
}) {
  const transactionId = uuid.v4()
  return balances.reduce((memo, {
    account_type: type,
    account_id: id,
    balance
  }) => {
    const bal = new BigNumber(balance)
    if (bal.isEqualTo(0)) {
      return memo
    }
    let payout = bal
    let fees = new BigNumber(0)
    let txType = 'referral'
    if (type === 'channel') {
      txType = 'contribution'
      payout = bal.times('0.95')
      fees = bal.minus(payout)
    }
    const owner = balances[0].id
    const currency = idToCurrency[id]
    const rate = rates[currency]
    const amount = new BigNumber(rate).times(payout)
    return memo.concat({
      executedAt: now,
      owner,
      publisher: id,
      address: argv.address,
      altcurrency: 'BAT',
      probi: payout.times(1e18).toFixed(0),
      fees: fees.times(1e18).toFixed(0),
      fee: '0',
      commission: '0',
      amount: amount.toFixed(currencyDecimals[currency] || 18),
      currency,
      transactionId,
      type: txType,
      hash: `manual-${uuid.v4()}`
    })
  }, [])
}

function getBalances(argv, accounts) {
  const {
    eyeshadeAuth: auth,
    eyeshadeHostname: hostname,
    protocol = 'https:',
    eyeshadeProtocol = protocol
  } = argv
  return request({
    hostname,
    protocol: eyeshadeProtocol,
    path: `/v1/accounts/balances`,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + auth
    },
    body: {
      account: accounts
    }
  })
}

async function getPublisherIds(argv, client) {
  let { publisherIds } = argv
  if (publisherIds.length) {
    return publisherIds
  }
  const {
    query,
    args
  } = getPublisherIdQuery(argv)
  const {
    rows: results
  } = await client.query(query, args)
  return results.map(({ id }) => id)
}

function getPublisherIdQuery(argv) {
  let channelInfoQuery = `
select
  publisher_id as id
from channels
where details_id = any(
  select id
  from site_channel_details
  where
      brave_publisher_id = any($1::text[])
)`
  const getPublishersByEmail = `
select id
from publishers
where email = any($1::text[])`
  if (argv.emails.length) {
    return {
      query: getPublishersByEmail,
      args: [argv.emails.map((email) => email.trim())]
    }
  } else if (argv.channels.length) {
    if (argv.verified) {
      channelInfoQuery += '\nand verified'
    }
    return {
      query: channelInfoQuery,
      args: [argv.channels.map((channel) => channel.trim())]
    }
  }
}
