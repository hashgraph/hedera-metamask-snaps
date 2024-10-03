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
import { CallSmartContractFunctionCommand } from '../../commands/hscs/CallSmartContractFunctionCommand';
import type { TxRecord } from '../../types/hedera';
import type { CallSmartContractFunctionRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class CallSmartContractFunctionFacade {
  /**
   * Calls a function of a smart contract on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param callSmartContractFunctionParams - Parameters for calling a smart contract function.
   * @returns Receipt of the transaction.
   */
  public static async callSmartContractFunction(
    walletSnapParams: WalletSnapParams,
    callSmartContractFunctionParams: CallSmartContractFunctionRequestParams,
  ): Promise<TxRecord> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { contractId, functionName, functionParams, gas, payableAmount } =
      callSmartContractFunctionParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxRecord;
    try {
      const panelToShow = SnapUtils.initializePanelToShow();

      panelToShow.push(
        heading('Call a smart contract function'),
        text(
          `Learn more about calling smart contracts [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/call-a-smart-contract-function)`,
        ),
        text(
          `You are about to call a function of a smart contract with the following parameters:`,
        ),
        divider(),
        text(`Contract ID: ${contractId}`),
        text(`Max Gas: ${gas}`),
        text(`Function: ${functionName}`),
      );

      if (functionParams !== undefined) {
        const params = functionParams.map(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          (param) => `${param.type}: ${param.value}`,
        );
        panelToShow.push(text(`Function Parameters:`), text(params.join(', ')));
      }

      if (payableAmount !== undefined) {
        panelToShow.push(text(`Payable Amount: ${payableAmount} hbars`));
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
        const errMessage = 'User rejected the transaction';
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
      const command = new CallSmartContractFunctionCommand(
        contractId,
        functionName,
        functionParams,
        gas,
        payableAmount,
      );

      txReceipt = await command.execute(hederaClient.getClient());
      await SnapUtils.snapCreateDialogAfterTransaction(
        origin,
        network,
        mirrorNodeUrl,
        txReceipt,
      );
    } catch (error: any) {
      const errMessage = 'Error while trying to call a smart contract function';
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
