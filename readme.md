## .

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

add new account from ganache into metamask

    truffle migrate
    npm run dev


## Testnet

    truffle deploy --network ropsten
    npm run dev