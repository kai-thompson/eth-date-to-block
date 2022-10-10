import NodeClient from "../node-client";

import { IEthereumDater, GetBlockResponse, EthereumDaterConfig } from "./types";

import * as constants from "./constants";
import { Provider } from "../types";

class EthereumDater implements IEthereumDater {
  private nodeClient: NodeClient;

  private timestamp = 0;
  private date: Date = new Date(0);

  private accuracy: number = constants.DEFAULT_ACCURACY;
  private maxRetries: number = constants.DEFAULT_MAX_RETRIES;

  readonly INITIAL_TIMESTAMP = constants.ETH_STARTING_TIMESTAMP;

  constructor(provider: Provider, config?: EthereumDaterConfig) {
    const { accuracy, maxRetries } = config || {};

    this.nodeClient = new NodeClient(provider);

    accuracy && (this.accuracy = accuracy);
    maxRetries && (this.maxRetries = maxRetries);
  }

  async getBlock(date: string): Promise<GetBlockResponse> {
    this.getTimestamp(date);

    const currentBlock = await this.nodeClient.getBlockNumber();
    const totalTime = Math.floor(Date.now() / 10 ** 3) - this.INITIAL_TIMESTAMP;

    const resolvedBlock = await this.checkBlock(
      currentBlock,
      0,
      totalTime / currentBlock
    );

    return resolvedBlock;
  }

  private async checkBlock(
    high: number,
    low: number,
    blockTime: number,
    depth = 0
  ): Promise<GetBlockResponse> {
    if (depth > this.maxRetries) {
      throw new Error(`Unable to locate block at timestamp ${this.timestamp}}`);
    }

    const pos = Math.floor(
      (this.timestamp - this.INITIAL_TIMESTAMP) / blockTime
    );

    const blockInfo = await this.nodeClient.getBlock(pos);
    const currentBlockTimestamp = Number(blockInfo.timestamp);

    const adjustedBlockTime =
      (currentBlockTimestamp - this.INITIAL_TIMESTAMP) / pos;

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
        secondsFromTarget: Math.ceil(this.timestamp - currentBlockTimestamp),
      };
    }

    if (this.timestamp < currentBlockTimestamp) {
      return await this.checkBlock(pos, low, adjustedBlockTime, depth + 1);
    }

    return await this.checkBlock(high, pos, adjustedBlockTime, depth + 1);
  }

  private getTimestamp = (_date: string) => {
    this.date = new Date(_date);
    this.timestamp = this.date.getTime() / 1000;

    if (this.timestamp < this.INITIAL_TIMESTAMP) {
      throw new Error(`Date ${_date} is before Ethereum genesis block`);
    }
    if (this.timestamp > Date.now() / 1000) {
      throw new Error(`Date ${_date} is in the future`);
    }
  };
}

export default EthereumDater;
