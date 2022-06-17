import Web3 from "web3";

import "./app.css";

import ecommerceStoreArtifact from "../../build/contracts/EcommerceStore.json";

import { create } from 'ipfs-http-client';

// connect to ipfs daemon API server
const ipfs = create('http://localhost:5001')



const App = {

  web3: null,

  account: null,

  instance: null,

  reader: null,

  start: async function () {

    const { web3 } = this;
    $("#add-item-to-store").submit(function (event) {

      const req = $("#add-item-to-store").serialize();

      let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');

      let decodedParams = {}

      Object.keys(params).forEach(function (v) {

        decodedParams[v] = decodeURIComponent(decodeURI(params[v]));

      });

      App.saveProduct(decodedParams);

      event.preventDefault();

    });

    $("#buy-now").submit(function (event) {

      $("#msg").hide();

      var sendAmount = $("#buy-now-price").val();

      var productId = $("#product-id").val();

      App.instance.methods.buy(productId).send({ value: sendAmount, from: App.account })

      $("#msg").show();

      $("#msg").html("You have successfully purchased the product!");

      event.preventDefault();

    });

    $("#release-funds").click(async function (event) {

      let productId = new URLSearchParams(window.location.search).get('id');

      $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show();

      console.log(productId);

      await App.instance.methods.releaseAmountToSeller(productId).send({ from: App.account, gas: 4700000 })

      location.reload();

    });

    $("#refund-funds").click(async function (event) {

      let productId = new URLSearchParams(window.location.search).get('id');

      $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show();

      console.log(productId);

      await App.instance.methods.refundAmountToBuyer(productId).send({ from: App.account, gas: 4700000 })

      location.reload();

    });


    const product_image = document.querySelector("#product-image");
    if (product_image != null)
      product_image.addEventListener("change", (event) => {
        const file = event.target.files[0];
        console.log(file);
        this.reader = new window.FileReader();
        this.reader.readAsArrayBuffer(file);
      });

    try {

      // get accounts

      const accounts = await web3.eth.getAccounts();

      this.account = accounts[0];

      // get contract instance

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ecommerceStoreArtifact.networks[networkId];

      this.instance = new web3.eth.Contract(

        ecommerceStoreArtifact.abi,

        deployedNetwork.address,

      );


      if ($("#product-details").length > 0) {
        let productId = new URLSearchParams(window.location.search).get('id');
        this.renderProductDetails(productId);
      } else {
        this.renderStore();
      }

    } catch (error) {

      console.error("Could not connect to contract or chain.");

    }

  },


  renderStore: async function () {

    const { productIndex } = this.instance.methods;

    var count = await productIndex().call();

    for (var i = 1; i <= count; i++) {

      this.renderProduct(i);

    }

  },
  renderProduct: async function (index) {

    const { getProduct } = this.instance.methods;

    var f = await getProduct(index).call()

    let node = $("<div/>");

    node.addClass("col-sm-3 text-center col-margin-bottom-1 product");

    // node.append("<img src='https://ipfs.io/ipfs/" + f[3] + "'/>");
    node.append("<img src='http://localhost:8080/ipfs/" + f[3] + "'/>");


    node.append("<div class='title'>" + f[1] + "</div>");

    node.append("<div> Price: " + displayPrice(f[6]) + "</div>");

    node.append("<a href='product.html?id=" + f[0] + "'>Details</div>");

    if (f[8] === '0x0000000000000000000000000000000000000000') {

      $("#product-list").append(node);

    } else {

      $("#product-purchased").append(node);

    }

  },
  renderProductDetails: async function (productId) {

    const { getProduct } = this.instance.methods;
    var p = await getProduct(productId).call();
    $("#product-name").html(p[1]);
    $("#product-price").html(displayPrice(p[6]));
    // $('#product-image').attr("src", "https://ipfs.io/ipfs/" + p[3]);
    $('#product-image').attr("src", "http://localhost:8080/ipfs/" + p[3]);

    $("#buy-now-price").val(p[6]);
    $("#product-id").val(p[0]);
    this.showDescription(p[4]);
    if (p[8] == '0x0000000000000000000000000000000000000000') {
      $("#escrow-info").hide();
    } else {
      $("#buy-now").hide();
    }

    const { escrowInfo } = this.instance.methods;
    escrowInfo(productId).call().then(function (i) {
      console.log(i);
      $('#buyer').html("Buyer: " + i[0]);
      $('#seller').html("Seller: " + i[1]);
      $('#arbiter').html("Arbiter: " + i[2]);

      $('#release-count').html(i[4]);
      $('#refund-count').html(i[5]);

    })

  },
  showDescription: async (hash) => {
    let contennts = await ipfs.cat(hash);
    for await (const item of contennts) {
      $('#product-desc').append("<div>" + new TextDecoder().decode(item).toString() + "</div>");
    }

  },

  saveProduct: async function (product) {

    // 1. Upload image to IPFS and get the hash

    // 2. Add description to IPFS and get the hash

    // 3. Pass the 2 hashes to addProductToStore


    const { addProductToStore } = this.instance.methods;

    var imageId = await this.saveImageOnIpfs(this.reader);

    var descId = await this.saveTextBlobOnIpfs(product["product-description"]);

    addProductToStore(product["product-name"], product["product-category"], imageId,

      descId, Date.parse(product["product-start-time"]) / 1000,

      this.web3.utils.toWei(product["product-price"], 'ether'), product["product-condition"]).send({ from: this.account, gas: 4700000 });

  },


  saveImageOnIpfs: async function (reader) {
    console.log(reader);
    return new Promise(function (resolve, reject) {


      const buffer = Buffer.from(reader.result);


      ipfs.add(buffer)

        .then((response) => {

          console.log(response.path)

          resolve(response.path);

        }).catch((err) => {

          console.error(err)

          reject(err);

        })

    })

  },


  saveTextBlobOnIpfs: async function (blob) {

    return new Promise(function (resolve, reject) {

      const descBuffer = Buffer.from(blob, 'utf-8');

      ipfs.add(descBuffer)

        .then((response) => {

          console.log(response)

          resolve(response.path);

        }).catch((err) => {

          console.error(err)

          reject(err);

        })

    })

  },
};


function displayPrice(amt) {

  return "Ξ" + App.web3.utils.fromWei(amt, 'ether');

}


window.App = App;


window.addEventListener("load", function () {
  if (window.ethereum) {

    // use MetaMask's provider

    App.web3 = new Web3(window.ethereum);

    window.ethereum.enable(); // get permission to access accounts


  } else {

    console.warn(

      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",

    );

    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)

    App.web3 = new Web3(

      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),

    );

  }


  App.start();

});