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

import { Hbar, HbarUnit } from '@hashgraph/sdk';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  copyable,
  divider,
  heading,
  text,
  type DialogParams,
} from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { StakeHbarCommand } from '../commands/StakeHbarCommand';
import { SnapState } from '../snap/SnapState';
import type { MirrorStakingInfo, TxRecord } from '../types/hedera';
import type { StakeHbarRequestParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';
import { SnapUtils } from '../utils/SnapUtils';
import { Utils } from '../utils/Utils';

export class StakeHbarFacade {
  /**
   * Stake Hbar to either a nodeid or accountId.
   * @param walletSnapParams - Wallet snap params.
   * @param stakeHbarRequestParams - Parameters for staking Hbar.
   * @returns Receipt of the transaction.
   */

  public static async stakeHbar(
    walletSnapParams: WalletSnapParams,
    stakeHbarRequestParams: StakeHbarRequestParams,
  ): Promise<TxRecord> {
    const { origin, state } = walletSnapParams;

    const { nodeId = null, accountId = null } = stakeHbarRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let { stakedAccountId, stakedNodeId, declineStakingReward } =
      state.accountState[hederaEvmAddress][network].accountInfo.stakingInfo;

    let txReceipt = {} as TxRecord;

    try {
      const hasNodeId = nodeId !== null;
      const hasAccountId = accountId !== null;
      if (!hasNodeId && !hasAccountId) {
        // Unstake Hbar
        declineStakingReward = true;
      } else {
        // Stake Hbar
        declineStakingReward = false;
      }
      if (hasNodeId && accountId) {
        throw rpcErrors.methodNotSupported(
          'Cannot stake to both a node and an account',
        );
      }

      let stakingInfo: MirrorStakingInfo = {} as MirrorStakingInfo;
      if (hasNodeId) {
        const stakeInfo = await HederaUtils.getNodeStakingInfo(
          mirrorNodeUrl,
          nodeId,
        );
        if (stakeInfo.length === 0) {
          throw rpcErrors.methodNotSupported(
            `Node ID ${nodeId} does not exist`,
          );
        }
        stakingInfo = stakeInfo[0];
      }
      if (hasNodeId) {
        stakedNodeId = String(nodeId);
      }
      if (hasAccountId) {
        stakedAccountId = accountId;
      }

      const panelToShow = SnapUtils.initializePanelToShow();

      panelToShow.push(
        heading('Stake/Unstake HBAR'),
        text(
          'Refer to this [guide](https://docs.hedera.com/hedera/core-concepts/staking) for more information on staking HBAR',
        ),
        divider(),
      );

      // Handle unstaking Hbar
      if (!hasNodeId && !hasAccountId) {
        panelToShow.push(
          text(
            'You are about to unstake your HBAR so you will not be receiving any staking rewards from here on out.',
          ),
        );
      } else {
        // Handle staking Hbar
        panelToShow.push(
          text('You are about to stake your HBAR to the following:'),
        );
        panelToShow.push(divider());
        if (hasNodeId) {
          panelToShow.push(
            text(`Node Description: ${stakingInfo.description}`),
          );
          panelToShow.push(text(`Node ID: ${stakingInfo.node_id}`));
          panelToShow.push(
            text(`Node Account ID: ${stakingInfo.node_account_id}`),
          );
          const totalStake = Hbar.from(stakingInfo.stake, HbarUnit.Tinybar);
          panelToShow.push(text(`Total Stake: ${totalStake.toString()}`));
          panelToShow.push(
            text(
              `Staking Start: ${Utils.timestampToString(
                stakingInfo.staking_period.from,
              )}`,
            ),
          );
          panelToShow.push(
            text(
              `Staking End: ${Utils.timestampToString(
                stakingInfo.staking_period.to,
              )}`,
            ),
          );
        }
        if (hasAccountId) {
          panelToShow.push(text(`Account ID:`), copyable(accountId));
        }
        panelToShow.push(divider());
      }

      const dialogParamsForStakeHbar: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          mirrorNodeUrl,
          panelToShow,
        ),
      };

      /*       const dialogParamsForStakeHbar: DialogParams = {
        type: 'confirmation',
        content: (
          <StakeHbarUI
            origin={origin}
            network={network}
            mirrorNodeUrl={mirrorNodeUrl}
            nodeId={nodeId}
            accountId={accountId}
            stakingInfo={stakingInfo}
          />
        ),
      }; */
      const confirmed = await SnapUtils.snapDialog(dialogParamsForStakeHbar);
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
      const command = new StakeHbarCommand(nodeId, accountId);

      txReceipt = await command.execute(hederaClient.getClient());
      await SnapUtils.snapCreateDialogAfterTransaction(
        origin,
        network,
        mirrorNodeUrl,
        txReceipt,
      );

      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.stakingInfo.stakedAccountId = stakedAccountId;
      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.stakingInfo.stakedNodeId = stakedNodeId;
      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.stakingInfo.declineStakingReward = declineStakingReward;
      await SnapState.updateState(state);
    } catch (error: any) {
      const errMessage = `Error while trying to stake Hbar`;
      console.error('Error occurred: %s', errMessage, JSON.stringify(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
