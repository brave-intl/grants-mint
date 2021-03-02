const Papa = require('papaparse')
const uuid = require('uuid')
const idNamespace = '7111abf4-0cd1-4e70-88a6-ebc03d5fc68b'
module.exports = {
  // gatherCreator,
  // gatherEyeshade,
  generateFiles
}

// async function gatherCreator({ emails }, client) {
//   if (emails.length == 0) {
//     // get all
//   } else {
//     const { rows } = await client.query(`

// publisher_id = (select id from publishers where email = any($1::text[]))
//     `, [emails])
//   }
// }

async function generateFiles({ id: _settlementId }) {
  const csv = `publisher_id,email,deposit_id,channel_identifier,total,amount,fees`
  const settlementId = _settlementId || uuid.v4()
  const now = new Date()
  const result = Papa.parse(csv, { header: true })
  return result.data.map(({
    publisher_id: publisherId,
    // email,
    deposit_id: depositId,
    channel_identifier: channelId,
    // total,
    amount,
    fees
  }) => ({
    "address": depositId,
    "bat": amount,
    "channel_type": channelId.includes('twitter') ? "TwitterChannelDetails" : (channelId.includes('youtube') ? "YoutubeChannelDetails" : ("WebsiteChannelDetails")),
    "created_at": now.toISOString(),
    "fees": fees,
    "id": uuid.v5(`${publisherId}:${depositId}:${channelId}`, idNamespace),
    "inserted_at": now.toISOString(),
    "owner": `publishers#uuid:${publisherId}`,
    "owner_state": "active",
    "payout_report_id": settlementId,
    "publisher": channelId,
    "type": "contribution",
    "url": channelId,
    "wallet_country_code": "JP",
    "wallet_provider": "3",
    "wallet_provider_id": `bitflyer#id:${depositId}`
  }))
}
