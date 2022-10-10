# Ethereum Block To Date

An efficient and accurate way to search for Ethereum block numbers by date

Uses an [interpolation search](https://en.wikipedia.org/wiki/Interpolation_search) algorithm

Current version supports Web3.js and ethers.js providers

Finds blocks 2x faster than [ethereum-block-by-date](https://github.com/monosux/ethereum-block-by-date/), while using half the RPC calls

## Installation

Use npm:

```
npm i eth-date-to-block
```

## Usage

### Usage with ES modules

```javascript
import EthereumDater from "eth-date-to-block";
import Web3 from "web3";

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER));

const dater = new EthereumDater(
    web3.eth, // Web3 eth provider, required.
    {
        accuracy, // Optional. Returns a block number within n seconds this value if possible. By default 10.
        maxRetries, // Optional. Max amount of RPC calls allowed. By default 15.
    },
);
```

### Usage with CommonJS

```javascript
const EthDater = require("eth-date-to-block");
const { ethers } = require("ethers");

const ethersProvider = ethers.providers.JsonRpcProvider(process.env.PROVIDER);

const dater = new EthDater(
    ethersProvider, // Ethers provider, required.
);
```

### Requests

```javascript
// Getting block by date:
const block = await dater.getBlock(
    "2016-07-20T13:20:40Z", // Any valid Date() constructor value
);

/* Returns {
  block: {
    number: number; // Resolved block number
    timestamp: number; // Timestamp the resolved block was mined
    date: Date; // Date() object of block's timestamp
  };
  retries: number; // Number of reties (RPC requests made)
  secondsFromTarget: number; // Delta between the target timestamp minus the resolved blocks timestamp
} */
```

Note: if date is out of range (before genesis block or in the future), getBlock() will throw a relevant error

## Found a bug? Improvement Proposal?

If you need any help, please contact me via GitHub issues page: [GitHub](https://github.com/kai-thompson/eth-date-to-block/issues)

Feel free to open new issues and pull requests!
