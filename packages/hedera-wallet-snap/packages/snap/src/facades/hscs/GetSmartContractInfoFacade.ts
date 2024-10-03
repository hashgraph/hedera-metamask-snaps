/*-
 *
 * Hedera Wallet Snap
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
import type { DialogParams } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { GetSmartContractInfoCommand } from '../../commands/hscs/GetSmartContractInfoCommand';
import type { GetSmartContractInfoResult } from '../../types/hedera';
import type { GetSmartContractDetailsRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class GetSmartContractInfoFacade {
  /**
   * Gets the info of a smart contract on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param getSmartContractInfoParams - Parameters for getting the smart contract info.
   * @returns Info of the smart contract.
   */
  public static async getSmartContractInfo(
    walletSnapParams: WalletSnapParams,
    getSmartContractInfoParams: GetSmartContractDetailsRequestParams,
  ): Promise<GetSmartContractInfoResult> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { contractId } = getSmartContractInfoParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let info = {} as GetSmartContractInfoResult;
    try {
      const panelToShow = [
        heading('Get smart contract info'),
        text(
          `Learn more about getting smart contract info [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/get-smart-contract-info)`,
        ),
        text(
          `You are about to get the info of a smart contract with the following parameters:`,
        ),
        divider(),
        text(`Contract ID: ${contractId}`),
      ];

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          mirrorNodeUrl,
          panelToShow,
        ),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        const errMessage = 'User rejected the query';
        console.error(errMessage);
        throw rpcErrors.transactionRejected(errMessage);
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw rpcErrors.resourceUnavailable('hedera client returned null');
      }
      const command = new GetSmartContractInfoCommand(contractId);

      info = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = 'Error while trying to get the smart contract info';
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return info;
  }
}
