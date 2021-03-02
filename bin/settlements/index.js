#!/usr/bin/env node
const { argv } = require('yargs')
  .options(require('./config'))
const utils = require('../utils')
const { settlement } = require('../..')

main().catch(console.error)

async function main() {
  // const creatorsClient = await mod.dbclient(argv)
  // const eyeshadeClient = await mod.dbclient(argv)
  try {
    // const creatorSettlementData = await settlement.gatherCreator(argv, creatorsClient)
    // const settlementData = await settlement.gatherEyeshade(argv, eyeshadeClient, creatorSettlementData)
    const settlementData = await settlement.generateFiles(argv)
    // console.log('settlement data', settlementData)
    utils.saveFile('creator-settlement.json', JSON.stringify(settlementData, null, 2))
  } catch (e) {
    console.log('failed to gather creator settlement info', e)
  } finally {
    // creatorsClient.end()
    // eyeshadeClient.end()
  }
}