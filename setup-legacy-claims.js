module.exports = async function tolegacysql (argv, file, client) {
  const ids = file.map(({ id }) => id)
  const updatePromotions = `update promotions set remaining_grants = 0
where id = any('{${ids.join(',')}}');
`
  await client.query(updatePromotions)

  const updateClaims = `update claims set legacy_claimed = true
where promotion_id = any('{${ids.join(',')}}');
`
  await client.query(updateClaims)
}
