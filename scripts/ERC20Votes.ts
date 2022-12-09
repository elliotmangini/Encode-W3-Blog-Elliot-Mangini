import { ethers } from "hardhat";
// import { contracts } from "../typechain-types";
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
    console.log(`Minted ${MINT_VALUE.toString()} decimal units to account 1: ${accounts[1].address}.`)

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
    console.log(`voting power of accounts[1] after self-delegation is ${votePowerAfterDelegation}`);

    // Transfer tokens out
    console.log(`transfering ${MINT_VALUE.div(3)} tokens from accounts[1] to accounts[2]`);
    const transferTx = await voteContract.connect(accounts[1]).transfer(accounts[2].address, MINT_VALUE.div(3))
    await transferTx.wait();
    const votePower2AfterTransfer = await voteContract.getVotes(accounts[2].address);
    console.log(`voting power of accounts[2] after receiving votes is ${votePower2AfterTransfer}`);
    const votePower1AfterTransfer = await voteContract.getVotes(accounts[1].address);
    console.log(`voting power of accounts[1] after giving away votes is ${votePower1AfterTransfer}`);

    // self-delegate
    const delegate2Tx = await voteContract.connect(accounts[2]).delegate(accounts[2].address);
    await delegate2Tx.wait();
    const votePower2AfterDelegation = await voteContract.getVotes(accounts[2].address);
    console.log(`voting power of accounts[2] after self-delegation is ${votePower2AfterDelegation}`);

    // Check past voting power
    const lastBlock = await ethers.provider.getBlock("latest");
    console.log(`Current block number is ${lastBlock.number}`);
    const pastVotes = await voteContract.getPastVotes(accounts[1].address, lastBlock.number - 1);
    console.log(`Account 1: ${accounts[1].address} has ${pastVotes.toString()} units of voting power from the previous block.`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})

// TO DO
// checking vote power and querying results (we do in the ballot)