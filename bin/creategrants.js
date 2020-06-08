#!/usr/bin/env node
const { argv } = require('yargs')
  .options(require('../config'))
const fs = require('fs')
const mod = require('..')

main().catch(console.error)

const client = {
  query: (query) => {
    fs.appendFileSync('./results.sql', '\n'+query)
  }
}

async function main() {
  // const client = await mod.dbclient(argv)
  const file = await mod.create(argv)
  fs.writeFileSync('./results.json', JSON.stringify(file))
  try {
    await mod.setupClaims(argv, file, client)
    if (argv.legacy) {
      await mod.setupLegacyClaims(argv, file, client)
    }
  } finally {
    // client.release()
  }
}
