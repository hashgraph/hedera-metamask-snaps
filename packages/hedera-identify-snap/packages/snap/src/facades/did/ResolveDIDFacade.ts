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

    let did = didUrl;
    // GET DID if not exists
    if (!did) {
      did = state.currentAccount.identifier.did;
    }

    let result = {};
    if (state.currentAccount.method === 'did:hedera') {
      const agent = await getVeramoAgent(state);
      const didResolve = await agent.resolveDid({ didUrl: did });
      result = JSON.parse(JSON.stringify(didResolve));
    } else {
      const response = await fetch(
        `https://dev.uniresolver.io/1.0/identifiers/${did}`,
      );
      result = await response.json();
    }

    return result;
  }
}
