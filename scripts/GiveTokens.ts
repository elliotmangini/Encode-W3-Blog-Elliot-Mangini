// Use process.argv to pass in initial values at deployment
// process.argv.slice(2);

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { VoteToken__factory } from "../typechain-types";
dotenv.config();

const MINT_VALUE = ethers.utils.parseEther(".01");
const ERC20VotesAddress = "0x9FC2Ec836fDb213A850D685cFaA6276953B2B75b"

async function main () {
    
    const provider = ethers.getDefaultProvider("goerli", process.env.ALCHEMY_API_KEY ?? "");
    const network = await provider.getNetwork();
    const walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY ?? "")
    const signer = walletFromPrivateKey.connect(provider);
    console.log(`Connected to wallet ${signer.address} on provider ${network.name}`);

    const voteTokenContractFactory = new VoteToken__factory(signer);
    const voteTokenContract = voteTokenContractFactory.attach(ERC20VotesAddress);

    const balanceBeforeMint = await voteTokenContract.balanceOf(signer.address);
    console.log(`Balance of DevelopmentONE before minting is ${balanceBeforeMint}`);
    // => Balance of DevelopmentONE before minting is 0

    const mintTx = await voteTokenContract.mint(signer.address, MINT_VALUE);
    await mintTx.wait();

    const balanceAfterMint = await voteTokenContract.balanceOf(signer.address);
    console.log(`Balance of DevelopmentONE after minting is ${balanceAfterMint}`);
    // => Balance of DevelopmentONE after minting is 10000000000000000
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});