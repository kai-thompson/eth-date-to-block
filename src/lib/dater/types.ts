import { Provider } from "../types";

export interface IEthereumDater {
  getBlock(date: string): Promise<GetBlockResponse>;
}

export interface EthereumDaterConfig {
  accuracy?: number;
  maxRetries?: number;
}

export interface GetBlockResponse {
  block: {
    number: number;
    timestamp: number;
    date: Date;
  };
  retries: number;
  secondsFromTarget: number;
}
