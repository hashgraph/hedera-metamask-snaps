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
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { CreateSmartContractCommand } from '../../commands/hscs/CreateSmartContractCommand';
import type { TxRecord } from '../../types/hedera';
import type { CreateSmartContractRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class CreateSmartContractFacade {
  /**
   * Creates a new smart contract on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param createSmartContractParams - Parameters for creating a smart contract.
   * @returns Receipt of the transaction.
   */
  public static async createSmartContract(
    walletSnapParams: WalletSnapParams,
    createSmartContractParams: CreateSmartContractRequestParams,
  ): Promise<TxRecord> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const {
      gas,
      bytecode,
      initialBalance,
      adminKey,
      constructorParameters,
      contractMemo,
      stakedNodeId,
      stakedAccountId,
      declineStakingReward,
      autoRenewAccountId,
      autoRenewPeriod,
      maxAutomaticTokenAssociations,
    } = createSmartContractParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxRecord;
    try {
      const panelToShow = SnapUtils.initializePanelToShow();

      panelToShow.push(
        heading('Create a new smart contract'),
        text(
          `Learn more about creating smart contracts [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/create-a-smart-contract)`,
        ),
        text(
          `You are about to create a new smart contract with the following parameters:`,
        ),
        divider(),
        text(`Max Gas to use: ${gas}`),
        text(`Bytecode: ${bytecode.length} bytes`),
      );

      if (initialBalance !== undefined) {
        panelToShow.push(text(`Initial Balance: ${initialBalance} hbars`));
      }
      if (adminKey !== undefined) {
        panelToShow.push(text(`Admin Key:`), copyable(adminKey));
      }
      if (constructorParameters !== undefined) {
        const params = constructorParameters.map(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          (param) => `${param.type}: ${param.value}`,
        );
        panelToShow.push(
          text(`Constructor Parameters:`),
          text(params.join(', ')),
        );
      }
      if (contractMemo !== undefined) {
        panelToShow.push(text(`Contract Memo: ${contractMemo}`));
      }
      if (stakedNodeId !== undefined) {
        panelToShow.push(
          text(`Staked Node ID:`),
          copyable(stakedNodeId.toString()),
        );
      }
      if (stakedAccountId !== undefined) {
        panelToShow.push(text(`Staked Account ID:`), copyable(stakedAccountId));
      }
      if (declineStakingReward !== undefined) {
        panelToShow.push(
          text(`Decline Staking Reward: ${declineStakingReward}`),
        );
      }
      if (autoRenewAccountId !== undefined) {
        panelToShow.push(
          text(`Auto Renew Account ID:`),
          copyable(autoRenewAccountId),
        );
      }
      if (autoRenewPeriod !== undefined) {
        panelToShow.push(text(`Auto Renew Period: ${autoRenewPeriod}`));
      }
      if (maxAutomaticTokenAssociations !== undefined) {
        panelToShow.push(
          text(
            `Max Automatic Token Associations: ${maxAutomaticTokenAssociations}`,
          ),
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
      const command = new CreateSmartContractCommand(
        gas,
        bytecode,
        initialBalance,
        adminKey,
        constructorParameters,
        contractMemo,
        stakedNodeId,
        stakedAccountId,
        declineStakingReward,
        autoRenewAccountId,
        autoRenewPeriod,
        maxAutomaticTokenAssociations,
      );

      txReceipt = await command.execute(hederaClient.getClient());
      await SnapUtils.snapCreateDialogAfterTransaction(
        origin,
        network,
        mirrorNodeUrl,
        txReceipt,
      );
    } catch (error: any) {
      const errMessage = 'Error while trying to create a smart contract';
      console.error('Error occurred: %s', errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
