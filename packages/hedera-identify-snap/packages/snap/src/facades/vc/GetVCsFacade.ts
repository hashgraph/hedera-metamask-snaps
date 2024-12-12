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
  IDataManagerQueryArgs,
  IDataManagerQueryResult,
  QueryOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { getVeramoAgent } from '../../veramo/agent';

export class GetVCsFacade {
  /**
   * Function to get VCs.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async getVCs(
    identifySnapParams: IdentifySnapParams,
    vcRequestParams: IDataManagerQueryArgs,
  ): Promise<IDataManagerQueryResult[]> {
    const { state } = identifySnapParams;
    const { snapEvmAddress, network, identifier } = state.currentAccount;

    const { filter, options } = vcRequestParams || {};
    const { store = 'snap', returnStore = true } = options || {};

    // Get Veramo agent
    const agent = await getVeramoAgent(state);

    // Get VCs
    const accountState = state.accountState[snapEvmAddress][network];
    const optionsFiltered = { store, returnStore } as QueryOptions;
    const vcs = (await agent.queryVC({
      filter,
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    })) as IDataManagerQueryResult[];

    const header = 'Retrieve Verifiable Credentials';
    const prompt = 'Are you sure you want to send VCs to the dApp?';
    const description = `Some dApps are less secure than others and could save data from VCs against your will. Be careful where you send your private VCs! Number of VCs submitted is ${vcs.length.toString()}`;
    const dialogParams: DialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateVCPanel(
        origin,
        network,
        header,
        prompt,
        description,
        vcs,
      ),
    };

    if (
      state.snapConfig.dApp.disablePopups ||
      (await SnapUtils.snapDialog(dialogParams))
    ) {
      return vcs;
    }

    return [];
  }
}
