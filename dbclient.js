const { Pool } = require('pg')
module.exports = async (argv) => {
  const options = {
    connectionString: argv.databaseurl,
    ssl: true,
  }
  console.log(options)
  const pool = new Pool(options)
  const client = await pool.connect()
  console.log('connected')
  return client
}
