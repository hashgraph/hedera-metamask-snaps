export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

const hederaChainIDs = new Map([
  ['0x127', 'mainnet'],
  ['0x128', 'testnet'],
  ['0x129', 'previewnet'],
  ['0x12a', 'localnet'],
]);

export const getHederaNetwork = (chainId: string): string => {
  const network = hederaChainIDs.get(chainId);
  return network || 'mainnet';
};

export const validHederaChainID = (x: string) =>
  isIn(Array.from(hederaChainIDs.keys()), x);

const evmChainIDs = new Map([
  ['0x1', 'Ethereum Mainnet'],
  ['0x89', 'Polygon Mainnet'],
  ['0xa4b1', 'Arbitrum One'],
  ['0xa', 'Optimism'],
  ['0x38', 'Binance Smart Chain Mainnet'],
  ['0xe', 'Flare Mainnet'],
  ['0x13', 'Songbird Canary-Network'],
  ['0x13a', 'Filecoin - Mainnet'],
  ['0x2329', 'Evmos'],
  ['0x14', 'Elastos Smart Chain'],
  ['0x5', 'Goerli Testnet'],
]);

const validEVMChainID = (x: string) => isIn(Array.from(evmChainIDs.keys()), x);

export const getNetwork = (chainId: string): string => {
  if (chainId) {
    if (validHederaChainID(chainId)) {
      return `Hedera - ${getHederaNetwork(chainId)}`;
    } else if (validEVMChainID(chainId)) {
      return `EVM Chain - ${evmChainIDs.get(chainId)}`;
    }
    return `EVM Chain - Chain Id: ${chainId}`;
  }
  return '';
};
