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

import { DialogParams } from '@metamask/snaps-sdk';
import {
  ProofFormat,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core';
import {
  IDataManagerQueryResult,
  QueryOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import {
  CreateVPOptions,
  CreateVPRequestParams,
  ProofInfo,
} from '../../types/params';
import { IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { getVeramoAgent } from '../../veramo/agent';

export class CreateVPFacade {
  /**
   * Function to create vp.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async createVP(
    identitySnapParams: IdentifySnapParams,
    vpRequestParams: CreateVPRequestParams,
  ): Promise<VerifiablePresentation> {
    const { state } = identitySnapParams;
    const { network, identifier } = state.currentAccount;

    const {
      vcIds = [],
      vcs = [],
      proofInfo = {} as ProofInfo,
      options,
    } = vpRequestParams || {};
    const { store = 'snap' } = options || {};
    const optionsFiltered = { store } as CreateVPOptions;

    const proofFormat = proofInfo?.proofFormat
      ? proofInfo.proofFormat
      : ('jwt' as ProofFormat);
    const type = proofInfo?.type ? proofInfo.type : 'Custom';
    const domain = proofInfo?.domain;
    const challenge = proofInfo?.challenge;

    // Get Veramo agent
    const agent = await getVeramoAgent(state);

    // GET DID
    const { did } = identifier;

    const vcsRes: VerifiableCredential[] = [];
    const vcsWithMetadata: IDataManagerQueryResult[] = [];

    // Iterate through vcIds
    for (const vcId of vcIds) {
      const vcObj = (await agent.queryVC({
        filter: {
          type: 'id',
          filter: vcId,
        },
        options: optionsFiltered as QueryOptions,
      })) as IDataManagerQueryResult[];

      if (vcObj.length > 0) {
        const { data, metadata } = vcObj[0];
        vcsRes.push(data as VerifiableCredential);
        vcsWithMetadata.push({
          data,
          metadata,
        });
      }
    }

    // Iterate through vcs
    vcs.forEach(function (vc, index) {
      vcsRes.push(vc as VerifiableCredential);
      vcsWithMetadata.push({
        data: vc,
        metadata: {
          id: `External VC #${(index + 1).toString()}`,
          store: 'snap',
        },
      });
    });

    if (vcsRes.length === 0) {
      console.error('No VCs found to create VP');
      return {} as VerifiablePresentation;
    }

    const header = 'Create Verifiable Presentation';
    const prompt = 'Do you wish to create a VP from the following VCs?';
    const description =
      'A Verifiable Presentation is a secure way for someone to present information about themselves or their identity to someone else while ensuring that the information is accureate and trustworthy';
    const dialogParams: DialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateVCPanel(
        origin,
        network,
        header,
        prompt,
        description,
        vcsWithMetadata,
      ),
    };

    if (
      state.snapConfig.dApp.disablePopups ||
      (await SnapUtils.snapDialog(dialogParams))
    ) {
      // Generate a Verifiable Presentation from VCs
      return await agent.createVerifiablePresentation({
        presentation: {
          holder: did, //
          type: ['VerifiablePresentation', type],
          verifiableCredential: vcsRes,
        },
        proofFormat, // The desired format for the VerifiablePresentation to be created
        domain, // Optional string domain parameter to add to the verifiable presentation
        challenge, // Optional (only JWT) string challenge parameter to add to the verifiable presentation
      });
    }

    console.error('User rejected the transaction');
    return {} as VerifiablePresentation;
  }
}
