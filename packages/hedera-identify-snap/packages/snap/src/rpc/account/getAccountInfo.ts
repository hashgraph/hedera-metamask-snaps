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

import { validHederaChainID } from '../../hedera/config';
import {
  HederaAccountParams,
  IdentitySnapParams,
  PublicAccountInfo,
} from '../../interfaces';
import { getCurrentNetwork } from '../../snap/network';
import { getHederaAccountIfExists } from '../../utils/params';

/**
 * Get account info such as address, did, public key, etc.
 *
 * @param identitySnapParams - Identity snap params.
 * @returns Public Account Info.
 */
export async function getAccountInfo(
  identitySnapParams: IdentitySnapParams,
): Promise<PublicAccountInfo> {
  const { state, account } = identitySnapParams;

  const publicAccountInfo: PublicAccountInfo = {
    evmAddress: account.evmAddress,
    did: account.identifier.did,
    method: account.method,
  };
  const chainId = await getCurrentNetwork(ethereum);

  if (validHederaChainID(chainId)) {
    let accountId = '';
    if (account.extraData) {
      accountId = (account.extraData as HederaAccountParams).accountId;
    }

    if (!accountId) {
      accountId = await getHederaAccountIfExists(
        state,
        undefined,
        account.evmAddress,
      );
    }

    if (accountId) {
      publicAccountInfo.extraData = {
        accountId,
      } as HederaAccountParams;
    }
  }

  console.log(JSON.stringify(publicAccountInfo, null, 4));
  return publicAccountInfo;
}
