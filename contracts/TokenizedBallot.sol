// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IVoteToken {
    // things we want to be able to call from our vote token
    // We can add view to save gas since this is a read-only call to the blockchain.
    function getPastVotes(address, uint256) external view returns (uint256);


}

contract TokenizedBallot {    
    // We don't need chairpersons or voters with a self-delegating vote system.
    // Just proposals, an interface for our vote token, and proposals and queries.

    struct Proposal {
        bytes32 name;   
        uint voteCount; 
    }

    IVoteToken public tokenContract;
    Proposal[] public proposals;
    uint256 public targetBlockNumber;

    mapping (address => uint256) public votePowerSpent;
    
    // Sets the contracts internal information at the time it is deployed.
    constructor(
        bytes32[] memory proposalNames,
        address _tokenContract,
        uint256 _targetBlockNumber
    ) {
        tokenContract = IVoteToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;
        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0 }));
        }
    }
    
    // We add an amount arg so you can use some votes for one thing and some for another
    function vote(uint proposal, uint256 amount) external {
        require(votingPower(msg.sender) >= amount, "TokenizedBallot: Insufficient Votes");
        votePowerSpent[msg.sender] += amount;
        proposals[proposal].voteCount += amount;
    }

    function votingPower(address account) public view returns (uint256) {
        return tokenContract.getPastVotes(account, targetBlockNumber) - votePowerSpent[account];
    }
    
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }
    
    function winnerName() external view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
}