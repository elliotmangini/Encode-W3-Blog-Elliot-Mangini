// We are importing ethers which is built in to hardhat, which gives us
// access to a large number of tools. For example deploying our contracts
// into a virtual environment so we can test them, importing wallets,
// attaching our contracts in various ways, and allowing for integration
// with typescript. Whenever we see "ethers" in a code block, we are doing
// something thanks to the ethers plugin/library => https://docs.ethers.io/v5/
// But we get other things from ethers too! Like the deployed() method.
import { ethers } from "hardhat";

const MINTER_ROLE_CODE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
// Another way to get our role code is like this (inside the main function)
// const MINTER_ROLE_CODE = await tokenContract.MINTER_ROLE();
// However this is *just one more read call* to the blockchain.


// Declaring our test function.
async function main() {
    // Get accounts in a variable.
    const accounts = await ethers.getSigners();
    // Get factory to make contract. !!! reference by contract name not .sol file name !!!
    const tokenContractFactory = await ethers.getContractFactory("MyERC20Token");
    // Tell the factory to deploy a contract and store it as a variable (ethers).
    const tokenContract = await tokenContractFactory.deploy();
    // Check to see if the contract has been deployed and included in the latest block (ethers).
    await tokenContract.deployed();
    console.log(`Contract deployed at ${tokenContract.address}`)
    // => Contract deployed at 0x5FbDB2315678afec8890x032d93F642f64180aa3

    // Using array destructing to make a large number of read-only calls to our contract.
    const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(), // => name: 'MyERC20Token'
        tokenContract.symbol(), // => symbol: 'MTK'
        // Note: decimals describes how we are displaying values, not what the values are.
        tokenContract.decimals(), // => decimals: 18
        tokenContract.totalSupply(), // => totalSupply: BigNumber { value: "0" }
    ]);
    console.log("Before any transactions...");
    console.log({name, symbol, decimals, totalSupply});
    // And print them to console.
    
    
    // This Mint will work because accounts[0] is the msg.sender, therefore has MINTER_ROLE.
    const adminMintTx = await tokenContract
        .connect(accounts[0])
        .mint(accounts[0].address, 999)
    await adminMintTx.wait();

    const mintForTx = await tokenContract
        .connect(accounts[0])
        .transfer(accounts[1].address, 1)
    await mintForTx.wait();

    // Grant the ability to mint to an account.
    const roleTx = await tokenContract.grantRole(MINTER_ROLE_CODE, accounts[2].address);
    await roleTx.wait();

    // Try out that permission!
    const mintTx = await tokenContract
        .connect(accounts[2])
        .mint(accounts[2].address, 5)
    await mintTx.wait();

    // balanceOf() needs an address to check the balance of.
    // How about accounts[0], the account which deploys the contract.
    const myBalance = await tokenContract.balanceOf(accounts[0].address);
    // How about accounts[1] the account which had token minted by a MINTER_ROLE account.
    const mintedForBalance = await tokenContract.balanceOf(accounts[1].address);
    // How about accounts[2], the account which minted tokens for itself.
    const selfMintBalance = await tokenContract.balanceOf(accounts[2].address);

    console.log(`Balance of accounts[0] is ${myBalance} decimal units.`);
    console.log(`Balance of accounts[1] (minted-by-MINTER_ROLE-account) is ${mintedForBalance} decimal units.`);
    console.log(`Balance of accounts[2] (self-mint) is ${selfMintBalance} decimal units.`);
    // And print our balances.
    console.log("After some transactions...");
    const [newSupply] = await Promise.all([
        tokenContract.totalSupply(), // => { newSupply: BigNumber { value: "1004" } }
    ]);
    console.log({newSupply});
    // Now let's show our ecosystem has changed and the blockchain has been altered!
    
    

}


// Calling our tests when we run this script by invoking the declared function.
// Instructing what to do if we get an error (log to console).
main().catch((err) => {
    console.log(err);
})