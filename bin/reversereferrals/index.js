#!/usr/bin/env node
const { argv } = require('yargs')
  .options(require('./config'))
const { reverseReferrals } = require('../..')
const BigNumber = require('bignumber.js')

main().catch(console.log)

async function main() {
  try {
    const reversed = await time(reverseReferrals)(argv)
    console.log(`reversed ${reversed.length} publishers`)
    const total = reversed.reduce(
      (memo, { bat }) => memo.plus(bat), new BigNumber(0),
    )
    console.log(`total of ${total.toString()}BAT`)
  } catch (e) {
    console.log('failed to reverse transactions', e)
    throw e
  }
}

function time(fn) {
  return async function () {
    const start = process.hrtime()
    try {
      const result = await fn.apply(this, arguments)
      return result
    } catch (e) {
      throw e
    } finally {
      console.log(`finished in ${process.hrtime(start)[0]}s`)
    }
  }
}
