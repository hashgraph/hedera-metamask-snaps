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
import { providerErrors } from '@metamask/rpc-errors';
import { DialogParams, divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { StakeHbarCommand } from '../commands/StakeHbarCommand';
import { SnapState } from '../snap/SnapState';
import type { TxReceipt } from '../types/hedera';
import type { StakeHbarRequestParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';
import { SnapUtils } from '../utils/SnapUtils';
import { Utils } from '../utils/Utils';

export class StakeHbarFacade {
  /**
   * Stake Hbar to either a nodeid or accountId.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param stakeHbarRequestParams - Parameters for staking Hbar.
   * @returns Receipt of the transaction.
   */

  public static async stakeHbar(
    walletSnapParams: WalletSnapParams,
    stakeHbarRequestParams: StakeHbarRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { nodeId = null, accountId = null } = stakeHbarRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let { stakedAccountId, stakedNodeId, declineStakingReward } =
      state.accountState[hederaEvmAddress][network].accountInfo.stakingInfo;

    let txReceipt = {} as TxReceipt;

    try {
      const panelToShow = [
        heading('Stake/Unstake HBAR'),
        text(
          'Refer to this [guide](https://docs.hedera.com/hedera/core-concepts/staking) for more information on staking HBAR',
        ),
        divider(),
      ];

      // Handle unstaking Hbar
      if (_.isNull(nodeId) && _.isNull(accountId)) {
        panelToShow.push(
          text(
            'You are about to unstake your HBAR so you will not be receiving any staking rewards from here on out.',
          ),
        );
        declineStakingReward = true;
      } else {
        if (!_.isNull(nodeId) && !_.isNull(accountId)) {
          throw providerErrors.unsupportedMethod(
            'Cannot stake to both a node and an account',
          );
        }
        // Handle staking Hbar
        panelToShow.push(
          text('You are about to stake your HBAR to the following:'),
        );
        panelToShow.push(divider());
        if (!_.isNull(nodeId)) {
          const stakingInfo = await HederaUtils.getNodeStakingInfo(
            mirrorNodeUrl,
            nodeId,
          );
          if (stakingInfo.length === 0) {
            throw providerErrors.unsupportedMethod(
              `Node ID ${nodeId} does not exist`,
            );
          }
          panelToShow.push(
            text(`Node Description: ${stakingInfo[0].description}`),
          );
          panelToShow.push(text(`Node ID: ${stakingInfo[0].node_id}`));
          panelToShow.push(
            text(`Node Account ID: ${stakingInfo[0].node_account_id}`),
          );
          const totalStake = Hbar.from(stakingInfo[0].stake, HbarUnit.Tinybar);
          panelToShow.push(text(`Total Stake: ${totalStake.toString()}`));
          panelToShow.push(
            text(
              `Staking Start: ${Utils.timestampToString(
                stakingInfo[0].staking_period.from,
              )}`,
            ),
          );
          panelToShow.push(
            text(
              `Staking End: ${Utils.timestampToString(
                stakingInfo[0].staking_period.to,
              )}`,
            ),
          );
          stakedNodeId = String(nodeId);
        }
        if (!_.isEmpty(accountId)) {
          panelToShow.push(text(`Account ID: ${String(accountId)}`));
          stakedAccountId = accountId;
        }
        panelToShow.push(divider());
        declineStakingReward = false;
      }

      const dialogParamsForStakeHbar: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParamsForStakeHbar);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );
      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw new Error('hedera client returned null');
      }
      const command = new StakeHbarCommand(nodeId, accountId);

      txReceipt = await command.execute(hederaClient.getClient());

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
      const errMessage = `Error while trying to stake Hbar: ${String(error)}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
