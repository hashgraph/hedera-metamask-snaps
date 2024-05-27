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
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { DeleteSmartContractCommand } from '../../commands/hscs/DeleteSmartContractCommand';
import type { TxReceipt } from '../../types/hedera';
import type { DeleteSmartContractRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class DeleteSmartContractFacade {
  /**
   * Deletes a smart contract on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param deleteSmartContractParams - Parameters for deleting a smart contract.
   * @returns Receipt of the transaction.
   */
  public static async deleteSmartContract(
    walletSnapParams: WalletSnapParams,
    deleteSmartContractParams: DeleteSmartContractRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { contractId, transferAccountId, transferContractId } =
      deleteSmartContractParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;
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
        heading('Delete a smart contract'),
        text(
          `Learn more about deleting smart contracts [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/delete-a-smart-contract)`,
        ),
        text(
          `You are about to delete a smart contract with the following parameters:`,
        ),
        divider(),
        text(`Contract ID: ${contractId}`),
      );

      if (transferAccountId !== undefined) {
        panelToShow.push(
          text(`Transfer Account ID:`),
          copyable(transferAccountId),
        );
      }
      if (transferContractId !== undefined) {
        panelToShow.push(
          text(`Transfer Contract ID:`),
          copyable(transferContractId),
        );
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
      const command = new DeleteSmartContractCommand(
        contractId,
        transferAccountId,
        transferContractId,
      );

      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = 'Error while trying to delete a smart contract';
      console.error('Error occurred: %s', errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
