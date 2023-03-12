export interface IEthereumDater {
    getBlock(date: string): Promise<DaterBlockInfo>;
}

export interface EthereumDaterConfig {
    accuracy?: number;
    maxRetries?: number;
}

export interface DaterBlockInfo {
    block: {
        number: number;
        timestamp: number;
        date: Date;
    };
    retries: number;
    secondsFromTarget: number;
}

export type BlockPosition = "before" | "closest" | "after";
