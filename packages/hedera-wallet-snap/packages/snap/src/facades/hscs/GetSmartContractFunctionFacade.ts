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
import type { DialogParams, NodeType } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { GetSmartContractFunctionCommand } from '../../commands/hscs/GetSmartContractFunctionCommand';
import type { GetSmartContractFunctionRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class GetSmartContractFunctionFacade {
  /**
   * Gets the result of a smart contract function call on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param getSmartContractFunctionParams - Parameters for calling a smart contract function.
   * @returns Result of the smart contract function call.
   */
  public static async getSmartContractFunction(
    walletSnapParams: WalletSnapParams,
    getSmartContractFunctionParams: GetSmartContractFunctionRequestParams,
  ): Promise<any> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { contractId, functionName, functionParams, gas, senderAccountId } =
      getSmartContractFunctionParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let result;
    try {
      const panelToShow: (
        | {
            value: string;
            type: NodeType.Heading;
          }
        | {
            value: string;
            type: NodeType.Text;
            markdown?: boolean | undefined;
          }
        | {
            type: NodeType.Divider;
          }
        | {
            value: string;
            type: NodeType.Copyable;
            sensitive?: boolean | undefined;
          }
      )[] = [];

      panelToShow.push(
        heading('Get a smart contract function result'),
        text(
          `Learn more about calling smart contract functions [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/get-a-smart-contract-function)`,
        ),
        text(
          `You are about to get the result of a smart contract function with the following parameters:`,
        ),
        divider(),
        text(`Contract ID: ${contractId}`),
        text(`Max Gas: ${gas}`),
        text(`Function: ${functionName}`),
      );

      if (functionParams !== undefined) {
        panelToShow.push(text(`Function Params: ${functionParams}`));
      }

      if (senderAccountId !== undefined) {
        panelToShow.push(text(`Sender Account ID: ${senderAccountId}`));
      }

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
      const command = new GetSmartContractFunctionCommand(
        contractId,
        functionName,
        functionParams,
        gas,
        senderAccountId,
      );

      result = await command.execute(hederaClient.getClient());
      console.log('result: ', JSON.stringify(result, null, 4));
    } catch (error: any) {
      const errMessage =
        'Error while trying to get the smart contract function result';
      console.error('Error occurred: %s', errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return result;
  }
}
