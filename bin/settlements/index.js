#!/usr/bin/env node
const { argv } = require('yargs')
  .parserConfiguration({
    "camel-case-expansion": true,
  })
  .options(require('./config'))
const utils = require('../utils')
const mod = require('../..')
const { settlements } = require('../..')

main().catch(console.error)

async function main() {
  const creatorsClient = await mod.dbclient(argv)
  try {
    const collected = await settlements.collect(argv, creatorsClient)
    utils.saveFile('creator-settlement.json', collected)
  } catch (e) {
    console.log('failed to gather creator settlement info', e)
  } finally {
    creatorsClient.end()
  }
}
