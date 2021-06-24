// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";
import { BigNumber, Contract, ContractInterface, ethers } from "ethers";
import { writeFileSync } from "fs";
import { resolve } from "path";

import SUSDABI from "../abi/sUSD.json";
import SETHABI from "../abi/sETH.json";

const sUSDLoanPath = resolve(__dirname, "../susd_loan.json");
const sETHLoanPath = resolve(__dirname, "../seth_loan.json");

interface LoanCreatedEvent {
  account: string;
  loanID: number;
  amount: number;
}

interface LoanClosedEvent {
  account: string;
  loanID: number;
  feesPaid: number;
}

interface Loan {
  account: string;
  collateralAmount: string;
  loanAmount: string;
  timeCreated: number;
  loanID: number;
  timeClosed: number;
  accruedInterest: string;
  totalFees: string;
}

interface LoanContract {
  address: string;
  abi: ContractInterface;
  fromBlock: number;
  loanSymbol: string;
}

async function main() {
  const sUSDLoanInfo: LoanContract = {
    address: "0xfED77055B40d63DCf17ab250FFD6948FBFF57B82",
    abi: SUSDABI,
    fromBlock: 10923435,
    loanSymbol: "sUSD"
  };
  const sETHLoanInfo: LoanContract = {
    address: "0x7133afF303539b0A4F60Ab9bd9656598BF49E272",
    abi: SETHABI,
    fromBlock: 10557968,
    loanSymbol: "sETH"
  };

  await saveOpenLoans(sUSDLoanInfo, sUSDLoanPath);
  await saveOpenLoans(sETHLoanInfo, sETHLoanPath);
}

async function saveOpenLoans(lc: LoanContract, outputPath: string) {
  const contract = new Contract(
    lc.address,
    lc.abi,
    hre.ethers.provider
  );
  const filter = contract.filters.LoanCreated();
  const createdLogs = await contract.queryFilter(filter, lc.fromBlock);
  console.log("got", createdLogs.length, "created logs");

  const filter2 = contract.filters.LoanClosed();
  const closedLogs = await contract.queryFilter(filter2, lc.fromBlock);
  console.log("got", closedLogs.length, "closed logs");

  const closedLoanIDs: string[] = [];
  for (const log of closedLogs) {
    const e = log.args as unknown as LoanClosedEvent;
    // console.log("account:", e.account, ", loanID:", e.loanID, ", feesPaid:", e.feesPaid);
    closedLoanIDs.push(e.loanID.toString())
  }

  const loans: Loan[] = [];
  let totalLoanAmount: BigNumber = BigNumber.from(0);
  for (const log of createdLogs) {
    const e = log.args as unknown as LoanCreatedEvent;
    // console.log("account:", e.account, ", loanID:", e.loanID, ", amount:", e.amount);
    if (closedLoanIDs.indexOf(e.loanID.toString()) > -1) {
      // console.log("loanID", e.loanID, "already closed");
      continue;
    }
    const loan = await contract.getLoan(e.account, e.loanID);
    const l: Loan = {
      account: loan.account,
      collateralAmount: ethers.utils.formatEther(loan.collateralAmount),
      loanAmount: ethers.utils.formatEther(loan.loanAmount),
      timeCreated: loan.timeCreated.toNumber(),
      loanID: loan.loanID.toNumber(),
      timeClosed: loan.timeClosed.toNumber(),
      accruedInterest: ethers.utils.formatEther(loan.accruedInterest ? loan.accruedInterest : loan.interest),
      totalFees: ethers.utils.formatEther(loan.totalFees)
    }
    totalLoanAmount = totalLoanAmount.add(BigNumber.from(loan.loanAmount));
    // console.log(l);
    loans.push(l);
  }
  writeFileSync(outputPath, JSON.stringify(loans, null, 2), "utf-8");
  console.log("Total open loan amount:", ethers.utils.formatEther(totalLoanAmount), lc.loanSymbol);
  console.log("😀😀😀😀😀 Save", loans.length, "loans");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    process.exit();
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
