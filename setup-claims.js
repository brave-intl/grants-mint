module.exports = async function createClaims (argv, file, client) {
  const { bonus, walletIds, legacy } = argv
  const insertClaims = `insert into claims (promotion_id, wallet_id, approximate_value, bonus, legacy_claimed)
values
${walletIds.map(wallet => file.map((promotion) => {
    return `('${promotion.id}', '${wallet}', ${promotion.approximateValue}, ${bonus}, ${legacy})`
  }).join(',')).join(',\n')};
`
  console.log(walletIds, file)
  await client.query(insertClaims)
}
