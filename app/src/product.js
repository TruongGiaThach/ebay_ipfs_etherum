const mongoose = require('mongoose');

mongoose.Promise = global.Promise;


// main().catch(err => console.log(err));

// async function main() {
//   await mongoose.connect('mongodb://localhost:27017/test');
// } 

var Schema = mongoose.Schema;

var ProductSchema = new Schema({
    blockchainId: Number,
    name: String,
    category: String,
    ipfsImageHash: String,
    ipfsDescHash: String,
    startTime: Number,
    price: Number,
    condition: Number,
    buyer: String,
});

var ProductModel = mongoose.model('ProductModel',ProductSchema);

module.exports = ProductModel;