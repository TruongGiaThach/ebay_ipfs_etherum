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
    $("#regist-arbiter").click(async function (event) {
      $("#msg").hide();
      App.instance.methods.arbiterRegistration().send(
        { value: App.web3.utils.toWei("5", 'ether'), from: App.account })
        .then(function (i) {
          console.log(i);
        });
      $("#msg").show();

      $("#msg").html("You have successfully registration!");

      event.preventDefault();
    });
    $("#arbiter-withdraw").click(async function (event) {
      $("#msg").hide();
      App.instance.methods.reportArbiter().send(
        { from: App.account, gas: 4700000 })
        .then(function (i) {
          console.log(i);
        });
      $("#msg").show();

      event.preventDefault();
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
        this.renderStore("all");
        this.showCate();
      }
      $("#report-arbiter").click(async function (event) {
        $("#msg").hide();
        let productId = new URLSearchParams(window.location.search).get('id');
        App.instance.methods.reportArbiter(productId).send(
          { from: App.account, gas: 4700000 })
          .then(function (i) {
            console.log(i);
          });
        $("#msg").show();

        $("#msg").html("You have successfully withdraw!");

        event.preventDefault();
      });




    } catch (error) {

      console.error("Could not connect to contract or chain.");

    }

  },

  registArbiter: async function () {
    const { arbiterRegistration } = this.instance.methods;
    arbiterRegistration().send({ value: this.web3.utils.toWei(5, 'ether'), from: this.account, gas: 4700000 }).then(function (i) {
      console.log(i);
    });
  },

  renderStore: async function (_category) {

    var renderProduct = this.renderProduct;
    $("#product-list").html('<div class="row" id="product-list">');
    $("#product-purchased").html('<div class="row" id="product-purchased">');
    var param = jQuery.param({ category: _category.toString() });
    if (_category == "all")
      param = null;
    $.ajax({

      url: "http://localhost:3000/products",

      type: 'get',

      contentType: 'application/json; charset=utf-8',

      data: param,

    }).done(function (data) {

      console.log(data);

      while (data.length > 0) {

        let chunks = data.splice(0, 4);

        chunks.forEach(function (value) {

          renderProduct(value);

        });

      }

    });

  },

  showCate: async function () {

    $('.category-link').click((event) => {
      console.log(event.target.title);
      this.renderStore(event.target.title)
    });
  },
  renderProduct: async function (product) {

    console.log(product);

    let node = $("<div/>");

    node.addClass("col-sm-3 text-center col-margin-bottom-1 product");

    node.append("<img width='200' height='200' src='https://ipfs.io/ipfs/" + product.ipfsImageHash + "' />");

    node.append("<div class='title'>" + product.name + "");

    node.append("<div> Price: " + displayPrice(product.price.toString()) + "");

    node.append("<a href='product.html?id=" + product.blockchainId + "'>Details");

    if (product.buyer === "0x0000000000000000000000000000000000000000") {

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
    $('#product-image').attr("src", "https://ipfs.io/ipfs/" + p[3]);
    $("#buy-now-price").val(p[6]);
    $("#product-id").val(p[0]);
    this.showDescription(p[4]);
    if (p[8] == '0x0000000000000000000000000000000000000000') {
      $("#escrow-info").hide();

    } else {
      $("#buy-now").hide();
      const { escrowInfo } = this.instance.methods;
      escrowInfo(productId).call().then(function (i) {
        console.log(i);
        $('#buyer').html("Buyer: " + i[0]);
        $('#seller').html("Seller: " + i[1]);
        $('#arbiter').html("Arbiter: " + i[2]);
        $('#report-count').html("Report: " + i[6]);

        $('#release-count').html(i[4]);
        $('#refund-count').html(i[5]);

      })
    }



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

    console.log(product["product-name"], product["product-category"], imageId,

      descId, Date.parse(product["product-start-time"]) / 1000,

      this.web3.utils.toWei(product["product-price"], 'ether'), product["product-condition"]);

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

const cors = require('cors');



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