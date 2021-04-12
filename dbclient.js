const { Pool } = require('pg')
module.exports = async (argv) => {
  const options = {
    connectionString: argv.databaseurl,
    ssl: {
      rejectUnauthorized: false,
    }
  }
  const client = new Pool(options)
  client.on('error', (error) => console.log(error))
  client.on('connect', () => console.log('connected', argv.databaseurl))
  return client
}
