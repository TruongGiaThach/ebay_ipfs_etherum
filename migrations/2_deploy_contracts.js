const EcommerceStore = artifacts.require("EcommerceStore");

module.exports = async function(deployer, _network, addresses) {
  accounts =  web3.eth.getAccounts();
  deployer.deploy(EcommerceStore, "0x26E55426661bd9Ab7008CB1Df017FE6D841F0de7");
};
// module.exports =  function(deployer, _network, addresses) {
//   accounts = web3.eth.getAccounts();
//   setTimeout(function() {
//     // code to be executed after 1.5 second
//     console.log(accounts[9]);
//     deployer.deploy(EcommerceStore, accounts[9]);
//   }, 1500);
  
// };