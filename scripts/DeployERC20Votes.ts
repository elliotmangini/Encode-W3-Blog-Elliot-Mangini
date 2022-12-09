import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { VoteToken__factory } from "../typechain-types";
dotenv.config();

async function main () {
    const provider = ethers.getDefaultProvider("goerli", process.env.ALCHEMY_API_KEY ?? "");
    const network = await provider.getNetwork();
    const walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY ?? "")
    const signer = walletFromPrivateKey.connect(provider);
    console.log(`Connected to wallet ${signer.address} on provider ${network.name}`);
    // signer: 0xcD0d9d2Cf018c30de55bd075f4F481EC76261b3C on goerli

    const voteTokenContractFactory = new VoteToken__factory(signer);
    const voteTokenContract = await voteTokenContractFactory.deploy();
    await voteTokenContract.deployed();
    console.log(`VoteToken Contract successfully deployed at ${voteTokenContract.address}`)
    // deployed at: 0x9FC2Ec836fDb213A850D685cFaA6276953B2B75b
    // tx: 0x5f7dee9afa2c02c934094267cf71d964e5b6a2574765ae7da9f192e74dc72189
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });