# Brave Mint

mint promotions and grants

## setup

```
# install dependencies
npm i
# link the bin file
npm link
```

## examples

create a series of ugp grants for ios filled with 30 bat
```bash
creategrants --type=ugp --platform=ios --value=30 --count=100000
```
possible platforms include `ios`, `android`, and `desktop`

create a set of ads grants for 3 specific wallets (1 grant for each)
```bash
creategrants --walletIds=b500b47c-c9bb-4c21-adde-970149c20906 86ce92a0-822c-443d-a68e-faabc76258ec d5402d2b-e6b4-4e75-b95a-28396a1f29a5 --type=ads --platform=desktop --value=5 --count=1
```

After running the `creategrants` script above you will then need to load the results.sql into the database.
Please note that results.sql is constantly appended to from run to run.

```bash
psql "$DATABASE_URL" < results.sql # this will load all generated claims into the grant db
```
