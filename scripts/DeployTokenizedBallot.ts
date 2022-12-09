// Use process.argv to pass in initial values at deployment
// process.argv.slice(2);

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

import { TokenizedBallot__factory } from "../typechain-types";


const proposals = ["Big Sis", "Mefjus", "Revaux", "Amoss"]; // :')
const ERC20VotesAddress = "0x9FC2Ec836fDb213A850D685cFaA6276953B2B75b"

function stringArrToBytes(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
        bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
}

async function main () {
    
    const provider = ethers.getDefaultProvider("goerli", process.env.ALCHEMY_API_KEY ?? "");
    const network = await provider.getNetwork();
    const walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY ?? "")
    const signer = walletFromPrivateKey.connect(provider);
    console.log(`Connected to wallet ${signer.address} on provider ${network.name}`);
    const lastBlock = await provider.getBlock("latest");
    const targetBlock = lastBlock.number - 1;
    console.log(`latest block is ${lastBlock.number}, target is ${targetBlock}`);
    
    const tokenizedBallotContractFactory = new TokenizedBallot__factory(signer);
    const tokenizedBallotContract = await tokenizedBallotContractFactory.deploy(
        stringArrToBytes(proposals),
        ERC20VotesAddress,
        targetBlock,
    )
    await tokenizedBallotContract.deployed();
    console.log(`Depployed TokenizedBallot contract at ${tokenizedBallotContract.address}`);
    // deployed at: 0xAf37F6a774D15855B6D9215fC0883abc30CD3AE7
    // tx: 0xaf4e76996dd0f1548c27d010507a309eb715a6b493a9ef8d8f38a0d7f9ba9585
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});