const EcommerceStore = artifacts.require("EcommerceStore");

module.exports = async function(deployer, _network, addresses) {
  accounts =  web3.eth.getAccounts();
  deployer.deploy(EcommerceStore, "0x46C65095E330AE18B5D3FBDbf021310e4026bb3A");
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