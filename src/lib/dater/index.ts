import NodeClient from "../node-client";

import { IEthereumDater, DaterBlockInfo, EthereumDaterConfig } from "./types";

import * as constants from "./constants";
import { Provider } from "../types";

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

    async getBlock(date: number | string | Date): Promise<DaterBlockInfo> {
        await this.getInitialTimestamp();
        this.getTimestamp(date);

        const currentBlock = await this.nodeClient.getBlockNumber();
        const totalTime =
            Math.floor(Date.now() / 10 ** 3) - this.initialTimestamp;

        const resolvedBlock = await this.checkBlock(
            currentBlock,
            0,
            totalTime / currentBlock,
        );

        return resolvedBlock;
    }

    private async checkBlock(
        high: number,
        low: number,
        blockTime: number,
        depth = 0,
    ): Promise<DaterBlockInfo> {
        if (depth > this.maxRetries) {
            throw new Error(
                `Unable to locate block at timestamp ${this.timestamp}`,
            );
        }

        const pos = Math.floor(
            (this.timestamp - this.initialTimestamp) / blockTime,
        );

        const blockInfo = await this.nodeClient.getBlock(pos);
        const currentBlockTimestamp = Number(blockInfo.timestamp);

        const adjustedBlockTime =
            (currentBlockTimestamp - this.initialTimestamp) / pos;

        if (
            Math.abs(this.timestamp - currentBlockTimestamp) <= this.accuracy ||
            pos === low ||
            pos === high
        ) {
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
            return this.checkBlock(pos, low, adjustedBlockTime, depth + 1);
        }

        return this.checkBlock(high, pos, adjustedBlockTime, depth + 1);
    }

    private async getInitialTimestamp() {
        const firstBlock = await this.nodeClient.getBlock(1);

        this.initialTimestamp = Number(firstBlock.timestamp);
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
