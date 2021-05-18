# Payouts for Creators and Ads

If you need to pay out individual creators, you can follow along with this document to get a general idea on how to do that.

The steps we're going to follow:

- Use emails of the creators to generate a tipping settlement file
- Create a tipping payout
  - `bat-go` to generate a signed settlement file
  - `bat-go` to take that signed file and submit a payout to BitFlyer
- Create an adrewards payout
  - Modify the settlement file we got from `support-tools` (the ads payout data comes from Antifraud, not creators/eyeshade)
  - `bat-go` to generate a signed settlement file
  - `bat-go` to take that signed file and submit a payout to BitFlyer
- Inform eyeshade of all of the completed payouts with BitFlyer

## Generate a tipping settlement

In order to generate a tipping settlement, you'll want to run [this ruby script](getcre) in the staging console. Make sure to fill in the emails for the creators you need to pay out. Then copy/paste.

This script should generate a settlement file that you can feed right into `bat-go`. This file mimics the structure of the files Antifraud produces that get fed into `bat-go`. We bypass Antifraud with this step since it is difficult to run an Antifraud test.

[getcre]: https://github.com/brave-intl/support-tools/blob/master/get-publishers.rb#L7

## Create a tipping payout

We'll be using `bat-go` for this section, make sure that you have good values in the `.env` and `config.yaml` files. Get them from a teammate.

Note that tipping vs adrewards payout data is only specified for Bitflyer. No other provider gets this differentiation.

### Generate a signed settlement file

Take the file generated in the previous step and create a signed settlement file:

```shell
go run ./main.go vault sign-settlement --in creator-settlement.json --providers bitflyer
```

This should generate a new file `bitflyer-default-creator-settlement-signed.json`

This file can be used to submit a payout to BitFlyer.

### Payout BitFlyer

To perform the payout, you run:

```shell
go run ./main.go settlement bitflyer upload  --bitflyer-source-from tipping --input bitflyer-default-creator-settlement-signed.json
```

Or, if you want to dryrun beforehand:

```shell
go run ./main.go settlement bitflyer upload --bitflyer-dryrun --bitflyer-source-from tipping --input bitflyer-default-creator-settlement-signed.json
```

This will generate 2 files: `bitflyer-settlement-complete.json` for payouts that were successful and `bitflyer-settlement-not-submitted.json` for ones which weren't.

For reference, `bitflyer-settlement-complete.json` should look something like:

```javascript
[
  {
    altcurrency: "BAT",
    authority: "",
    amount: "1438.14681698",
    commission: "0",
    currency: "BAT",
    address: "1f234fhas-test-another-test-asd239er3",
    owner: "publishers#uuid:some-uuid-you-see",
    fees: "7270885104210526315",
    probi: "138146816980000000000",
    hash: "",
    walletProvider: "bitflyer",
    walletProviderId: "some-wallet-provider-uuid",
    publisher: "twitter#channel:4324234324234",
    signedTx: "",
    status: "",
    transactionId: "some-transaction-uuid",
    fee: "0",
    type: "contribution",
    validUntil: "0001-01-01T00:00:00Z",
    note: "",
  },
  {
    altcurrency: "BAT",
    authority: "",
    amount: "740.38456995",
    commission: "0",
    currency: "BAT",
    address: "some-deposit-id",
    owner: "publishers#uuid:some-creator-uuid",
    fees: "3704451050000000000",
    probi: "70384569950000000000",
    hash: "",
    walletProvider: "bitflyer",
    walletProviderId: "some-wallet-provider-uuid",
    publisher: "vatimes.com",
    signedTx: "",
    status: "",
    transactionId: "some-transaction-uuid",
    fee: "0",
    type: "contribution",
    validUntil: "0001-01-01T00:00:00Z",
    note: "",
  },
]
```

A `bitflyer-settlement-not-submitted.json` file might look like:

```javascript
[
  {
    altcurrency: "BAT",
    authority: "",
    amount: "14.25",
    commission: "0",
    currency: "BAT",
    address: "some-deposit-id",
    owner: "publishers#uuid:some-creator-uuid",
    fees: "750000000000000000",
    probi: "14250000000000000000",
    hash: "some hash",
    walletProvider: "bitflyer",
    walletProviderId: "some-wallet-provider-uuid",
    publisher: "twitter#channel:324234234234",
    signedTx: "",
    status: "not-submitted",
    transactionId: "some-transaction-uuid",
    fee: "0",
    type: "contribution",
    validUntil: "0001-01-01T00:00:00Z",
    note: "MONTHLY_SEND_LIMIT: not-submitted",
  },
]
```

The error message will be in the note.

## Create an adrewards payout

This section is much like the one above, we just have to modify the `bitflyer-default-creator-settlement-signed.json` file to contain manual ad payout data, or manually create one.

We'll also need the `deposit_id` for each of the Wallet Payment IDs. To get that you'll need READ ONLY access to the grants database, and then can issue a query such as

```sql
SELECT * FROM wallets where id = any('{wallet1,wallet2}');
```

You'll want the `user_deposit_destination` field. You can then modify the signed file with the deposit_id -- it should go in the address field. You'll also want to modify these fields with the relevant information:

- `amount` -- how much BAT you want to send
- `probi` -- Should match the amount field for BAT, just the int version
- `transactionId` -- need a fresh UUID for this for all the elements being submitted in this settlement
- `owner` -- For which creator is this?

To perform the payout, you run:

```shell
go run ./main.go settlement bitflyer upload  --bitflyer-source-from adrewards --input bitflyer-default-creator-settlement-signed.json
```

Notice the new `--bitflyer-source-from adrewards`.

## Inform Eyeshade

We now need to tell eyeshade that we have paid out via BitFlyer. We use the [upload-settlements](upload-settlements) tool for that.

Note that you will need to create a directory and put the `bitflyer-settlement-complete.json` file in it.
What you pass on the commandline for the `--file` option is the DIRECTORY where that file lives.

```shell
node index.js --file settlement/2021-05-05/ --url "https://eyeshade.bsg.bravesoftware.com" --auth "$(kubectl --context bsg-sandbox -n eyeshade-staging get secrets/env -j json | jq -r '.data.ALLOWED_PUBLISHERS_TOKENS' | base64 -d)"
```

The result of running this command should be 2 additional files in the directory you passed into `--file`

- rejected-bitflyer-settlement-complete.json
- filtered-bitflyer-settlement-complete.json

which should tell you which results were uploaded to eyeshade.

[upload-settlements]: https://github.com/brave-intl/upload-settlements
