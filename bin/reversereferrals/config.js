module.exports = {
  databaseurl: {
    describe: 'the url of the database to update manually',
    default: process.env.DATABASE_URL
  },
  databaseurllocal: {
    describe: 'the url of the database to update manually',
    default: process.env.LOCAL_DATABASE_URL
  }
}
