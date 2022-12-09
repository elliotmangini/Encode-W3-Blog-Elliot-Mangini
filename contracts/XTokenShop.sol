// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IMyERC20Token is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

interface IMyERC721Token {
    function safeMint(address to, uint256 tokenId) external;
    function burnFrom(uint256 tokenId) external;
}   



contract TokenSale is Ownable {
    uint256 public ratio;
    uint256 public price;
    IMyERC20Token public paymentToken;
    IMyERC721Token public ballotTokenContract;
    uint256 public withdrawableAmount;

    constructor(uint256 _ratio, uint256 _price, address _paymentToken) {
        ratio = _ratio;
        price = _price;
        paymentToken = IMyERC20Token(_paymentToken);
    }

    function buyTokens() external payable {
        uint256 amount = msg.value / ratio;
        paymentToken.mint(msg.sender, amount);
    }

    // Function for burning our ERC20 to get some ETH back.
    // Payable functions can receive ETH.
    function returnTokens(uint256 amount) external payable {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount * ratio);
    }

    function buyVoteNFT(uint256 tokenId) external {
        paymentToken.transferFrom(msg.sender, address(this),price);
        ballotTokenContract.safeMint(msg.sender, tokenId);
        withdrawableAmount += price / 2;
    }

    function withdraw(uint256 amount, address owner) external onlyOwner {
        withdrawableAmount -= amount;
        paymentToken.transfer(owner, amount);
    }
}