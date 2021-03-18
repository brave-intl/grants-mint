const fs = require('fs')
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

async function generateFiles() {
  return JSON.parse(JSON.parse(fs.readFileSync('./creators-settlement-string.json')))
}
