# Synthetix Trial Loan

This tool gets the open loans info from synthetix trial loan of sUSD and sETH.

## How to use

Init repo:
```shell
yarn
```

Run local hardhat network with mainnet forking:

```shell
npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/<your_key>
```

Run get-openloans.ts script to save open loans:

```shell
# npx hardhat run --network localhost scripts/get-openloans.ts

got 319 created logs
got 301 closed logs
Total open loan amount: 262617.264012545475282129 sUSD
😀😀😀😀😀 Save 18 loans
got 121 created logs
got 111 closed logs
Total open loan amount: 59.2 sETH
😀😀😀😀😀 Save 10 loans
```

Check susd_loan.json and seth_loan.json for open loan details.

Good luck.

