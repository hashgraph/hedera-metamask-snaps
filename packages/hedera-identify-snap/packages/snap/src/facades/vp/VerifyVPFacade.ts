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
import { IdentifySnapParams } from '../../types/state';
import { getVeramoAgent } from '../../veramo/agent';

export class VerifyVPFacade {
  /**
   * Function to verify VP.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async verifyVP(
    identifySnapParams: IdentifySnapParams,
    vp: VerifiablePresentation,
  ): Promise<boolean> {
    const { state } = identifySnapParams;

    // Get Veramo agent
    const agent = await getVeramoAgent(state);

    // Verify the verifiable presentation(VP)
    const result = await agent.verifyPresentation({
      presentation: vp,
    });
    if (result.verified === false) {
      console.log(
        'VP Verification Error: ',
        JSON.stringify(result.error, null, 4),
      );
    }
    return result.verified;
  }
}
