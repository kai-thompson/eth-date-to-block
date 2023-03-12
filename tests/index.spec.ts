import { ethers } from "ethers";

import EthereumDater from "../src/lib/dater/index";

const Web3 = require("web3");

const rpcUrl = "https://rpc.ankr.com/eth";

jest.setTimeout(30000);

describe("EthereumDater Test Suite", () => {
    const ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const web3Provider = new Web3(new Web3.providers.HttpProvider(rpcUrl)).eth;

    const ethersDater = new EthereumDater(ethersProvider);
    const web3Dater = new EthereumDater(web3Provider);

    describe("Get Block", () => {
        it("should return the correct block number from ethers.js provider", async () => {
            const { block } = await ethersDater.getBlock("2020-12-31");
            expect(block.number).toEqual(11558516);
        });
        it("should return the correct block number from web3.js provider", async () => {
            const { block } = await web3Dater.getBlock("2020-12-31");
            expect(block.number).toEqual(11558516);
        });
        it("should handle if date is before genesis block", async () => {
            expect.assertions(1);
            await ethersDater.getBlock("2015-07-30").catch((err) => {
                expect(err.message).toEqual(
                    "Date 2015-07-30 is before Ethereum genesis block",
                );
            });
        });
        it("should handle if date is in the future", async () => {
            expect.assertions(1);
            await ethersDater.getBlock("3000-12-31").catch((err) => {
                expect(err.message).toEqual("Date 3000-12-31 is in the future");
            });
        });
        it("should return the closest block by default or when specified", async () => {
            const nonSpecifiedPosition = await ethersDater.getBlock(
                "2020-12-31",
            );
            const specifiedClosestPosition = await ethersDater.getBlock(
                "2020-12-31",
            );
            expect(nonSpecifiedPosition.block.number).toEqual(specifiedClosestPosition.block.number)
            expect(specifiedClosestPosition.block.number).toEqual(11558516);
        });
        it("should return the block number before when specified", async () => {
            const { block } = await ethersDater.getBlock(
                "2020-12-31",
                "before",
            );
            expect(block.number).toEqual(11558516);
        });
        it("should return the block number after when specified", async () => {
            const { block } = await ethersDater.getBlock("2020-12-31", "after");
            expect(block.number).toEqual(11558517);
        });
    });

    describe("Get Blocks", () => {
        it("should return the correct block number from ethers.js provider", async () => {
            const blocks = await ethersDater.getBlocks(
                "2020-12-31",
                "2021-1-1",
                10000,
            );

            const blockNumbers = blocks.map((b) => b.block.number);

            expect(blockNumbers).toEqual([
                11558516, 11559288, 11560027, 11560759, 11561547, 11562315,
                11563071, 11563804, 11564534, 11565291, 11566427,
            ]);
        });
        it("should return the correct block number from web3.js provider", async () => {
            const blocks = await web3Dater.getBlocks(
                "2020-12-31",
                "2021-1-1",
                10000,
            );

            const blockNumbers = blocks.map((b) => b.block.number);

            expect(blockNumbers).toEqual([
                11558516, 11559288, 11560027, 11560759, 11561547, 11562315,
                11563071, 11563804, 11564534, 11565291, 11566427,
            ]);
        });
        it("should handle if start date is before genesis block", async () => {
            expect.assertions(1);

            await ethersDater
                .getBlocks("2020-12-31", "2021-1-1", 10000)
                .catch((err) => {
                    expect(err.message).toEqual(
                        "Date 2015-07-30 is before Ethereum genesis block",
                    );
                });
        });
        it("should handle if start date is in the future", async () => {
            expect.assertions(1);

            await ethersDater
                .getBlocks("3000-12-31", "3001-1-1", 1000)
                .catch((err) => {
                    expect(err.message).toEqual(
                        "Date 3000-12-31 is in the future",
                    );
                });
        });
        it("should handle if end date is before start date", async () => {
            expect.assertions(1);

            await ethersDater
                .getBlocks("2021-12-31", "2020-12-31", 1000)
                .catch((err) => {
                    expect(err.message).toEqual(
                        "2020-12-31 is not before 2021-12-31",
                    );
                });
        });
        it("should return the closest block by default or when specified", async () => {
            const [specifiedClosest, nonSpecifiedPosition] = await Promise.all([
                ethersDater.getBlocks("2020-12-31", "2021-1-1", 10000, "closest"),
                web3Dater.getBlocks("2020-12-31", "2021-1-1", 10000)
            ]);

            expect(nonSpecifiedPosition).toEqual(specifiedClosest);
        });
        it("should return the block number before when specified", async () => {
            const blocks = await ethersDater.getBlocks("2020-12-31", "2021-1-1", 10000, "before");
            const blockNumbers = blocks.map((b) => b.block.number);

            expect(blockNumbers).toEqual([
                11558516, 11559288, 11560026, 11560758, 11561547, 11562314,
                11563071, 11563803, 11564534, 11565291, 11566426,
            ]);
        });
        it("should return the block number after when specified", async () => {
            const blocks = await ethersDater.getBlocks(
                "2020-12-31",
                "2021-1-1",
                10000,
                "after",
            );
            const blockNumbers = blocks.map((b) => b.block.number);

            expect(blockNumbers).toEqual([
                11558517, 11559292, 11560031, 11560761, 11561553, 11562316,
                11563076, 11563808, 11564536, 11565294, 11566427,
            ]);
        });
    });
});
