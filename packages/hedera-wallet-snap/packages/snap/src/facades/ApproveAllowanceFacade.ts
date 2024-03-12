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

import {
  ApproveAllowanceAssetDetail,
  ApproveAllowanceRequestParams,
} from '../types/params';
import { MirrorTokenInfo, TxReceipt } from '../types/hedera';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { providerErrors } from '@metamask/rpc-errors';
import { SnapDialogParams, WalletSnapParams } from '../types/state';
import { SnapUtils } from '../utils/SnapUtils';
import { CryptoUtils } from '../utils/CryptoUtils';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { ApproveAllowanceCommand } from '../commands/ApproveAllowanceCommand';

export class ApproveAllowanceFacade {
  public static async approveAllowance(
    walletSnapParams: WalletSnapParams,
    approveAllowanceRequestParams: ApproveAllowanceRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const {
      spenderAccountId,
      amount,
      assetType,
      assetDetail = {} as ApproveAllowanceAssetDetail,
    } = approveAllowanceRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

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

        const tokenInfo: MirrorTokenInfo = await CryptoUtils.getTokenById(
          assetDetail.assetId,
          mirrorNodeUrl,
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
            text(
              `Proceed only if you are sure about the asset ID being correct`,
            ),
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

      const hederaClientImplFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientImplFactory.createClient();

      if (hederaClient === null) {
        throw new Error('hedera client returned null');
      }

      const command = new ApproveAllowanceCommand(
        spenderAccountId,
        amount,
        assetType,
        assetDetail,
      );

      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to approve an allowance: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
