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

import { PrivateKey } from '@hashgraph/sdk';
import { HcsDid } from '@tuum-tech/hedera-did-sdk-js';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { ECDSA_SECP256K1_KEY_TYPE } from '../../constants';
import { IdentifyAccountState, IdentifySnapState } from '../../types/state';
import { HederaUtils } from '../../utils/HederaUtils';

export function getDidHederaIdentifier(
  accountState: IdentifyAccountState,
  didMethod: string,
): string {
  // Check if the 'identifiers' key exists in the accountState object
  if ('identifiers' in accountState) {
    const identifiers = accountState.identifiers; // Access the 'identifiers' object

    // Iterate over the keys in 'identifiers'
    for (const key in identifiers) {
      const identifier = identifiers[key];
      if (identifier.provider === didMethod) {
        // Extract the part after the last colon
        const strippedKey = key.split(':').pop() || ''; // Get the last part of the key
        return strippedKey;
      }
    }
  }
  return '';
}

export async function getHcsDidClient(
  state: IdentifySnapState,
): Promise<HcsDid | null> {
  try {
    const { currentAccount } = state;

    const accountState =
      state.accountState[currentAccount.snapEvmAddress][currentAccount.network];
    if (!accountState) {
      throw new Error('Account state is missing or invalid');
    }

    const { hederaNetwork } = HederaUtils.getHederaNetworkInfo(
      currentAccount.network,
    );

    const hederaClientFactory = new HederaClientImplFactory(
      accountState.keyStore.hederaAccountId,
      hederaNetwork,
      accountState.keyStore.curve,
      accountState.keyStore.privateKey,
    );
    const client = await hederaClientFactory.createClient();
    if (!client) {
      console.error('Failed to create Hedera client');
      return null;
    }

    return new HcsDid({
      network: hederaNetwork,
      privateKey:
        accountState.keyStore.curve === ECDSA_SECP256K1_KEY_TYPE
          ? PrivateKey.fromStringECDSA(accountState.keyStore.privateKey)
          : PrivateKey.fromStringED25519(accountState.keyStore.privateKey),
      privateKeyCurve: accountState.keyStore.curve,
      client: client.getClient(),
    });
  } catch (e: any) {
    console.error(`Failed to setup HcsDid client: ${e.message}`, e);
    return null;
  }
}
