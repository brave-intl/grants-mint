module.exports = async function tolegacysql (argv, files, client) {
  return Promise.all(files.map(async (file) => {
    const ids = file.map(({ id }) => id)
    const idList = ids.join(',')
    const updatePromotions = `update promotions set remaining_grants = 0
  where id = any('{${idList}}');
  `
    await client.query(updatePromotions)

    const updateClaims = `update claims set legacy_claimed = true
  where promotion_id = any('{${idList}}')
  `
    return client.query(updateClaims)
  }))
}
