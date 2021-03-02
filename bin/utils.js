const path = require('path')
const fs = require('fs')
module.exports = {
  saveFile
}

function saveFile(name, data) {
  const prefix = '../results'
  const filepath = path.join(__dirname, prefix, name)
  fs.mkdirSync(path.join(__dirname, prefix), { recursive: true })
  console.log('writing to', filepath, data.length)
  fs.writeFileSync(filepath, data)
}