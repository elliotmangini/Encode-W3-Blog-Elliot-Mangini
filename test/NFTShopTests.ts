import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  MyERC20Token,
  MyERC20Token__factory,
  MyERC721Token,
  MyERC721Token__factory,
  TokenSale,
  TokenSale__factory,
} from "../typechain-types";

const TEST_RATIO = 1;


describe("NFT Shop", async () => {
 let accounts: SignerWithAddress[];
 let tokenSaleContract: TokenSale;
 let paymentTokenContract: MyERC20Token;
 let ballotTokenContract: MyERC721Token;
 let erc20ContractFactory: MyERC20Token__factory;
 let erc721ContractFactory: MyERC721Token__factory;
 let tokenSaleContractFactory: TokenSale__factory;



  beforeEach(async () => {
    [
      accounts,
      erc20ContractFactory,
      erc721ContractFactory,
      tokenSaleContractFactory,
    ] = await Promise.all([
      ethers.getSigners(),
      ethers.getContractFactory("MyERC20Token"),
      ethers.getContractFactory("MyERC721Token"),
      ethers.getContractFactory("TokenSale"),
    ]);
    paymentTokenContract = await erc20ContractFactory.deploy();
    await paymentTokenContract.deployed();

    ballotTokenContract = await erc721ContractFactory.deploy();
    await ballotTokenContract.deployed();

    tokenSaleContract = await tokenSaleContractFactory.deploy(
      TEST_RATIO, 
      paymentTokenContract.address);
    await tokenSaleContract.deployed();
      const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
      const roleTX = await paymentTokenContract.grantRole(MINTER_ROLE, paymentTokenContract.address);
    await roleTX.wait();
  });




  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(TEST_RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      const paymentAddress = await tokenSaleContract.paymentToken();
      const paymentContract = erc20ContractFactory.attach(paymentAddress)
      await expect(paymentContract.balanceOf(accounts[0].address)).not.to.be.reverted;
      await expect(paymentContract.totalSupply()).not.to.be.reverted;


    });
  });

  describe("When a user purchase an ERC20 from the Token contract", async () => {
    beforeEach(async () => {
      // passing overrides to buyTokens, in this case a value.
      const buyValue = ethers.utils.parseEther("1");
      const tx = await tokenSaleContract
        .connect(accounts[1])
        .buyTokens({ value: buyValue });
      await tx.wait();
    });

    it("charges the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("gives the correct amount of tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When a user burns an ERC20 at the Shop contract", async () => {
    it("gives the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("burns the correct amount of tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When a user purchase a NFT from the Shop contract", async () => {
    it("charges the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
    
    it("gives the correct nft", async () => {
      throw new Error("Not implemented");
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