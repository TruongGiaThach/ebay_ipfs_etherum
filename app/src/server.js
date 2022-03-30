var express = require('express');

var ecommerceStoreArtifact = require("../../build/contracts/EcommerceStore.json");

var Web3 = require('web3')


var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

var ProductModel = require('./product');

mongoose.connect("mongodb://localhost:27017/ebay_dapp_upgrade");

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// In Web3 1.x, only websocketprovider allows for listening to events and not httpprovider

web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'))


web3.eth.net.getId().then(function (networkId) {

    const deployedNetwork = ecommerceStoreArtifact.networks[networkId];

    instance = new web3.eth.Contract(

        ecommerceStoreArtifact.abi,

        deployedNetwork.address,

    );

    setupProductEventListner(instance);

})


var app = express();


app.listen(3000, function () {

    console.log("Ebay on Ethereum server listening on port 3000");

});


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/products", function (req, res) {
    var query = {};
    if (req.query.category !== undefined) {
        query['category'] = { $eq: req.query.category };
    }
    ProductModel.find(query, null, { sort: 'startTime' }, function (err, items) {
        console.log(items.length);
        res.send(items);
    })
})

function setupProductEventListner(i) {

    i.events.NewProduct({ fromBlock: 0 }, (error, event) => {

        console.log(event.returnValues);
        saveProduct(event.returnValues);
    })
    i.events.BuyProduct({ fromBlock: 0 }, (error, event) => {

        console.log(event.returnValues);
        buyProduct(event.returnValues);
    })
    i.events.ResetBuyer({ fromBlock: 0 }, (error, event) => {

        console.log(event.returnValues);
        resetBuyer(event.returnValues);
    })

    

}
function saveProduct(product) {
    ProductModel.findOne({
        'blockchainId': product._productId.toLocaleString()
    }, function (err, dbProduct) {
        if (dbProduct != null) {
            return;
        }
        var p = new ProductModel({
            name: product.name, blockchainId: product._productId,
            category: product.category, ipfsImageHash: product.imageLink, ipfsDescHash: product.descLink,
            startTime: product.startTime, price: product.price, condition: product.productCondition, buyer: product.buyer
        });
        p.save(function (error) {
            if (error) {
                console.log(error);
            } else {
                ProductModel.count({}, function (err, count) {
                    console.log("count is " + count);
                })
            };

        })
    })
}
function buyProduct(product) {
    ProductModel.updateOne({
        'blockchainId': product._productId.toLocaleString()
    },
    { buyer: product.buyer }
    , function (err, dbProduct) {
        if (err) throw err;
        console.log(dbProduct);
    })
}
function resetBuyer(param) {
    ProductModel.updateOne({
        'blockchainId': param._productId.toLocaleString()
    },
    { buyer: param._currentBuyer }
    , function (err, param) {
        if (err) throw err;
        console.log(param);
    })
}
