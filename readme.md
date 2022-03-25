## .
install mongodb follow this link: https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-20-04

download go-ipfs 

    npm istall
    cd app
    npm install
    cd ..
    cd go-ipfs
    sudo install.sh
    ipfs init
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\", \"POST\", \"GET\"]"
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
    ipfs daemon

## local

    ganache

check db status 

    sudo systemctl status mongod


add new account from ganache into metamask
add account[9] into 2_deploy_contracts.js


    truffle migrate
    npm run dev
    npm run start

go to ./app/src 

    truffle exec seed.js
    
## Testnet

    truffle deploy --network ropsten
    npm run dev