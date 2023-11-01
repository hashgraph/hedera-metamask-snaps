import { HDNodeWallet, Mnemonic, ethers } from 'ethers';
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

/**
 * Checks whether the key is a valid public key.
 *
 * @param key - Public Key.
 * @returns True/False.
 */
export const isValidEthereumPublicKey = (key: string): boolean => {
  let publicKey: string = key;
  // Check if the key has the '0x' prefix
  if (!publicKey.startsWith('0x')) {
    publicKey = `0x${publicKey}`;
  }

  // Check if the key is a compressed (66 characters) or uncompressed (130 characters) public key
  return (
    (publicKey.length === 68 || publicKey.length === 130) &&
    ethers.isHexString(publicKey)
  );
};
