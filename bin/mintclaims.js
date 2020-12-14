#!/usr/bin/env node
const { argv } = require('yargs')
  .options(require('../config'))
const fs = require('fs')
const mod = require('..')

const environments = {
  'grant.rewards.bravesoftware.com': 'staging',
  'grant.rewards.brave.software': 'dev'
}

main().catch(console.error)

function log(argv) {
  const { type, count, walletIds, platform, hostname } = argv
  const isAds = type === 'ads'
  const total = count * (isAds ? walletIds.length : 1)
  console.log(`
creating ${total} total claims
across ${isAds ? walletIds.length : 'any'} wallets.
${isAds ? count : 1} claims per wallet.
${platform ? `only availabe for ${platform}` : 'available for all platforms'}
on the ${environments[hostname]} environment`)
}

async function main() {
  log(argv)
  console.log('connecting to db')
  const client = await mod.dbclient(argv)
  console.log('creating promotions')
  const files = await mod.create(argv)
  fs.writeFileSync('./results.json', JSON.stringify(files))
  const id = setTimeout(() => {}, 10000)
  try {
    console.log('creating claims')
    const res = await mod.setupClaims(argv, files, client)
    if (argv.legacy) {
      await mod.setupLegacyClaims(argv, files, client)
    }
  } catch (e) {
    console.log('erred', e)
  } finally {
    console.log('finished\n')
    client.end()
    clearTimeout(id)
  }
}
