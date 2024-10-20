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
import { IdentitySnapParams } from '../../interfaces';
import {
  ClearOptions,
  IDataManagerClearArgs,
  IDataManagerClearResult,
  IDataManagerQueryResult,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to delete all VCs.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcRequestParams - VC request params.
 */
export async function deleteAllVCs(
  identitySnapParams: IdentitySnapParams,
  vcRequestParams: IDataManagerClearArgs,
): Promise<IDataManagerClearResult[] | null> {
  const { origin, network, state, account } = identitySnapParams;
  const { options } = vcRequestParams || {};
  const { store = 'snap' } = options || {};
  const optionsFiltered = { store } as ClearOptions;

  // Get Veramo agent
  const agent = await getVeramoAgent(state);

  const accountState = await getAccountStateByCoinType(
    state,
    account.metamaskAddress,
  );
  const vcsToBeRemoved = (await agent.queryVC({
    filter: undefined,
    options: optionsFiltered,
    accessToken: accountState.accountConfig.identity.googleUserInfo.accessToken,
  })) as IDataManagerQueryResult[];

  const header = 'Delete all Verifiable Credentials';
  const prompt = `Are you sure you want to remove all your VCs from the store '${store}'?`;
  const description = `Note that this action cannot be reversed and you will need to recreate your VCs if you go through with it. Number of VCs to be removed is ${vcsToBeRemoved.length.toString()}`;
  const dialogParams: DialogParams = {
    type: 'confirmation',
    content: await generateVCPanel(
      origin,
      network,
      header,
      prompt,
      description,
      vcsToBeRemoved,
    ),
  };

  if (await snapDialog(dialogParams)) {
    // Remove all the Verifiable Credentials from the store
    return await agent.clearVCs({
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });
  }
  throw new Error('User rejected');
}
