/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { TxReceipt } from '../../services/hedera';
import { HederaServiceImpl } from '../../services/impl/hedera';
import { createHederaClient } from '../../snap/account';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { updateSnapState } from '../../snap/state';
import { StakeHbarRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';
import { timestampToString } from '../../utils/helper';

/**
 * Stake Hbar to either a nodeid or accountId.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param stakeHbarRequestParams - Parameters for staking Hbar.
 * @returns Receipt of the transaction.
 */
export async function stakeHbar(
  walletSnapParams: WalletSnapParams,
  stakeHbarRequestParams: StakeHbarRequestParams,
): Promise<TxReceipt> {
  const { origin, state, mirrorNodeUrl } = walletSnapParams;

  const { nodeId = null, accountId = null } = stakeHbarRequestParams;

  const { hederaEvmAddress, hederaAccountId, network } = state.currentAccount;

  const { privateKey, curve } =
    state.accountState[hederaEvmAddress][network].keyStore;

  let { stakedAccountId, stakedNodeId, declineStakingReward } =
    state.accountState[hederaEvmAddress][network].accountInfo.stakingInfo;

  let mirrorNodeUrlToUse = mirrorNodeUrl;
  if (_.isEmpty(mirrorNodeUrlToUse)) {
    mirrorNodeUrlToUse =
      state.accountState[hederaEvmAddress][network].mirrorNodeUrl;
  }

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
        const hederaService = new HederaServiceImpl(
          network,
          mirrorNodeUrlToUse,
        );
        const stakingInfo = await hederaService.getNodeStakingInfo(nodeId);
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
            `Staking Start: ${timestampToString(
              stakingInfo[0].staking_period.from,
            )}`,
          ),
        );
        panelToShow.push(
          text(
            `Staking End: ${timestampToString(
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

    const dialogParamsForStakeHbar: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await snapDialog(dialogParamsForStakeHbar);
    if (!confirmed) {
      console.error(`User rejected the transaction`);
      throw providerErrors.userRejectedRequest();
    }

    const hederaClient = await createHederaClient(
      curve,
      privateKey,
      hederaAccountId,
      network,
    );

    txReceipt = await hederaClient.stakeHbar({
      nodeId,
      accountId,
    });

    state.accountState[hederaEvmAddress][
      network
    ].accountInfo.stakingInfo.stakedAccountId = stakedAccountId;
    state.accountState[hederaEvmAddress][
      network
    ].accountInfo.stakingInfo.stakedNodeId = stakedNodeId;
    state.accountState[hederaEvmAddress][
      network
    ].accountInfo.stakingInfo.declineStakingReward = declineStakingReward;
    state.accountState[hederaEvmAddress][network].mirrorNodeUrl =
      mirrorNodeUrlToUse;
    await updateSnapState(state);
  } catch (error: any) {
    const errMessage = `Error while trying to stake Hbar: ${String(error)}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return txReceipt;
}
