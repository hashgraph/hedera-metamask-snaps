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

import { PublicAccountInfo } from '../../types/account';
import { IdentifySnapParams } from '../../types/state';

export class GetAccountInfoFacade {
  /**
   * Get account info such as address, did, public key, etc.
   *
   * @param identitySnapParams - Identity snap params.
   * @returns Public Account Info.
   */
  public static async getAccountInfo(
    identitySnapParams: IdentifySnapParams,
  ): Promise<PublicAccountInfo> {
    const { origin, state } = identitySnapParams;

    const publicAccountInfo: PublicAccountInfo = {
      metamaskAddress: state.currentAccount.metamaskEvmAddress,
      snapAddress: state.currentAccount.snapEvmAddress,
      did: state.currentAccount.identifier.did,
      method: state.currentAccount.method,
      hederaAccountId: state.currentAccount.hederaAccountId,
    };

    return publicAccountInfo;
  }
}
