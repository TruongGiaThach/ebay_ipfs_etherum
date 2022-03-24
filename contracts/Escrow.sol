// SPDX-License-Identifier: MIT

pragma solidity >=0.4.21 <0.9.0;

contract Escrow {
    address payable public buyer; 
    address payable public seller;
    address  public arbiter;
    uint public productId;
    uint public amount; 
    mapping (address=>bool) releaseAmount;
    mapping (address=>bool) refundAmount;
    uint public releaseCount;
    uint public refundCound;
    bool public fundsDisbursed;
    address public owner;

    constructor(uint _productId, address payable _buyer, address payable _seller, address _arbiter) payable public {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        fundsDisbursed = false;
        amount = msg.value;
        owner = msg.sender;
        productId = _productId;
    }

    function escrowInfo() view public returns (address, address, address, bool, uint, uint){
        return (buyer, seller, arbiter, fundsDisbursed, releaseCount, refundCound);
    }

    function releaseAmountToSeller(address caller) public {
        require(fundsDisbursed == false);
        require(msg.sender == owner);
        if ((caller == buyer || caller == seller || caller == arbiter) && releaseAmount[caller] != true){
            releaseAmount[caller] = true;
            releaseCount +=1;
        }
        if (releaseCount == 2){   
            seller.transfer(amount);
            fundsDisbursed = true;
        }
    }


    function refundAmountToBuyer(address caller) public {
        require(fundsDisbursed == false);
        require(msg.sender == owner);
        if ((caller == buyer || caller == seller || caller == arbiter) && refundAmount[caller] != true){
            refundAmount[caller] = true;
            refundCound += 1;
        }
        if (refundCound == 2){   
            buyer.transfer(amount);
            fundsDisbursed = true;
        }
    }
    

    
}
