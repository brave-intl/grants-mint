#!/usr/bin/env node
const { argv } = require('yargs')
  .options(require('./config'))
const utils = require('../utils')
const mod = require('../..')

main().catch(console.error)

async function main() {
  argv.csvCorrected = `${argv.csv}.corrected`
  console.log('connecting to db')
  const client = await mod.dbclient(argv)
  console.log('extracting csv')
  const files = await mod.extractRefunds(argv, client)
  utils.saveFile('./refunds.json', JSON.stringify(files))
  prompt.start()
  const { confirmed } = await prompt.get({
    confirmed: {
      type: 'boolean',
      description: 'Confirm the `.corrected` file is correct'
    }
  })
  if (!confirmed) {
    return console.log('told that the corrected file does not have correct values. exiting')
  }
  const id = setTimeout(() => {}, 10000)
  try {
    console.log('creating refund claims')
    await mod.createRefundClaims(argv, files, client)
  } catch (e) {
    console.log('erred', e)
  } finally {
    console.log('finished\n')
    client.end()
    clearTimeout(id)
  }
}
