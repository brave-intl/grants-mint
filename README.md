# Brave Mint

mint promotions and grants

## setup

install dependencies
```bash
npm install
```

link the bin file
```bash
npm link
```

Copy the `.env.example` file to `.env`. Insert your credentials (`staging` / `dev` only) that you get from the ledger team.

source the `.env` file
```bash
source .env
```

check that a param is set
```bash
echo $HOSTNAME
echo $DATABASE_URL
echo $AUTH
```

If the values match what you put into your `.env` file, then run some of the examples below.

It seems that sudo may be required to execute these commands.

## examples

Create a series of ugp grants for ios filled with 30 bat. To create more than 1 ugp grant to claim for a single wallet, the command must be run multiple times.
```bash
sudo creategrants
  --type=ugp \
  --platform=ios \
  --value=30 \
  --count=100000
```
Possible platforms include `ios`, `android`, and `desktop`

Create a set of ads grants for 3 specific wallets (1 claim for each). Wallet IDs are space delineated
```bash
sudo creategrants \
  --walletIds=b500b47c-c9bb-4c21-adde-970149c20906 \
    86ce92a0-822c-443d-a68e-faabc76258ec \
    d5402d2b-e6b4-4e75-b95a-28396a1f29a5 \
  --type=ads \
  --platform=desktop \
  --value=5 \
  --count=1
```

For each wallet ID, create 3 ads grants
```bash
sudo creategrants \
  --walletIds=1de21066-f54c-4f36-91ec-5009fad8801e \
    e540f2c0-20de-4213-939e-91a2cfb7b61a \
  --type=ads \
  --platform=ios \
  --value=5 \
  --count=3
```

an example of successful run

```bash
$ sudo mintclaims \
  --walletIds=1de21066-f54c-4f36-91ec-5009fad8801e \
    e540f2c0-20de-4213-939e-91a2cfb7b61a \
  --type=ads \
  --platform=ios \
  --value=5 \
  --count=5

creating 10 total claims
across 2 wallets.
5 claims per wallet.
only availabe for ios
on the dev environment
connecting to db
creating promotions
creating claims
finished
```
