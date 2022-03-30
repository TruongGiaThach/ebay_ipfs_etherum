// SPDX-License-Identifier: MIT

pragma solidity >=0.4.21 <0.9.0;
import "./EcommerceStore.sol";
import "./SafeMath.sol";

contract Escrow {
    address payable public buyer;
    address payable public seller;
    address payable public arbiter;
    uint256 public productId;
    uint256 public amount;
    mapping(address => bool) releaseAmount;
    mapping(address => bool) refundAmount;
    uint256 public releaseCount;
    uint256 public refundCound;
    bool public fundsDisbursed;
    address public owner;

    constructor(
        uint256 _productId,
        address payable _buyer,
        address payable _seller,
        address payable _arbiter
    ) public payable {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        fundsDisbursed = false;
        amount = msg.value;
        owner = msg.sender;
        productId = _productId;
    }

    uint256 public basePercent = 100;

    function onePercent(uint256 _value) public view returns (uint256) {
        uint256 roundValue = SafeMath.ceil(_value, basePercent);
        uint256 _onePercent = SafeMath.div(
            SafeMath.mul(roundValue, basePercent),
            10000
        );
        return _onePercent;
    }

    function escrowInfo()
        public
        view
        returns (
            address,
            address,
            address,
            bool,
            uint256,
            uint256
        )
    {
        return (
            buyer,
            seller,
            arbiter,
            fundsDisbursed,
            releaseCount,
            refundCound
        );
    }

    function releaseAmountToSeller(address caller) public {
        require(fundsDisbursed == false);
        require(msg.sender == owner);
        if (
            (caller == buyer || caller == seller || caller == arbiter) &&
            releaseAmount[caller] != true
        ) {
            releaseAmount[caller] = true;
            releaseCount += 1;
        }
        if (releaseCount == 2) {
            uint _serviceFee = this.onePercent(amount);
            arbiter.transfer(_serviceFee);
            amount = amount - _serviceFee;
            seller.transfer(amount);
            fundsDisbursed = true;
        }
    }

    function refundAmountToBuyer(address caller) public {
        require(fundsDisbursed == false);
        require(msg.sender == owner);
        if (
            (caller == buyer || caller == seller || caller == arbiter) &&
            refundAmount[caller] != true
        ) {
            refundAmount[caller] = true;
            refundCound += 1;
        }
        if (refundCound == 2) {
            buyer.transfer(amount);
            fundsDisbursed = false;
            resetEscrow();
            EcommerceStore(address(owner)).resetBuyer(productId);
        }
    }

    function resetEscrow() private {
        releaseAmount[buyer] = false;
        releaseAmount[seller] = false;
        releaseAmount[arbiter] = false;
        refundAmount[buyer] = false;
        refundAmount[seller] = false;
        refundAmount[arbiter] = false;

        buyer = address(0);
        releaseCount = 0;
        refundCound = 0;

        fundsDisbursed = false;
    }
}
