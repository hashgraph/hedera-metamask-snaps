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
  DeleteOptions,
  IDataManagerDeleteArgs,
  IDataManagerDeleteResult,
  IDataManagerQueryResult,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to remove VC.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcRequestParams - VC request params.
 */
export async function removeVC(
  identitySnapParams: IdentitySnapParams,
  vcRequestParams: IDataManagerDeleteArgs,
): Promise<IDataManagerDeleteResult[] | null> {
  const { origin, network, state, account } = identitySnapParams;

  const { id = '', options } = vcRequestParams || {};
  const { store = 'snap' } = options || {};
  const optionsFiltered = { store } as DeleteOptions;

  // Get Veramo agent
  const agent = await getVeramoAgent(state);

  const ids = typeof id === 'string' ? [id] : id;
  if (ids.length === 0) {
    return null;
  }

  const accountState = await getAccountStateByCoinType(
    state,
    account.metamaskAddress,
  );
  const vcsToBeRemoved: IDataManagerQueryResult[] = [];
  for (const vcId of ids) {
    const vcs = (await agent.queryVC({
      filter: {
        type: 'id',
        filter: vcId,
      },
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    })) as IDataManagerQueryResult[];
    if (vcs.length > 0) {
      vcsToBeRemoved.push(vcs[0]);
    }
  }

  const header = 'Remove specific Verifiable Credentials';
  const prompt = 'Are you sure you want to remove the following VCs?';
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
    // Remove the specified Verifiable Credentials from the store based on their IDs
    return Promise.all(
      ids.map(async (_id: string) => {
        return await agent.deleteVC({
          id: _id,
          options: optionsFiltered,
          accessToken:
            accountState.accountConfig.identity.googleUserInfo.accessToken,
        });
      }),
    ).then((data: IDataManagerDeleteResult[][]) => {
      return data.flat();
    });
  }
  throw new Error('User rejected');
}
