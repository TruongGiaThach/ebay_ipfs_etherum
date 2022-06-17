const EcommerceStore = artifacts.require("EcommerceStore");

module.exports = async function(deployer, _network, addresses) {
  accounts =  web3.eth.getAccounts();
  deployer.deploy(EcommerceStore, "0x6B3f6836bD4491A4A7b0881199712fb812c83d8f");
};
// module.exports =  function(deployer, _network, addresses) {
//   accounts = web3.eth.getAccounts();
//   setTimeout(function() {
//     // code to be executed after 1.5 second
//     console.log(accounts[9]);
//     deployer.deploy(EcommerceStore, accounts[9]);
//   }, 1500);
  
// };