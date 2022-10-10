import type { Config } from "jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default async (): Promise<Config> => {
  return {
    clearMocks: true,
    collectCoverageFrom: ["**/*.spec.ts"],
    testRegex: ".+\\.spec\\.ts$",
    verbose: true,
    testEnvironment: "node",
    transform: {},
    preset: "ts-jest",
  };
};
