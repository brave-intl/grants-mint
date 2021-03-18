#!/usr/bin/env node
const { argv } = require('yargs')
  .options(require('./config'))
const { linkingLimit } = require('../..')

main().catch(console.error)

async function main() {
  try {
    await linkingLimit.getInfo(argv)
  } catch (e) {
    console.log('failed to complete linking operation', e)
  }
}