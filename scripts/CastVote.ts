// Use process.argv to pass in initial values at deployment
// process.argv.slice(2);

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { TokenizedBallot__factory, VoteToken__factory } from "../typechain-types";
dotenv.config();

const tokenizedBallotAddress = "0xbAEcf158322F07186Ed42C5a752A29bf62192680";
const proposalToVoteFor = 0;
const votesToCast = 1;

async function main () {
    
    const provider = ethers.getDefaultProvider("goerli", process.env.ALCHEMY_API_KEY ?? "");
    const network = await provider.getNetwork();
    const walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY ?? "")
    const signer = walletFromPrivateKey.connect(provider);
    console.log(`Connected to wallet ${signer.address} on provider ${network.name}`);

    const ballotContractFactory = new TokenizedBallot__factory(signer);
    const ballotContract = ballotContractFactory.attach(tokenizedBallotAddress);

    const votingPower = await ballotContract.votingPower(signer.address);
    if (votingPower.eq(0)) {
        console.log(`Address has no voting power.`)
    } else {
        console.log(`Address has voting power.`);
    }

    const voteTx = await ballotContract.vote(proposalToVoteFor, votesToCast);
    await voteTx.wait();
    console.log(`Casting votes for Big Sis.`);
    const votesOnProposal = (await ballotContract.proposals(proposalToVoteFor)).voteCount;
    console.log(`Big Sis has ${votesOnProposal} votes :]`);
}

// => Address has voting power.
// => Casting votes for Big Sis.
// => Big Sis has 1 votes :]

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});