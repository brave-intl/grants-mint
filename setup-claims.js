module.exports = async function setupClaims (argv, files, client) {
  const { bonus, walletIds, legacy } = argv
  return Promise.all(files.map(async (file) => {
    const insertClaims = `insert into claims (promotion_id, wallet_id, approximate_value, bonus, legacy_claimed)
  values ${walletIds.map(wallet => file.map((promotion) => {
      return `('${promotion.id}', '${wallet}', ${promotion.approximateValue}, ${bonus}, ${legacy})`
    }).join(',')).join(',\n')}`
    return client.query(insertClaims)
  }))
}
