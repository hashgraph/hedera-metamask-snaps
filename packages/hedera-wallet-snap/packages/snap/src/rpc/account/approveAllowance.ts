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

import { providerErrors } from '@metamask/rpc-errors';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { HederaClientFactory } from '../../snap/HederaClientFactory';
import { HederaServiceImpl } from '../../services/impl/hedera';
import { SnapUtils } from '../../utils/SnapUtils';
import { MirrorTokenInfo, TxReceipt } from '../../types/hedera';
import {
  ApproveAllowanceAssetDetail,
  ApproveAllowanceRequestParams,
} from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';

/**
 * Approve an allowance for a given asset.
 *
 * A Hedera account owner can provide an allowance for HBAR, non-fungible, and
 * fungible tokens. The owner is the Hedera account that owns the tokens and
 * grants the token allowance to the spender. The spender is the account that
 * spends tokens, authorized by the owner, from the owner's account. The spender
 * pays for the transaction fees when transferring tokens from the owner's
 * account to another recipient. The maximum number of token approvals for the
 * AccountAllowanceApproveTransaction cannot exceed 20. Note that each NFT serial
 * number counts as a single approval. An AccountAllowanceApproveTransaction
 * granting 20 NFT serial numbers to a spender will use all of the approvals
 * permitted for the transaction. Each owner account is limited to granting 100
 * allowances. This limit spans HBAR, fungible token allowances, and non-fungible
 * token approved_for_all grants. No limit exists on the number of NFT serial number
 * approvals an owner may grant. The number of allowances set on an account
 * will increase the auto-renewal fee for the account. Conversely, removing
 * allowances will decrease the auto-renewal fee for the account.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param approveAllowanceRequestParams - Parameters for approving an allowance.
 * @returns Receipt of the transaction.
 */
export async function approveAllowance(
  walletSnapParams: WalletSnapParams,
  approveAllowanceRequestParams: ApproveAllowanceRequestParams,
): Promise<TxReceipt> {
  const { origin, state, mirrorNodeUrl } = walletSnapParams;

  const {
    spenderAccountId,
    amount,
    assetType,
    assetDetail = {} as ApproveAllowanceAssetDetail,
  } = approveAllowanceRequestParams;

  const { hederaEvmAddress, hederaAccountId, network } = state.currentAccount;

  const { privateKey, curve } =
    state.accountState[hederaEvmAddress][network].keyStore;

  let txReceipt = {} as TxReceipt;
  try {
    const panelToShow = [
      heading('Approve an allowance'),
      text(
        'Are you sure you want to allow the following account to spend your tokens?',
      ),
      divider(),
    ];

    if (assetType === 'HBAR') {
      panelToShow.push(text(`Asset: ${assetType}`));
    } else {
      const walletBalance =
        state.accountState[hederaEvmAddress][network].accountInfo.balance;
      assetDetail.assetDecimals = walletBalance.tokens[assetDetail.assetId]
        ? walletBalance.tokens[assetDetail.assetId].decimals
        : NaN;

      const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
      const tokenInfo: MirrorTokenInfo = await hederaService.getTokenById(
        assetDetail.assetId,
      );
      if (assetType === 'NFT' && assetDetail?.all) {
        panelToShow.push(
          text(
            `NOTE: This action will grant the spender account access to all NFTs in this NFT collection.`,
          ),
        );
      }
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${assetDetail.assetId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        panelToShow.push(text(errMessage));
        panelToShow.push(
          text(`Proceed only if you are sure about the asset ID being correct`),
        );
      } else {
        panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
        panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
        panelToShow.push(text(`Id: ${assetDetail.assetId}`));
        panelToShow.push(text(`Symbol: ${tokenInfo.symbol}`));
        assetDetail.assetDecimals = Number(tokenInfo.decimals);
      }
      if (!Number.isFinite(assetDetail.assetDecimals)) {
        const errMessage = `Error while trying to get token info for ${assetDetail.assetId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        throw providerErrors.unsupportedMethod(errMessage);
      }

      panelToShow.push(
        text(
          `Total Supply: ${(
            Number(tokenInfo.total_supply) /
            Math.pow(10, Number(tokenInfo.decimals))
          ).toString()}`,
        ),
      );
      panelToShow.push(
        text(
          `Max Supply: ${(
            Number(tokenInfo.max_supply) /
            Math.pow(10, Number(tokenInfo.decimals))
          ).toString()}`,
        ),
      );
    }
    panelToShow.push(
      divider(),
      text(`Spender Account ID: ${spenderAccountId}`),
    );
    panelToShow.push(text(`Approved Amount: ${amount}`));

    const dialogParamsForApproveAllowance: SnapDialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await SnapUtils.snapDialog(
      dialogParamsForApproveAllowance,
    );
    if (!confirmed) {
      console.error(`User rejected the transaction`);
      throw providerErrors.userRejectedRequest();
    }

    const hederaClient = await HederaClientFactory.create(
      curve,
      privateKey,
      hederaAccountId,
      network,
    );
    txReceipt = await hederaClient.approveAllowance({
      spenderAccountId,
      amount,
      assetType,
      assetDetail,
    });
  } catch (error: any) {
    const errMessage = `Error while trying to approve an alloance: ${String(
      error,
    )}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return txReceipt;
}
