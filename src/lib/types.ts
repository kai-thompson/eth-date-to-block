/* eslint-disable import/no-extraneous-dependencies */
import { Eth as Web3Provider } from "web3-eth";
import { Provider as EthersProvider } from "@ethersproject/abstract-provider";

export type Provider = EthersProvider | Web3Provider;
