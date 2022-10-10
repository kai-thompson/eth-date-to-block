import { Provider } from "../types";

class NodeClient {
    private provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async getBlockNumber() {
        try {
            const blockNumber = await this.provider.getBlockNumber();
            return blockNumber;
        } catch (e: unknown) {
            if (e instanceof Error) {
                throw new Error(`Unable to fetch block number: ${e.message}`);
            } else {
                throw new Error("Unable to fetch block number");
            }
        }
    }

    async getBlock(blockNumber: number) {
        try {
            const blockInfo = await this.provider.getBlock(blockNumber);
            return blockInfo;
        } catch (e: unknown) {
            if (e instanceof Error) {
                throw new Error(
                    `Unable to fetch block ${blockNumber}: ${e.message}`,
                );
            } else {
                throw new Error(`Unable to fetch block ${blockNumber}`);
            }
        }
    }
}

export default NodeClient;
