// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";



interface IMyERC20Token {
    function mint(address to, uint256 amount) external;
}



contract TokenSale {
    uint256 public ratio;
    IMyERC20Token public paymentToken;

    constructor(uint256 _ratio, address _paymentToken) {
        ratio = _ratio;
        paymentToken = IMyERC20Token(_paymentToken);
    }

    function buyTokens() external payable {
        uint256 amount = msg.value / ratio;
        paymentToken.mint(msg.sender, amount);
    }
}