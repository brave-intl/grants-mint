const Papa = require('papaparse')
const { refund: fields } = require('./fields')
module.exports = createRefundClaims

// use legacy true so that browsers auto-claim them
const insertRefunds = `
insert into claims (promotion_id, wallet_id, approximate_value, legacy_claimed)
values ($1, $2, $3, true)
`

async function createRefundClaims({ csvCorrected, promotionId }, refunds, client) {
  await Promise.all(refunds.map(async (datum) => {
    const paymentId = datum[fields.paymentId]
    const amount = datum[fields.amount]
    try {
      await client.query(insertRefunds, [
        promotionId,
        paymentId,
        amount
      ])
    } catch (e) {
      if (e && e.code === '23505') {
        return console.log(`wallet ${paymentId} has already claimed refund promotion`)
      } else {
        throw e
      }
    } finally {
      refund[fields.status] = 'DONE'
    }
  }))
  fs.writeFileSync(csvCorrected, Papa.unparse(refunds))
  console.log('please copy the `.corrected` file back to the spreadsheet')
}
