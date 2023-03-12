import NodeClient from "../node-client";

import { DaterBlockInfo, EthereumDaterConfig, IEthereumDater } from "./types";

import { Provider } from "../types";
import * as constants from "./constants";

enum BlockPosition {
    Before = "before",
    After = "after",
    Closest = "closest",
}

class EthereumDater implements IEthereumDater {
    private nodeClient: NodeClient;

    private timestamp = 0;

    private date: Date = new Date(0);

    private accuracy: number = constants.DEFAULT_ACCURACY;

    private maxRetries: number = constants.DEFAULT_MAX_RETRIES;

    private initialTimestamp!: number;

    constructor(provider: Provider, config?: EthereumDaterConfig) {
        const { accuracy, maxRetries } = config || {};

        this.nodeClient = new NodeClient(provider);

        this.accuracy = accuracy || constants.DEFAULT_ACCURACY;
        this.maxRetries = maxRetries || constants.DEFAULT_MAX_RETRIES;
    }

    async getBlock(
        date: number | string | Date,
        position: BlockPosition = BlockPosition.Closest,
    ): Promise<DaterBlockInfo> {
        await this.getInitialTimestamp();
        this.getTimestamp(date);

        const currentBlock = await this.nodeClient.getBlockNumber();
        const totalTime =
            Math.floor(Date.now() / 10 ** 3) - this.initialTimestamp;

        const resolvedBlock = await this.checkBlock(
            currentBlock,
            0,
            totalTime / currentBlock,
            position,
        );

        return resolvedBlock;
    }

    // require: startDate and endDate are different
    async getBlocks(
        startDate: number | string | Date,
        endDate: number | string | Date,
        secondsPerInterval: number,
        position: BlockPosition = BlockPosition.After,
    ): Promise<DaterBlockInfo[]> {
        // make sure the interval is positive
        if (secondsPerInterval <= 0) {
            throw new Error("Interval must be greater than 0");
        }
        // make sure that endDate > startDate
        const startTime = new Date(startDate).getTime();
        const endTime = new Date(endDate).getTime();
        if (endTime - startTime < 0) {
            throw new Error(`${endDate} is not before ${startDate}`);
        }
        // get the bounds to reduce requests finding each block in the interval
        // get the start block
        const startBlock = await this.getBlock(startDate, position);
        // get the end block
        const endBlock = await this.getBlock(endDate, position);
        // number of blocks we need to return
        const n = Math.floor(
            (endBlock.block.timestamp - startBlock.block.timestamp) /
                secondsPerInterval,
        ) + 1;
        // create return array
        const blocks = new Array(n);
        // get the block time
        const timeDiff =
            (endBlock.block.timestamp - this.initialTimestamp) /
            endBlock.block.number;
        // loop vars
        let tempLo = startBlock.block.number;
        let tempBlock = startBlock;
        for (let i = 1; i < n - 1; i += 1) {
            // required param
            this.getTimestamp(
                (startBlock.block.timestamp + i * secondsPerInterval) * 1000,
            );
            // Find Block: disable eslint because we try to optimize request count and not time taken
            tempBlock = await this.checkBlock(
                endBlock.block.number,
                tempLo,
                timeDiff,
                position,
            );
            // set block
            blocks[i] = tempBlock;
            // set new lo
            tempLo = tempBlock.block.number + 1;
        }
        // set start and end
        blocks[0] = startBlock;
        // only if there is more than one block
        if (n > 1) {
            blocks[n - 1] = endBlock;
        }

        return blocks;
    }

    // position can be "before", "after", "closest". Default "closest"
    private async checkBlock(
        high: number,
        low: number,
        blockTime: number,
        position: BlockPosition = BlockPosition.Closest,
        depth: number = 0,
    ): Promise<DaterBlockInfo> {
        if (depth > this.maxRetries) {
            throw new Error(
                `Unable to locate block at timestamp ${this.timestamp}`,
            );
        }

        let pos = Math.floor(
            (this.timestamp - this.initialTimestamp) / blockTime,
        );

        const blockInfo = await this.nodeClient.getBlock(pos);
        let currentBlockTimestamp = Number(blockInfo.timestamp);

        const adjustedBlockTime =
            (currentBlockTimestamp - this.initialTimestamp) / pos;

        if (
            Math.abs(this.timestamp - currentBlockTimestamp) <= this.accuracy ||
            pos === low ||
            pos === high
        ) {
            if (position ===  BlockPosition.Before && currentBlockTimestamp > this.timestamp) {
                const prevBlock = await this.nodeClient.getBlock(
                    pos - 1,
                );
                currentBlockTimestamp = Number(prevBlock.timestamp);
                depth += 1;
                pos -= 1;
            }
        
            if (position ===  BlockPosition.After && currentBlockTimestamp < this.timestamp) {
                const nextBlock = await this.nodeClient.getBlock(
                    pos + 1,
                );
                currentBlockTimestamp = Number(nextBlock.timestamp);
                depth += 1;
                pos += 1;
            }

            return {
                block: {
                    number: pos,
                    timestamp: currentBlockTimestamp,
                    date: new Date(currentBlockTimestamp * 1000),
                },
                retries: depth,
                secondsFromTarget: Math.ceil(
                    this.timestamp - currentBlockTimestamp,
                ),
            };
        }

        if (this.timestamp < currentBlockTimestamp) {
            return this.checkBlock(
                pos,
                low,
                adjustedBlockTime,
                position,
                depth + 1,
            );
        }

        return this.checkBlock(
            high,
            pos,
            adjustedBlockTime,
            position,
            depth + 1,
        );
    }

    private async getInitialTimestamp() {
        if (!this.initialTimestamp) {
            const firstBlock = await this.nodeClient.getBlock(1);
            this.initialTimestamp = Number(firstBlock.timestamp);
        }
    }

    private getTimestamp(_date: number | string | Date) {
        this.date = new Date(_date);
        this.timestamp = this.date.getTime() / 1000;

        if (!this.timestamp) {
            throw new Error("Invalid date");
        } else if (this.timestamp < this.initialTimestamp) {
            throw new Error(`Date ${_date} is before Ethereum genesis block`);
        } else if (this.timestamp > Date.now() / 1000) {
            throw new Error(`Date ${_date} is in the future`);
        }
    }
}

export default EthereumDater;
