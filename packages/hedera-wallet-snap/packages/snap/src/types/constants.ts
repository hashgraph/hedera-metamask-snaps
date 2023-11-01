export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

// 3030 for hedera
export const DEFAULTCOINTYPE = 3030;

export const hederaNetworks: string[] = ['mainnet', 'testnet', 'previewnet'];

export const TUUMACCOUNTID = '0.0.633893';
export const TUUMEVMADDRESS = '0x7d871f006d97498ea338268a956af94ab2e65cdd';
