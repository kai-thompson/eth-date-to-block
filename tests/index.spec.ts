import { ethers } from "ethers";

import EthereumDater from "../src/lib/dater/index";

const Web3 = require("web3");

describe("EthereumDater Test Suite", () => {
    it("should return the correct block number from ethers.js provider", async () => {
        const provider = new ethers.providers.InfuraProvider(
            "homestead",
            process.env.INFURA_API_KEY,
        );
        const ethereumDater = new EthereumDater(provider);
        const { block } = await ethereumDater.getBlock("2020-12-31");
        expect(block.number).toEqual(11558516);
    });
    it("should return the correct block number from web3.js provider", async () => {
        const provider = new Web3(
            new Web3.providers.HttpProvider(
                `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
            ),
        );
        const ethereumDater = new EthereumDater(provider.eth);
        const { block } = await ethereumDater.getBlock("2020-12-31");
        expect(block.number).toEqual(11558516);
    });
    it("should handle if date is before genesis block", async () => {
        expect.assertions(1);

        const provider = new ethers.providers.InfuraProvider(
            "homestead",
            process.env.INFURA_API_KEY,
        );
        const ethereumDater = new EthereumDater(provider);
        await ethereumDater.getBlock("2015-07-30").catch((err) => {
            expect(err.message).toEqual(
                "Date 2015-07-30 is before Ethereum genesis block",
            );
        });
    });
    it("should handle if date is in the future", async () => {
        expect.assertions(1);

        const provider = new ethers.providers.InfuraProvider(
            "homestead",
            process.env.INFURA_API_KEY,
        );
        const ethereumDater = new EthereumDater(provider);
        await ethereumDater.getBlock("3000-12-31").catch((err) => {
            expect(err.message).toEqual("Date 3000-12-31 is in the future");
        });
    });
});
