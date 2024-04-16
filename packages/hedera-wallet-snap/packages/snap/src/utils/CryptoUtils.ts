/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import { PublicKey } from '@hashgraph/sdk';
import { HDNodeWallet, Mnemonic, assertArgument, ethers } from 'ethers';
import { DEFAULTCOINTYPE } from '../types/constants';
import type { MirrorNftInfo, MirrorTokenInfo } from '../types/hedera';
import { type FetchResponse, FetchUtils } from './FetchUtils';

export class CryptoUtils {
  /**
   * Derives a wallet from the provided node using the provided path.
   * NOTE: This method is a copy of the 'derivePath' method from the 'ethers' library as that method
   * changed in the recent version and the new method does not work as expected.
   * @param node - The node to derive the wallet from.
   * @param path - The path to use for derivation.
   * @returns The derived HDNodeWallet.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static derivePathForWallet(
    node: HDNodeWallet,
    path: string,
  ): HDNodeWallet {
    const components = path.split('/');

    assertArgument(
      components.length > 0 && (components[0] === 'm' || node.depth > 0),
      'invalid path',
      'path',
      path,
    );

    if (components[0] === 'm') {
      components.shift();
    }

    let result: HDNodeWallet = node;

    const HardenedBit = 0x80000000;
    for (let i = 0; i < components.length; i++) {
      const component = components[i];

      if (component.match(/^[0-9]+'$/u)) {
        const index = parseInt(
          component.substring(0, component.length - 1),
          10,
        );

        assertArgument(
          index < HardenedBit,
          'invalid path index',
          `path[${i}]`,
          component,
        );
        result = result.deriveChild(HardenedBit + index);
      } else if (component.match(/^[0-9]+$/u)) {
        const index = parseInt(component, 10);
        assertArgument(
          index < HardenedBit,
          'invalid path index',
          `path[${i}]`,
          component,
        );
        result = result.deriveChild(index);
      } else {
        assertArgument(
          false,
          'invalid path component',
          `path[${i}]`,
          component,
        );
      }
    }

    return result;
  }

  /**
   * Generates a wallet using the provided EVM address to generate entropy.
   * @param evmAddress - The EVM address used as salt for entropy.
   * @returns A promise that resolves to an HDNodeWallet.
   */
  public static async generateWallet(
    evmAddress: string,
  ): Promise<HDNodeWallet> {
    const entropy = await snap.request({
      method: 'snap_getEntropy',
      params: {
        version: 1,
        salt: evmAddress,
      },
    });

    let nodeWallet = HDNodeWallet.fromMnemonic(Mnemonic.fromEntropy(entropy));
    nodeWallet = CryptoUtils.derivePathForWallet(
      nodeWallet,
      `m/44/${DEFAULTCOINTYPE}/0/0/0`,
    );

    return nodeWallet;
  }

  /**
   * Checks whether the provided key is a valid Ethereum public key.
   * @param key - The public key to check.
   * @returns True if the key is valid, false otherwise.
   */
  public static isValidEthereumPublicKey(key: string): boolean {
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
  }

  /**
   * Checks whether the provided key is a valid Hedera public key.
   * @param key - The public key to check.
   * @returns True if the key is valid, false otherwise.
   */
  public static isValidHederaPublicKey(key: string): boolean {
    try {
      PublicKey.fromString(key);
    } catch (error: any) {
      return false;
    }
    return true;
  }

  /**
   * Converts a string to a Uint8Array.
   * @param data - The string to convert.
   * @returns The converted Uint8Array.
   */
  public static stringToUint8Array(data: string): Uint8Array {
    const encoder = new TextEncoder(); // The TextEncoder encodes into UTF-8 by default
    const uint8Array = encoder.encode(data);
    return uint8Array;
  }

  /**
   * Converts a Uint8Array to a hexadecimal string.
   * @param data - The Uint8Array to convert.
   * @returns The hexadecimal string.
   */
  public static uint8ArrayToHex(data: Uint8Array | null | undefined): string {
    if (!data) {
      return '';
    }
    return data.reduce(
      (str, byte) => str + byte.toString(16).padStart(2, '0'),
      '',
    );
  }

  /**
   * Converts a hexadecimal string to a Uint8Array.
   * @param data - The hexadecimal string to convert.
   * @returns The Uint8Array.
   */
  public static hexToUInt8Array(data: string): Uint8Array {
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
  }

  public static async GetNftSerialNumber(
    tokenId: string,
    accountId: string,
    mirrorNodeUrl: string,
  ): Promise<MirrorNftInfo[]> {
    let result = [] as MirrorNftInfo[];
    const url = `${mirrorNodeUrl}/api/v1/tokens/${encodeURIComponent(tokenId)}/nfts?account.id=${encodeURIComponent(accountId)}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (response.success) {
      result = response.data.nfts;
    }
    return result;
  }

  public static async getTokenById(
    tokenId: string,
    mirrorNodeUrl: string,
  ): Promise<MirrorTokenInfo> {
    let result = {} as MirrorTokenInfo;
    const url = `${mirrorNodeUrl}/api/v1/tokens/${encodeURIComponent(tokenId)}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (response.success) {
      result = response.data;
    }
    return result;
  }
}
