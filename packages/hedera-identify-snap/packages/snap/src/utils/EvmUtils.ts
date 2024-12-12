/*-
 *
 * Hedera Identify Snap
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

export class EvmUtils {
  /**
   * Adds the prefix to the EVM address.
   * @param address - EVM Account address.
   * @returns EVM address.
   */
  public static ensure0xPrefix(address: string): string {
    let result = address;
    if (!address.startsWith('0x')) {
      result = `0x${address}`;
    }
    return result.toLowerCase();
  }

  /**
   * Get current chainId.
   * @returns Current chainId.
   */
  public static async getChainId(): Promise<string> {
    return (await ethereum.request({
      method: 'eth_chainId',
    })) as string;
  }

  public static convertChainIdFromHex = (chainId: string): string => {
    return parseInt(chainId, 16).toString();
  };
}
