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

import { DIDResolutionResult } from '@veramo/core';
import { IdentitySnapParams } from '../../interfaces';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Resolve DID.
 *
 * @param identitySnapParams - Identity snap params.
 * @param didUrl - DID url.
 */
export async function resolveDID(
  identitySnapParams: IdentitySnapParams,
  didUrl?: string,
): Promise<DIDResolutionResult | null> {
  const { state, account } = identitySnapParams;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  let did = didUrl;
  // GET DID if not exists
  if (!did) {
    did = account.identifier.did;
  }
  return await agent.resolveDid({
    didUrl: did,
  });
}
