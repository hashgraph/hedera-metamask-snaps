import { isIn } from '../types/constants';

const hederaChainIDs: Record<string, string> = {
  '0x127': 'mainnet',
  '0x128': 'testnet',
  '0x129': 'previewnet',
};

export const getHederaNetwork = (chainId: string): string => {
  const network = hederaChainIDs[chainId];
  return network || 'mainnet';
};

export const validHederaChainID = (x: string) => {
  return isIn(Object.keys(hederaChainIDs) as string[], x);
};
