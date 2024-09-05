import { HDNodeWallet, Mnemonic } from 'ethers';
import { DEFAULTCOINTYPE } from '../types/constants';

export const generateWallet = async (
  evmAddress: string,
): Promise<HDNodeWallet> => {
  const entropy = await snap.request({
    method: 'snap_getEntropy',
    params: {
      version: 1,
      salt: evmAddress,
    },
  });

  const nodeWallet = HDNodeWallet.fromMnemonic(
    Mnemonic.fromEntropy(entropy),
  ).derivePath(`m/44/${DEFAULTCOINTYPE}/0/0/0`);

  return nodeWallet;
};
