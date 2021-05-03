module.exports = async function setupClaims (argv, files, client) {
  const { bonus, walletIds, legacy } = argv
  return Promise.all(files.map(async (promotion) => {
    const values = walletIds.map(wallet => {
      return `('${promotion.id}', '${wallet}', ${promotion.approximateValue}, ${bonus}, ${legacy})`
    }).join(',\n')
    const insertClaims = `insert into claims (promotion_id, wallet_id, approximate_value, bonus, legacy_claimed)
values ${values}`
console.log(insertClaims)
    return client.query(insertClaims)
  }))
}
