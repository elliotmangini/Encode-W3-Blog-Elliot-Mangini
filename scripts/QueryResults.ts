// Use process.argv to pass in initial values at deployment
// process.argv.slice(2);

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { TokenizedBallot__factory, VoteToken__factory } from "../typechain-types";
dotenv.config();

const tokenizedBallotAddress = "0xbAEcf158322F07186Ed42C5a752A29bf62192680";

async function main () {
    
    const provider = ethers.getDefaultProvider("goerli", process.env.ALCHEMY_API_KEY ?? "");
    const network = await provider.getNetwork();
    const walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY ?? "")
    const signer = walletFromPrivateKey.connect(provider);
    console.log(`Connected to wallet ${signer.address} on provider ${network.name}`);
    const ballotContractFactory = new TokenizedBallot__factory(signer);
    const ballotContract = ballotContractFactory.attach(tokenizedBallotAddress);



    const votesOn0 = (await ballotContract.proposals(0)).voteCount;
    const votesOn1 = (await ballotContract.proposals(1)).voteCount;
    const votesOn2 = (await ballotContract.proposals(2)).voteCount;
    const votesOn3 = (await ballotContract.proposals(3)).voteCount;
    console.log(`Big Sis has ${votesOn0} votes :]`);
    console.log(`Mefjus has ${votesOn1} votes :]`);
    console.log(`Revaux has ${votesOn2} votes :]`);
    console.log(`Amoss has ${votesOn3} votes :]`);
}

// => Big Sis has 1 votes :]
// => Mefjus has 0 votes :]
// => Revaux has 0 votes :]
// => Amoss has 0 votes :]

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});