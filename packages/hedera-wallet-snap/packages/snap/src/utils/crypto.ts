/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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

/**
 * Converts string to a uint8 array.
 *
 * @param data - Message to convert.
 * @returns Converted value.
 */
export const stringToUint8Array = (data: string): Uint8Array => {
  // Use TextEncoder to convert the string to UTF-8 encoding
  const encoder = new TextEncoder(); // The TextEncoder encodes into UTF-8 by default
  const uint8Array = encoder.encode(data);
  return uint8Array;
};

/**
 * Converts uint8 array to a hex string.
 *
 * @param data - Data to convert.
 * @returns Converted value.
 */
export const uint8ArrayToHex = (
  data: Uint8Array | null | undefined,
): string => {
  if (!data) {
    return '';
  }
  return data.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    '',
  );
};

/**
 * Converts hex string to an uint8 array.
 *
 * @param data - Data to convert.
 * @returns Converted value.
 */
export const hexToUInt8Array = (data: string): Uint8Array => {
  let hexString = data;
  // Remove the '0x' prefix if it exists
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }

  // Ensure the hex string has an even length
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  // Convert the hex string to a byte array
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }

  return byteArray;
};
