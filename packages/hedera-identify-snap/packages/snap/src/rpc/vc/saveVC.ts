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
import { W3CVerifiableCredential } from '@veramo/core';
import { IdentitySnapParams } from '../../interfaces';
import {
  IDataManagerQueryResult,
  IDataManagerSaveArgs,
  IDataManagerSaveResult,
  ISaveVC,
  SaveOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to save VC.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcSaveRequestParams - VC save request params.
 */
export async function saveVC(
  identitySnapParams: IdentitySnapParams,
  vcSaveRequestParams: IDataManagerSaveArgs,
): Promise<IDataManagerSaveResult[]> {
  const { origin, network, state, account } = identitySnapParams;

  const { data: verifiableCredentials, options } = vcSaveRequestParams || {};
  const { store = 'snap' } = options || {};

  const optionsFiltered = { store } as SaveOptions;

  // Get Veramo agent
  const agent = await getVeramoAgent(state);

  const header = 'Save Verifiable Credentials';
  const prompt = `Are you sure you want to save the following VCs in ${
    typeof store === 'string' ? store : store.join(', ')
  }?`;
  const description = `Number of VCs submitted is ${(
    verifiableCredentials as W3CVerifiableCredential[]
  ).length.toString()}`;

  const vcsWithMetadata: IDataManagerQueryResult[] = [];
  // Iterate through vcs
  (verifiableCredentials as W3CVerifiableCredential[]).forEach(
    function (vc, index) {
      vcsWithMetadata.push({
        data: vc,
        metadata: {
          id: `External VC #${(index + 1).toString()}`,
          store: 'snap',
        },
      });
    },
  );
  const dialogParams: DialogParams = {
    type: 'confirmation',
    content: await generateVCPanel(
      origin,
      network,
      header,
      prompt,
      description,
      vcsWithMetadata,
    ),
  };

  if (await snapDialog(dialogParams)) {
    // Save the Verifiable Credential
    const accountState = await getAccountStateByCoinType(
      state,
      account.metamaskAddress,
    );

    const filteredCredentials: W3CVerifiableCredential[] = (
      verifiableCredentials as W3CVerifiableCredential[]
    ).filter((x: W3CVerifiableCredential) => {
      const vcObj = JSON.parse(JSON.stringify(x));

      const subjectDid: string = vcObj.credentialSubject.id;
      const subjectAccount = subjectDid.split(':')[4];
      return account.metamaskAddress === subjectAccount;
    });
    return await agent.saveVC({
      data: (filteredCredentials as W3CVerifiableCredential[]).map(
        (x: W3CVerifiableCredential) => {
          return { vc: x } as ISaveVC;
        },
      ) as ISaveVC[],
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });
  }

  throw new Error('User rejected');
}
