import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  MyERC20Token,
  MyERC20Token__factory,
  MyERC721Token,
  MyERC721Token__factory,
  TokenSale,
  TokenSale__factory,
} from "../typechain-types";

// Here we establish an exchange rate of our token to ETH for our store.
// We need to use a decimal instead of a fraction to avoid underflow.
const TEST_RATIO = .001;
// This means you spend 1 ETH you get 1,000 of my new token.
// Set a number of ERC20 tokens to spend to get a vote.
const VOTE_NFT_PRICE = ethers.utils.parseEther("100")


describe("NFT Shop", async () => {
  // We want to let our variables here so we can reuse them, get the most
  // out of our beforeEach hooks, and manage scope well.
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20Token;
  let ballotTokenContract: MyERC721Token;
  let erc20ContractFactory: MyERC20Token__factory;
  let erc721ContractFactory: MyERC721Token__factory;
  let tokenSaleContractFactory: TokenSale__factory;
  // This is the only one worth describing, ethers library is gonna help us
  // out by giving us a set of accounts optimized for testing. Of note,
  // accounts[0] is usually gonna be the deploying account or chairperson.
  let accounts: SignerWithAddress[];
  // In each case we say what the name of it is and describe its type.



  beforeEach(async () => {
    // Now let's fill up all those slots with relevant information by deploying
    // our contracts using ethers library, and asking them "what they are".
    [
      accounts,
      erc20ContractFactory,
      erc721ContractFactory,
      tokenSaleContractFactory,
    ] = await Promise.all([
      // This is cool-- we ask ethers to do a lot of work at once, it's more than
      // syntactic sugar, it's running and waiting in parallel instead of series.
      ethers.getSigners(),
      ethers.getContractFactory("MyERC20Token"),
      ethers.getContractFactory("MyERC721Token"),
      ethers.getContractFactory("TokenSale"),
    ]);

    // With our factories in variables, we use them to put each contracts in a variable.
    paymentTokenContract = await erc20ContractFactory.deploy();
    await paymentTokenContract.deployed() as MyERC20Token;

    ballotTokenContract = await erc721ContractFactory.deploy() as MyERC721Token;
    // Sometimes we add "as <type>" to help typescript surver accurately assign types.
    await ballotTokenContract.deployed();
    // The simple ones are out of the way, the storefront contract needs a little help.

    // Here, we set TokenSale.sol to use our above ratio in its constructor declarations
    // and establish over there what one must pay in ETH/wei to get our ERC20 tokens.
    // In the same way we establish at deployment how many ERC20 tokens it cost for a voteNFT.
    // We do this by attaching our ERC20 contract to our token sale contract via an interface.
    // That way our store front (TokenSale) can make external calls to mint ERC20 tokens.
    // And in the same way we need the shop to have power to make external calls to our contract
    // for minting vote tokens too.
    tokenSaleContract = await tokenSaleContractFactory.deploy(
      TEST_RATIO,
      VOTE_NFT_PRICE,
      paymentTokenContract.address,
      ballotTokenContract.address,
    ) as TokenSale; // again the pattern here is to explicitly state what the name of
    // this contract we are deploying is, we call it by its name, not its .sol file.
    await tokenSaleContract.deployed();

    // Here we are doing our first transaction. Transaction in smart contract land means
    // anytime we send a message to call a function or use an interface of a contract
    // living on the blockchain. In this case we call a function grantRole() to make it
    // so that tokenSale contract is able to mint our new ERC20 token. grantRole() expects
    // bytecode for any number of grantable roles, and an address to give that role.
    // First we ask the ERC20 contract for the bytecode of the MINTER_ROLE. Fun Fact:
    // the bytecode of MINTER_ROLE is the same cross-contract. It's the bytes of the string.
    // We give mint access to the shop for ballot tokens the same way w/ the same code.
    const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
    // THEN WE PUT IT ON THE GRILL.
    const paymentTokenRoleTX = await paymentTokenContract.grantRole(
      // THEN WE PUT THE MOZZERELLA STICKS IN THE FRIER...
      MINTER_ROLE,
      tokenSaleContract.address
    );
    await paymentTokenRoleTX.wait();
    // ...THEN WE SERVE IT TO THE CUSTOMER.
    const voteTokenRoleTX = await ballotTokenContract.grantRole(
      // AND THE RESUUULT..?
      MINTER_ROLE,
      tokenSaleContract.address
      // OMG
    );
    // CAN'T FORGET THE BEV.
    await voteTokenRoleTX.wait();
    // NEVA NEVA.

    // Now that the TokenSale contract has been given a minter role, it is allowed to mint
    // tokens using an interface we put in it and make them belong to whoever sent it a message.
  });




  describe("When the Shop contract is deployed", async () => {

    it("defines the ratio as provided in parameters", async () => {
      // If we "ask" the contract what it's ratio is | ratio() | is it the
      // ratio we told it to set up when we deployed it? | .to.eq.() |
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(TEST_RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      // What is the address of the smart contract which mints our ERC20 tokens
      // according to the smart contract that acts as a "store front" for them?
      const addressOfTokenMintingContract = await tokenSaleContract.paymentToken();

      // attach() is a little confusing to me-- but this is reusing our deployed instance of
      // the ERC20 minting contract, and its doing it "in the right place at the right time".
      const paymentContractInstance = erc20ContractFactory.attach(addressOfTokenMintingContract)

      // Now that we are indeed targeting our minting smart contract... These are
      // different ways of saying "are you a contract that mints valid ERC20 tokens?"
      // because if we can call balanceOf or totalSupply on you, we know you're ERC20.
      await expect(paymentContractInstance.balanceOf(accounts[0].address)).not.to.be.reverted;
      await expect(paymentContractInstance.totalSupply()).not.to.be.reverted;
    });
  });

  describe("When a user purchase an ERC20 from the Token contract", async () => {

    // We need to convert a string that describes a number of ETH to spend to a
    // bigNumber of wei. As a review wei is 1 quintillionth of an ETH. You can
    // think of wei like pennies relate to a dollar, but much much smaller.
    // ether.utils.parseEther does exactly this string => bigNumber conversion.
    const buyValue = ethers.utils.parseEther("1");

    // Give a place to store our starting ETH balance across multiple tests.
    let ethBalanceBefore: BigNumber;
    // Setup so we can measure and compare against gas we spent on a transaction.
    let gasCost: BigNumber;

    beforeEach(async () => {
      // Inside this describe block we are testing things that happen when an account
      // purchases our ERC20. So we set the stage for each test with a clean slate,
      // we first measure the account balance to test against, and then buy tokens.
      // Remember though, that this beforeEach hook is one level deeper than the first
      // we defined. So when we getBalance() we are querying our ERC20 contract for
      // that balance because accounts[1] is still attached to that contract.
      // Here we assign the account balance in the correctly scoped variable above.
      ethBalanceBefore = await accounts[1].getBalance();

      // Here we say okay-- accounts[1], please send a message to our store front
      // and try to buy 1 ETH worth of our ERC20 token for each of the tests in this
      // describe block.
      const buyTX = await tokenSaleContract
        // connect() is a way of us saying that every subsequent invocation we chain on
        // it will be called as though the account were the msg.sender interacting with
        // whatever contract we are connected to. In this case the store front.
        .connect(accounts[1])
        // Overrides: Something built into ethers library, a set of ways to configure
        // a transaction. We can configure lots of things like the maximum gas usage
        // we are willing to accept "going through". Or in this case the ETH spent.
        .buyTokens({ value: buyValue });
        // This is of note only because buyTokens is not expecting an argument, we are
        // giving it an argument anyway through an override.
      const txReceipt = await buyTX.wait();
      // Simple arithmetic converting gas unit cost of tx to what that gas cost, because
      // remember, gas prices fluctuate.
      const gasUsed = txReceipt.gasUsed;
      const pricePerGas = txReceipt.effectiveGasPrice;
      gasCost = gasUsed.mul(pricePerGas);
      // Store it in the correctly scoped place for later use.
    });

    it("charges the correct amount of ETH", async () => {

      // // The incorrect way:
      // // Get the balance after we buy- compare to before- and see if the difference
      // // is equal to the amount we just bought.
      // const ethBalanceAfter = await accounts[1].getBalance();

      // const expectedDifference = buyValue;
      // const actualDifference = ethBalanceBefore.sub(ethBalanceAfter);

      // expect(actualDifference).to.eq(expectedDifference);
      // // !!! This doesn't work though, because as we know transactions also cost gas !!!


      // The correct way:
      const ethBalanceAfter = await accounts[1].getBalance();
      // (account for gas costs)
      const expectedDifference = buyValue.add(gasCost);

      const actualDifference = ethBalanceBefore.sub(ethBalanceAfter);
      expect(actualDifference).to.eq(expectedDifference);
      // Now it should pass.
    });

    it("gives the correct amount of ERC20 tokens", async () => {
      // Easy one, we always ask the contract that mints a token... when we want
      // to know how many of that token someone has.
      const accountOneBalance = paymentTokenContract.balanceOf(accounts[1].address);
      const expectedBalace = buyValue.div(TEST_RATIO);
      expect(accountOneBalance).to.eq(expectedBalace);
    });

    
    
    describe("When a user burns an ERC20 at the Shop contract", async () => {
      beforeEach(async () => {
        // The user gives ALL the tokens they just bought back to the shop.
        const expectedBalance = buyValue.div(TEST_RATIO)
        // First we tell ERC20 mint contract that the shop has permission to
        // burn an amount of our tokens.
        const allowTX = paymentTokenContract
          .connect(accounts[1])
          .approve(tokenSaleContract.address, expectedBalance);
        await (await allowTX).wait();
        // Then we tell the shop we're ready to return our tokens.
        const burnTX = await tokenSaleContract
          .connect(accounts[1])
          .returnTokens(expectedBalance);
        await burnTX.wait();
      });

      it("gives the correct amount of ETH", async () => {
        throw new Error("Not implemented");
      });
  
      it("burns the correct amount of tokens", async () => {
        const balanceAfterBurn = await paymentTokenContract.balanceOf(accounts[1].address);
        expect(balanceAfterBurn).to.equal(0);
      });
    });
  
    describe("When a user purchase a NFT from the Shop contract", async () => {
      beforeEach(async () => {
        // First we tell ERC721 mint contract that the shop has permission to
        // use enough ERC20 tokens to get an ERC721 token.
        const allowTX = ballotTokenContract
          .connect(accounts[1])
          .approve(tokenSaleContract.address, VOTE_NFT_PRICE);
        await (await allowTX).wait();
        // Then we tell the shop we're ready to return our tokens.
        const mintBallotTokenTX = await tokenSaleContract
          .connect(accounts[1])
          .buyVoteNFT(0);
        await mintBallotTokenTX.wait();
      });


      it("charges the correct amount of ERC20 tokens", async () => {
        throw new Error("Not implemented");
      });
      
      it("gives the correct nft", async () => {
        const ballotOwner = await ballotTokenContract.ownerOf(0);
        expect(ballotOwner).to.eq(accounts[1].address);
      });
  
      it("updates the owner pool account correctly", async () => {
        throw new Error("Not implemented");
      });
  
      it("update the public pool account correctly", async () => {
        throw new Error("Not implemented");
      });
  
      it("favors the public pool with the rounding", async () => {
        throw new Error("Not implemented");
      });
    });

  });

  describe("When a user burns their NFT at the Shop contract", async () => {
    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
    it("updates the public pool correctly", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When the owner withdraw from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner pool account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});