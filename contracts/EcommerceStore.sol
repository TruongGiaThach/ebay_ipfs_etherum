// SPDX-License-Identifier: MIT

pragma solidity >=0.4.21 <0.9.0;

import "./Escrow.sol";

contract EcommerceStore {
    enum ProductCondition {
        New,
        Used
    }

    uint256 public productIndex;

    address public arbiter;

    mapping(address => mapping(uint256 => Product)) stores;

    mapping(uint256 => address payable) productIdInStore;

    mapping(uint256 => address) productEscrow;

    struct Product {
        uint256 id;
        string name;
        string category;
        string imageLink;
        string descLink;
        uint256 startTime;
        uint256 price;
        ProductCondition condition;
        address buyer;
    }

    event NewProduct(
        uint256 _productId,
        string name,
        string category,
        string imageLink,
        string descLink,
        uint256 startTime,
        uint256 price,
        ProductCondition condition,
        address buyer
    );

    constructor(address _arbiter) public {
        productIndex = 0;
        arbiter = _arbiter;
    }

    function addProductToStore(
        string memory _name,
        string memory _category,
        string memory _imageLink,
        string memory _descLink,
        uint256 _startTime,
        uint256 _price,
        uint256 _productCondition
    ) public {
        productIndex += 1;

        Product memory product = Product(
            productIndex,
            _name,
            _category,
            _imageLink,
            _descLink,
            _startTime,
            _price,
            ProductCondition(_productCondition),
            address(0)
        ); //change the left one 0 ->msg.sender

        stores[msg.sender][productIndex] = product;

        productIdInStore[productIndex] = msg.sender;

        emit NewProduct(
            productIndex,
            _name,
            _category,
            _imageLink,
            _descLink,
            _startTime,
            _price,
            ProductCondition(_productCondition),
            address(0)
        );
    }

    function getProduct(uint256 _productId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            ProductCondition,
            address
        )
    {
        Product memory product = stores[productIdInStore[_productId]][
            _productId
        ];

        return (
            product.id,
            product.name,
            product.category,
            product.imageLink,
            product.descLink,
            product.startTime,
            product.price,
            product.condition,
            product.buyer
        );
    }

    function buy(uint256 _productId) public payable {
        Product memory product = stores[productIdInStore[_productId]][
            _productId
        ];
        require(product.buyer == address(0));
        require(msg.value >= product.price);
        product.buyer = msg.sender;
        stores[productIdInStore[_productId]][_productId] = product;
        Escrow escrow = (new Escrow).value(msg.value)(
            _productId,
            msg.sender,
            productIdInStore[_productId],
            arbiter
        );
        productEscrow[_productId] = address(escrow);
    }

    function escrowInfo(uint256 _productId)
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
        return Escrow(productEscrow[_productId]).escrowInfo();
    }

    function releaseAmountToSeller(uint256 _productId) public {
        return
            Escrow(productEscrow[_productId]).releaseAmountToSeller(msg.sender);
    }

    function refundAmountToBuyer(uint256 _productId) public {
        return
            Escrow(productEscrow[_productId]).refundAmountToBuyer(msg.sender);
    }
}
