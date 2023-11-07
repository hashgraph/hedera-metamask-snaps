export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

// 3030 for hedera
export const DEFAULTCOINTYPE = 3030;

export const hederaNetworks: string[] = ['mainnet', 'testnet', 'previewnet'];
