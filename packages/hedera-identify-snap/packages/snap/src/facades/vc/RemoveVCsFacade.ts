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

import { rpcErrors } from '@metamask/rpc-errors';
import { DialogParams } from '@metamask/snaps-sdk';
import {
  ClearOptions,
  DeleteOptions,
  IDataManagerClearArgs,
  IDataManagerClearResult,
  IDataManagerDeleteArgs,
  IDataManagerDeleteResult,
  IDataManagerQueryResult,
} from '../../plugins/veramo/verifiable-creds-manager';
import { IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { getVeramoAgent } from '../../veramo/agent';

export class RemoveVCsFacade {
  /**
   * Function to remove VCs.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async removeSpecificVC(
    identifySnapParams: IdentifySnapParams,
    vcRequestParams: IDataManagerDeleteArgs,
  ): Promise<IDataManagerDeleteResult[]> {
    const { state } = identifySnapParams;
    const { snapEvmAddress, network } = state.currentAccount;

    const { id = '', options } = vcRequestParams || {};
    const { store = 'snap' } = options || {};
    const optionsFiltered = { store } as DeleteOptions;

    const ids = typeof id === 'string' ? [id] : id;
    if (ids.length === 0) {
      console.error('No VC IDs provided');
      return [] as IDataManagerDeleteResult[];
    }

    // Get Veramo agent
    const agent = await getVeramoAgent(state);

    const accountState = state.accountState[snapEvmAddress][network];
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
      content: await SnapUtils.generateVCPanel(
        origin,
        network,
        header,
        prompt,
        description,
        vcsToBeRemoved,
      ),
    };

    const confirmed = await SnapUtils.snapDialog(dialogParams);
    if (!confirmed) {
      const errMessage = 'User rejected the transaction';
      console.error(errMessage);
      throw rpcErrors.transactionRejected(errMessage);
    }

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

  /**
   * Function to remove all the VCs.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async removeAllVCs(
    identifySnapParams: IdentifySnapParams,
    vcRequestParams: IDataManagerClearArgs,
  ): Promise<IDataManagerClearResult[]> {
    const { state } = identifySnapParams;
    const { snapEvmAddress, network } = state.currentAccount;

    const { options } = vcRequestParams || {};
    const { store = 'snap' } = options || {};
    const optionsFiltered = { store } as ClearOptions;

    // Get Veramo agent
    const agent = await getVeramoAgent(state);

    const accountState = state.accountState[snapEvmAddress][network];
    const vcsToBeRemoved = (await agent.queryVC({
      filter: undefined,
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    })) as IDataManagerQueryResult[];

    const header = 'Delete all Verifiable Credentials';
    const prompt = `Are you sure you want to remove all your VCs from the store '${store}'?`;
    const description = `Note that this action cannot be reversed and you will need to recreate your VCs if you go through with it. Number of VCs to be removed is ${vcsToBeRemoved.length.toString()}`;
    const dialogParams: DialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateVCPanel(
        origin,
        network,
        header,
        prompt,
        description,
        vcsToBeRemoved,
      ),
    };

    const confirmed = await SnapUtils.snapDialog(dialogParams);
    if (!confirmed) {
      const errMessage = 'User rejected the transaction';
      console.error(errMessage);
      throw rpcErrors.transactionRejected(errMessage);
    }

    // Remove all the Verifiable Credentials from the store
    return await agent.clearVCs({
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });
  }
}
