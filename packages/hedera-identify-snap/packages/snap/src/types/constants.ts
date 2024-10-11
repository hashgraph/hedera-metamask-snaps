import { ProofFormat } from '@veramo/core';

export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

export const availableVCStores = ['snap', 'googleDrive'] as const;
export const isValidVCStore = (x: string) => isIn(availableVCStores, x);

export const availableMethods = ['did:pkh'] as const;
export const isValidMethod = (x: string) => isIn(availableMethods, x);

// 60 for ethereum and 3030 for hedera
export const DEFAULTCOINTYPE = 60;
export const HEDERACOINTYPE = 3030;

export const availableProofFormats = [
  'jwt' as ProofFormat,
  'lds' as ProofFormat,
  'EthereumEip712Signature2021' as ProofFormat,
] as const;
export const isValidProofFormat = (x: string) => isIn(availableProofFormats, x);
