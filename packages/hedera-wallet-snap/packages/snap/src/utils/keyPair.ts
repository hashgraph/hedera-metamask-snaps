/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
