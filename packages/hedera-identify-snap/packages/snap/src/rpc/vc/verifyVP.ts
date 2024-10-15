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

import { VerifiablePresentation } from '@veramo/core';
import { IdentitySnapParams } from '../../interfaces';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to verify VP.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vp - Verifiable Presentation.
 */
export async function verifyVP(
  identitySnapParams: IdentitySnapParams,
  vp: VerifiablePresentation,
): Promise<boolean | null> {
  const { state } = identitySnapParams;
  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  // Verify the verifiable presentation(VP)
  const result = await agent.verifyPresentation({
    presentation: vp,
  });
  if (result.verified === false) {
    console.log('result: ', JSON.stringify(result, null, 4));
    console.log(
      'VP Verification Error: ',
      JSON.stringify(result.error, null, 4),
    );
  }
  return result.verified;
}
