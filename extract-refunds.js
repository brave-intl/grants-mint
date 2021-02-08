const { refund: fields } = require('./fields')
const Papa = require('papaparse')
const boom = require('@hapi/boom')
module.exports = extractRefunds

async function extractRefunds ({ csv, csvCorrected }, client) {
  const { data, errors } = Papa.parse(csv, {
    // dynamicTyping: true,
    header: true,
  })
  if (errors.length) {
    throw errors
  }
  const moreErrors = data.filter((datum) => {
    return datum[fields.status] !== 'DONE'
  }).reduce((memo, datum) => {
    datum[fields.paymentId] = datum[fields.paymentId].trim()
    if (!datum[fields.paymentId]) {
      memo.push(boom.badData('payment id not included', {
        data: datum
      }))
    }
    datum[fields.amount] = datum[fields.amount].trim()
    if (!datum[fields.amount]) {
      memo.push(boom.badData('amount not included', {
        data: datum
      }))
    }
    return memo
  }, [])
  if (moreErrors.length) {
    throw moreErrors
  }
  return Promise.all(data.map(async (datum) => {
    if (!datum.PaymentID.slice(0, 2) === '0x') {
      // backfill using client
      const getByPublicKey = 'select id from wallets where public_key = $1'
      const { rows } = await client.query(getByPublicKey, [datum[fields.paymentId]])
      datum[fields.paymentId] = rows[0].id
    }
    return datum
  })).then((extracted) => {
    fs.writeFileSync(csvCorrected, Papa.unparse(extracted))
    return extracted
  })
}
