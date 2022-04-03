// SPDX-License-Identifier: MIT

pragma solidity >=0.4.21 <0.9.0;

import "./Escrow.sol";

contract EcommerceStore {
    enum ProductCondition {
        New,
        Used
    }

    uint256 public productIndex;

    uint256 public numberOfArbiter;

    mapping(uint256 => Arbiter) public arbiters; // 1-> active , 2->banned
    mapping(address => uint256) public arbitersId;

    mapping(address => mapping(uint256 => Product)) stores;

    mapping(uint256 => address payable) productIdInStore;

    mapping(uint256 => address) productEscrow;

    uint256 public registFee = 5 ether;

    struct Arbiter {
        address payable _address;
        uint256 _state;
    }

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

    event BuyProduct(
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

    event ResetBuyer(
        uint256 _productId,
        address _oldBuyer,
        address _currentBuyer
    );

    event ArbiterRegistration(
        address _arbiter,
        uint256 _value,
        uint256 _arbiterId
    );

    event ArbiterWithdraw(
        address _arbiter,
        uint256 _value,
        uint256 _currentstate
    );

    constructor(address payable _arbiter) public {
        productIndex = 0;
        numberOfArbiter = 1;
        Arbiter memory _tmp = Arbiter(_arbiter, 1);
        arbiters[numberOfArbiter] = _tmp;
        arbitersId[_arbiter] = numberOfArbiter;
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

        productEscrow[productIndex] = address(0);

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

    //random _min <= x < _max
    function random(uint256 _min, uint256 _max) public view returns (uint256) {
        uint256 randomnumber = uint256(
            keccak256(abi.encodePacked(now, msg.sender))
        ) % (_max - _min);
        randomnumber = randomnumber + _min;
        return randomnumber;
    }

    function buy(uint256 _productId) public payable {
        Product memory product = stores[productIdInStore[_productId]][
            _productId
        ];
        require(product.buyer == address(0));
        require(msg.value >= product.price);
        product.buyer = msg.sender;
        stores[productIdInStore[_productId]][_productId] = product;
        if (productEscrow[product.id] == address(0)) {
            uint256 _randomNum = random(0, numberOfArbiter) + 1;
            Escrow escrow = (new Escrow).value(msg.value)(
                _productId,
                msg.sender,
                productIdInStore[_productId],
                arbiters[_randomNum]._address
            );
            productEscrow[_productId] = address(escrow);
        }

        emit BuyProduct(
            _productId,
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

    function escrowInfo(uint256 _productId)
        public
        view
        returns (
            address,
            address,
            address,
            bool,
            uint256,
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

    function resetBuyer(uint256 _productId) public {
        require(msg.sender == productEscrow[_productId]);
        Product memory product = stores[msg.sender][_productId];
        address _oldBuyer = product.buyer;
        product.buyer = address(0);
        stores[msg.sender][_productId] = product;
        emit ResetBuyer(_productId, _oldBuyer, product.buyer);
    }

    function arbiterRegistration() public payable {
        require(arbitersId[msg.sender] == 0, "Existed arbiter"); // check unexisted arbiter
        require(msg.value == registFee, "Not enough fee");

        Arbiter memory _arbiter = Arbiter(msg.sender, 1);
        numberOfArbiter++;
        arbitersId[msg.sender] = numberOfArbiter;
        arbiters[numberOfArbiter] = _arbiter;
        emit ArbiterRegistration(msg.sender, registFee, numberOfArbiter);
    }

    function arbiterWithdraw() public payable {
        require(arbitersId[msg.sender] != 0, "Unexisted arbiter"); // check existed arbiter
        require(arbiters[arbitersId[msg.sender]]._state == 1, "Banned arbiter");
        (msg.sender).transfer(registFee);
        arbiters[arbitersId[msg.sender]]._state = 2;
        emit ArbiterWithdraw(
            msg.sender,
            registFee,
            arbiters[arbitersId[msg.sender]]._state
        );
    }

    function reportArbiter(uint256 _productId) public {
        return Escrow(productEscrow[_productId]).reportArbiter(msg.sender);
    }

    event ArbiterBanned(address _arbiter);

    function requestBanArbiter(address payable _arbiter, uint256 _productId)
        public
    {
        require(msg.sender == productEscrow[_productId]);
        Arbiter memory tmp = arbiters[arbitersId[_arbiter]];
        tmp._state = 2;
        arbiters[arbitersId[_arbiter]] = tmp;
        productEscrow[_productId] = address(0);
        Product memory product = stores[productIdInStore[_productId]][
            _productId
        ];
        product.buyer = address(0);
        stores[productIdInStore[_productId]][_productId] = product;
        emit ArbiterBanned(_arbiter);
    }
}
