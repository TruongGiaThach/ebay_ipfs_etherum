const EcommerceStore = artifacts.require("EcommerceStore");
//const SafeMath = artifacts.require("SafeMath");

// module.exports = async function(deployer, _network, addresses) {
//   accounts =  web3.eth.getAccounts();
//   deployer.deploy(EcommerceStore, "0x8fe2c6C32b94382b9E1689b9DDce41407a5D8e91");
// };
module.exports = async function(deployer, _network, addresses) {
  // accounts = await web3.eth.getAccounts();
  //deployer.deploy(SafeMath);
  const [owner, seller1, seller2, buyer1, buyer2 ,arbiter, _] = addresses; 
  deployer.deploy(EcommerceStore, arbiter);
};
// module.exports =  function(deployer, _network, addresses) {
//   accounts = web3.eth.getAccounts();
//   setTimeout(function() {
//     // code to be executed after 1.5 second
//     deployer.deploy(EcommerceStore, accounts[9]);
//   }, 1500);
  
// };

// module.exports =  function(deployer, _network, addresses) {
//   web3.eth.getAccounts().then( async function(accounts){
//     console.log(accounts[9]);
//     deployer.deploy(EcommerceStore, accounts[9]);
//   });
  
  
// };