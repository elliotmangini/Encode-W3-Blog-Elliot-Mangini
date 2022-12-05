import { ethers } from "hardhat";
import { VoteToken__factory } from "../typechain-types/factories/contracts/ERC20Votes.sol/VoteToken__factory";

const MINT_VALUE = ethers.utils.parseEther("6")

async function main() {
    const accounts = await ethers.getSigners();
    // This is the way to get a factory with typechain-types instead of ethers.
    const voteContractFactory = new VoteToken__factory(accounts[0]);
    // Deploy contract
    const voteContract = await voteContractFactory.deploy();
    await voteContract.deployed();

    //Mint tokens to accounts[1], the minter is accounts[0] automatically cause thats the deployer.
    const mintTx = await voteContract.mint(accounts[1].address, MINT_VALUE);
    await mintTx.wait();
    console.log(`Minted ${MINT_VALUE.toString()} decimal units to account ${accounts[1]}.`)

    // Check balance
    const balanceBN = await voteContract.balanceOf(accounts[1].address);
    console.log(`accounts[1] has ${balanceBN} decimal units`)

    // Check voting power
    const votePowerBeforeDelegation = await voteContract.getVotes(accounts[1].address);
    console.log(`voting power of accounts[1] prior to delegation is ${votePowerBeforeDelegation}`);

    // self-delegate
    const delegateTx = await voteContract.connect(accounts[1]).delegate(accounts[1].address);
    await delegateTx.wait();
    const votePowerAfterDelegation = await voteContract.getVotes(accounts[1].address);
    console.log(`voting power of accounts[1] after delegation is ${votePowerAfterDelegation}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})