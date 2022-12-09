// Use process.argv to pass in initial values at deployment
// process.argv.slice(2);

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { TokenizedBallot__factory, VoteToken__factory } from "../typechain-types";
dotenv.config();

const ERC20VotesAddress = "0x9FC2Ec836fDb213A850D685cFaA6276953B2B75b"
const tokenizedBallotAddress = "0xbAEcf158322F07186Ed42C5a752A29bf62192680";

async function main () {
    
    const provider = ethers.getDefaultProvider("goerli", process.env.ALCHEMY_API_KEY ?? "");
    const network = await provider.getNetwork();
    const walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY ?? "")
    const signer = walletFromPrivateKey.connect(provider);
    console.log(`Connected to wallet ${signer.address} on provider ${network.name}`);

    const voteTokenContractFactory = new VoteToken__factory(signer);
    const voteTokenContract = voteTokenContractFactory.attach(ERC20VotesAddress);

    const ballotContractFactory = new TokenizedBallot__factory(signer);
    const ballotContract = ballotContractFactory.attach(tokenizedBallotAddress);

    const votesBeforeDelegation = await voteTokenContract.getVotes(signer.address);
    if (votesBeforeDelegation.eq(0)) {
        console.log(`Address has no votes.`)
        const delegateTx = await voteTokenContract.delegate(signer.address);
        await delegateTx.wait();
        console.log(`Delegated voting power to self.`)
        // => Delegated voting power to self.
        // => After delegation, address has 10000000000000000 voting power.
    } else {
        console.log(`Address has ${votesBeforeDelegation} votes.`);
    }

    const votesAfterDelegation = await voteTokenContract.getVotes(signer.address);
    console.log(`After delegation, address has ${votesAfterDelegation} votes.`);
    const votingPower = await ballotContract.votingPower(signer.address);
    console.log(`After delegation, address has ${votingPower} voting power.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});