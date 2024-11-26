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

import { IdentifySnapParams } from '../../types/state';
import { getVeramoAgent } from '../../veramo/agent';

export class ResolveDIDFacade {
  /**
   * Function to toggle popups.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async resolveDID(
    identitySnapParams: IdentifySnapParams,
    didUrl?: string,
  ): Promise<any> {
    const { state } = identitySnapParams;

    const agent = await getVeramoAgent(state);

    let did = didUrl;
    // GET DID if not exists
    if (!did) {
      did = state.currentAccount.identifier.did;
    }
    let result = {};

    if (state.snapConfig.dApp.didMethod === 'did:key') {
      let publicKeyFormat = 'EcdsaSecp256k1VerificationKey2020';
      if (
        state.accountState[state.currentAccount.snapEvmAddress][
          state.currentAccount.network
        ].keyStore.curve.toLowerCase() === 'ed25519'
      ) {
        publicKeyFormat = 'Ed25519VerificationKey2020';
      }
      result = await agent.resolveDid({
        didUrl: did,
        options: { publicKeyFormat },
      });
    } else {
      result = await agent.resolveDid({ didUrl: did });
    }

    return JSON.parse(JSON.stringify(result));
  }
}
