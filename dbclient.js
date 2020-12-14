const { Pool } = require('pg')
module.exports = async (argv) => {
  const options = {
    connectionString: argv.databaseurl,
    ssl: false,
  }
  const pool = new Pool(options)
  pool.on('error', (error) => console.log(error))
  return pool
}
