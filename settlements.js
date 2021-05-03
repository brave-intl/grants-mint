const BigNumber = require('bignumber.js')
const _ = require('lodash')
const { request } = require('./bin/utils')
const uuid = require('uuid')
module.exports = {
  collect: walkThroughSteps
}

const stepOrder = [
  'publishers',
  'antifraud',
  // 'grants',
]

const steps = {
  publishers: collectPublishersData,
  antifraud: completeAntifradTransforms,
  // grants: completeGrantsTransforms
  // eyeshade uploading is last possible step
}

const currencyDecimals = {
  BAT: 18,
  JPY: 2,
  USD: 2
}

const identifierQuery = `SELECT
CONCAT('publishers#uuid:', channels.publisher_id) AS publisher_id,
CASE
     WHEN publishers.selected_wallet_provider_type = 'BitflyerConnection'
          THEN CONCAT('bitflyer#id:', channels.deposit_id)
     WHEN publishers.selected_wallet_provider_type = 'GeminiConnection'
          THEN CONCAT('gemini#id:', channels.deposit_id)
     WHEN publishers.selected_wallet_provider_type = 'UpholdConnection'
          THEN CONCAT('uphold#id:', channels.deposit_id)
     ELSE 'default'
END AS wallet_provider_id,
CASE
     WHEN publishers.selected_wallet_provider_type = 'BitflyerConnection'
          THEN 'bitflyer'
     WHEN publishers.selected_wallet_provider_type = 'GeminiConnection'
          THEN 'gemini'
     WHEN publishers.selected_wallet_provider_type = 'UpholdConnection'
          THEN 'uphold'
END AS provider,
publishers.email as email,
channels.details_type as channel_type,
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
END AS channel_id
FROM publishers
FULL JOIN channels
ON channels.publisher_id = publishers.id
FULL JOIN site_channel_details
ON channels.details_id = site_channel_details.id
FULL JOIN reddit_channel_details
ON channels.details_id = reddit_channel_details.id
FULL JOIN twitter_channel_details
ON channels.details_id = twitter_channel_details.id
FULL JOIN github_channel_details
ON channels.details_id = github_channel_details.id
FULL JOIN vimeo_channel_details
ON channels.details_id = vimeo_channel_details.id
FULL JOIN youtube_channel_details
ON channels.details_id = youtube_channel_details.id
FULL JOIN twitch_channel_details
ON channels.details_id = twitch_channel_details.id
FULL JOIN bitflyer_connections
ON bitflyer_connections.publisher_id = publishers.id
  AND bitflyer_connections.is_verified
FULL JOIN gemini_connections
ON gemini_connections.publisher_id = publishers.id
  AND gemini_connections.is_verified
WHERE publishers.id = ANY($1::UUID[])
ORDER BY publisher_id DESC`

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

async function walkThroughSteps(argv, pool) {
  const identifiers = await getIdentifiers(argv, pool)
  let memo = identifiers
  for (let i = 0; i < stepOrder.length; i += 1) {
    console.log('running step', stepOrder[i])
    memo = await steps[stepOrder[i]](argv, pool, memo)
    if (argv.step === stepOrder[i]) {
      break
    }
  }
  return memo
}

function collectPublishersData(argv, pool, identifiers) {
  return collectBalances(argv, identifiers)
}

function completeAntifradTransforms(argv, pool, identifiers) {
  const settlementId = uuid.v4()
  const now = new Date().toISOString()
  return identifiers.balances.map((balance) => {
    const isPubId = balance.account_id === identifiers.channelToId[balance.account_id]
    const amount = balance.balance
    let bat = amount
    let fees = '0'
    if (!isPubId) {// is contribution
      bat = new BigNumber(bat).times(0.95).toFixed(18)
      fees = new BigNumber(amount).minus(bat)
    }
    const id = identifiers.channelToIdentifiers[balance.account_id]
    const {
      publisher_id,
      deposit_id,
      channel_id,
      channel_type,
      provider,
      wallet_provider_id,
      email
    } = id
    console.log(id)
    return {
      bat,
      fees,
      owner: `publishers#uuid:${identifiers.channelToId[balance.account_id]}`,
      owner_state: 'active',
      channel_type,
      id: uuid.v5(`${publisher_id}:${deposit_id}:${channel_id}`, '7111abf4-0cd1-4e70-88a6-ebc03d5fc68b'),
      email,
      created_at: now,
      inserted_at: now,
      address: deposit_id,
      url: channel_id,
      type: isPubId ? 'referral' : 'contribution',
      payout_report_id: settlementId,
      wallet_country_code: '',
      wallet_provider: '',
      wallet_provider_id
    }
  })
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
  const channelToId = {}
  const channelToIdentifiers = {}
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
    channelToIdentifiers[channelId] = identifiers[i]
    channelToIdentifiers[publisherId] = identifiers[i]
    currencies[currency] = true
    idToCurrency[channelId] = currency
    accountList[accountList.length - 1].push(channelId)
    channelToId[publisherId] = publisherId
    channelToId[channelId] = publisherId
  }
  const rates = await getRates(argv, _.keys(currencies))
  let balances = []
  // for loop for serial exec
  for (let i = 0; i < accountList.length; i += 1) {
    balances = balances.concat(
      await getBalances(argv, accountList[i])
    )
  }
  return {
    balances,
    identifiers,
    channelToIdentifiers,
    accountList,
    currencies,
    rates,
    channelToId,
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
  channelToId,
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
    const owner = channelToId[id]
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
SELECT
  publisher_id AS id
FROM channels
WHERE details_id = ANY(
  SELECT id
  FROM site_channel_details
  WHERE
      brave_publisher_id = ANY($1::text[])
)`
  const getPublishersByEmail = `
SELECT id
FROM publishers
WHERE email = ANY($1::text[])`
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
