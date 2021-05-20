# Support Tools

general tooling to help support get things done

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

if you previously downloaded using the `mint-claims` repo please run the following commands to sync with the new repo

```
git remote -v
git remote remove origin
git remote add origin git@github.com:brave-intl/support-tools.git
git branch --set-upstream-to=origin/master master
```

## Mint Claims examples

Create a series of ugp grants for ios filled with 30 bat. To create more than 1 ugp grant to claim for a single wallet, the command must be run multiple times.
```bash
sudo mintclaims
  --type=ugp \
  --platform=ios \
  --value=30 \
  --count=100000
```
Possible platforms include `ios`, `android`, and `desktop`

Create a set of ads grants for 3 specific wallets (1 claim for each). Wallet IDs are space delineated
```bash
sudo mintclaims \
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
sudo mintclaims \
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

## Wallet linking info

check the wallet linking info on your environment's wallets with a couple of quick commands

if you have their brave wallet id, accessable at `brave://rewards-internals`
```bash
walletlinks --wallet 15823452-6a03-46f0-80e4-c7c3d21d87c7
```

if you have the member id (not stored on brave's servers) from a transaction for another reason

```bash
walletlinks --member-id ca762426-4c6f-46f7-a487-728a66803015
```

## Settlement

create objects to upload as settlements to eyeshade. files will be generated to results/creator-settlement.json

```bash
settlements --channels brave.com
```

if you have publisher ids

```bash
settlements --publisher-ids 3cdd2edc-b613-48a9-b3bb-d6e087344687 \
  f1e15b41-ab2d-4ba3-b7a4-88aadc59a2af
```

or emails

```bash
settlements --emails mmclaughlin+user@brave.com
```

only get the balances for each id and publisher

```bash
settlements --steps creators \
  --publisher-ids 3cdd2edc-b613-48a9-b3bb-d6e087344687 f1e15b41-ab2d-4ba3-b7a4-88aadc59a2af
```

### Bitflyer settlements

See [Bitflyer Settlements](<Bitflyer_Settlements.md>)
