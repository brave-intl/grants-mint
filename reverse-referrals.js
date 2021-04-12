const fromAccounts = `select distinct(from_account) as id
from transactions where to_account = 'referral-deprecation-account'
`
const getBalanceAtTime = `SELECT
account_transactions.account_type as account_type,
account_transactions.account_id as account_id,
COALESCE(SUM(account_transactions.amount), 0.0) as balance
FROM account_transactions
WHERE account_id = $1
and account_transactions.created_at <= '2021-04-06'
GROUP BY (
  account_transactions.account_id,
  account_transactions.account_type
)`

const insertReverseTx = `insert into transactions(
  id, created_at, description, transaction_type, from_account_type, from_account, to_account_type, to_account, amount
)
values (
  uuid_generate_v4(), '2021-04-06', 'Transaction to cancel referrals finalizing past 90 days after 2021-01-23 for legacy referrals but not go below zero.',
  'manual', 'internal', 'referral-deprecation-account', 'owner', $1, $2
)
returning *`

const dbclient = require('./dbclient')
const BigNumber = require('bignumber.js')
const uuid = require('uuid')

module.exports = main

async function main(argv) {
  const pool = await dbclient(argv)
  try {
    const result = await refund(pool)
    return result
  } catch (e) {
    throw e
  } finally {
    await pool.end()
  }
}

async function refund(pool) {
  const client = await pool.connect()
  try {
    console.log('trying to check accounts')
    const {
      rows: publishers
    } = await client.query(fromAccounts) // get all accounts who had bad referrals
    console.log(`${publishers.length} publishers`)
    const reversed = []
    for (let i = 0; i < publishers.length; i += 1) { // for each account
      const { id } = publishers[i]
      const {
        rows: balances
      } = await client.query(getBalanceAtTime, [id]) // get the balance as of 2021-04-06
      const balance = new BigNumber(balances[0].balance)
      if (!balance.isNegative()) { // if it is not negative then skip
        continue
      }

      const bat = balance.negated().toFixed(18)
      let inserted
      ;({
        rows: inserted
      } = await client.query(insertReverseTx, [id, bat])) // else insert a reversed transaction
      console.log(`reversed ${id} via ${inserted ? inserted[0].id : uuid.v4()} to the tune of ${bat}BAT`)
      reversed.push({ id, bat })
    }
    return reversed
  } catch (e) {
    throw e
  } finally {
    await client.release()
  }
}
