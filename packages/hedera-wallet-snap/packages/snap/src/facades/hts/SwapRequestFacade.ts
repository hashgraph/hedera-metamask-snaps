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

import { providerErrors } from '@metamask/rpc-errors';
import type { DialogParams } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import type { AccountInfo } from '../../types/account';
import type { AtomicSwap, TxReceipt } from '../../types/hedera';
import { AssetType } from '../../types/hedera';
import type { AtomicSwapRequestParams, ServiceFee } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { HederaUtils } from '../../utils/HederaUtils';
import { SnapUtils } from '../../utils/SnapUtils';
import { SwapRequestCommand } from '../../commands/hts/SwapRequestCommand';

export class SwapRequestFacade {
  /**
   * Transfer crypto(hbar or other tokens).
   * @param walletSnapParams - Wallet snap params.
   * @param atomicSwapParams - Parameters for atomic swap.
   * @returns Receipt of the transaction.
   */
  public static async createSwapRequest(
    walletSnapParams: WalletSnapParams,
    atomicSwapParams: AtomicSwapRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const {
      atomicSwaps = [] as AtomicSwap[],
      memo = null,
      maxFee = null,
      serviceFee = {
        percentageCut: 0,
        toAddress: '0.0.98', // Hedera Fee collection account
      } as ServiceFee,
    } = atomicSwapParams;

    const { hederaAccountId, hederaEvmAddress, network, mirrorNodeUrl } =
      state.currentAccount;
    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const serviceFeesToPay: Record<string, number> = atomicSwaps.reduce<
      Record<string, number>
    >((acc, swap) => {
      if (!acc[swap.sender.assetType]) {
        if (swap.sender.assetType === 'HBAR') {
          acc[swap.sender.assetType] = 0;
        } else {
          acc[swap.sender.assetId as string] = 0;
        }
      }
      // Calculate the service fee based on the total amount
      const fee = Number(
        (swap.sender.amount * (serviceFee.percentageCut / 100.0)).toFixed(2),
      );

      // Deduct the service fee from the total amount to find the new transfer amount
      swap.sender.amount -= fee;

      // Record the service fee
      if (swap.sender.assetType === AssetType.HBAR) {
        acc[swap.sender.assetType] += fee;
      } else {
        acc[swap.sender.assetId as string] += fee;
      }

      return acc;
    }, {});

    let txReceipt = {} as TxReceipt;

    const hederaClientFactory = new HederaClientImplFactory(
      hederaAccountId,
      network,
      curve,
      privateKey,
    );

    const hederaClient = await hederaClientFactory.createClient();
    if (hederaClient === null) {
      throw new Error('hederaClient is null');
    }

    try {
      await HederaUtils.getMirrorAccountInfo(hederaAccountId, mirrorNodeUrl);

      const panelToShow = [
        heading('Perform Atomic Swap'),
        text('Are you sure you want to execute the following transaction(s)?'),
        divider(),
      ];
      const strippedMemo = memo ? memo.replace(/\r?\n|\r/gu, '').trim() : '';
      if (strippedMemo) {
        panelToShow.push(text(`Memo: ${strippedMemo}`));
      }
      if (maxFee) {
        panelToShow.push(text(`Max Transaction Fee: ${maxFee} Hbar`));
      }

      for (const swap of atomicSwaps) {
        const txNumber = atomicSwaps.indexOf(swap) + 1;
        panelToShow.push(text(`Swap #${txNumber}`));
        panelToShow.push(divider());

        let asset = '';
        let feeToDisplay = 0;
        let walletBalance =
          state.accountState[hederaEvmAddress][network].accountInfo.balance;

        if (
          swap.sender.accountId !== undefined &&
          !_.isEmpty(swap.sender.accountId)
        ) {
          const ownerAccountInfo: AccountInfo =
            await HederaUtils.getMirrorAccountInfo(
              swap.sender.accountId,
              mirrorNodeUrl,
            );
          walletBalance = ownerAccountInfo.balance;
          panelToShow.push(text(`Owner Account Id: ${swap.sender.accountId}`));
        }
        panelToShow.push(text(`Sender Asset Type: ${swap.sender.assetType}`));
        panelToShow.push(
          text(`Receiver Asset Type: ${swap.receiver.assetType}`),
        );
        if (swap.sender.assetType === AssetType.HBAR) {
          if (
            walletBalance.hbars <
            swap.sender.amount + serviceFeesToPay.HBAR
          ) {
            const errMessage = `There is not enough Hbar in the wallet to transfer the requested amount`;
            console.error(errMessage);
            panelToShow.push(text(errMessage));
            panelToShow.push(
              text(
                `Proceed only if you are sure about the amount being transferred`,
              ),
            );
          }
          asset = 'HBAR';
        } else {
          swap.sender.decimals = walletBalance.tokens[
            swap.sender.assetId as string
          ]
            ? walletBalance.tokens[swap.sender.assetId as string].decimals
            : NaN;
          if (
            !walletBalance.tokens[swap.sender.assetId as string] ||
            walletBalance.tokens[swap.sender.assetId as string].balance <
              swap.sender.amount
          ) {
            const errMessage = `This wallet either does not own  ${
              swap.sender.assetId as string
            } or there is not enough balance to transfer the requested amount`;
            console.error(errMessage);
            panelToShow.push(text(errMessage));
            panelToShow.push(
              text(
                `Proceed only if you are sure about the amount being transferred`,
              ),
            );
          }

          let assetId = swap.sender.assetId as string;
          let nftSerialNumber = '';
          if (swap.sender.assetType === AssetType.NFT) {
            const assetIdSplit = assetId.split('/');
            assetId = assetIdSplit[0];
            nftSerialNumber = assetIdSplit[1];
          }
          panelToShow.push(text(`Asset Id: ${swap.sender.assetId as string}`));
          const tokenInfo = await CryptoUtils.getTokenById(
            assetId,
            mirrorNodeUrl,
          );
          if (_.isEmpty(tokenInfo)) {
            const errMessage = `Error while trying to get token info for ${assetId} from Hedera Mirror Nodes at this time`;
            console.error(errMessage);
            panelToShow.push(text(errMessage));
            panelToShow.push(
              text(
                `Proceed only if you are sure about the asset ID being transferred`,
              ),
            );
          } else {
            asset = tokenInfo.symbol;
            panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
            panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
            panelToShow.push(text(`Symbol: ${asset}`));
            swap.sender.decimals = Number(tokenInfo.decimals);
          }
          if (!Number.isFinite(swap.sender.decimals)) {
            const errMessage = `Error while trying to get token info for ${assetId} from Hedera Mirror Nodes at this time`;
            console.error(errMessage);
            throw providerErrors.unsupportedMethod(errMessage);
          }

          if (swap.sender.assetType === AssetType.NFT) {
            panelToShow.push(text(`NFT Serial Number: ${nftSerialNumber}`));
          }

          if (serviceFeesToPay[swap.sender.assetType] > 0) {
            feeToDisplay = serviceFeesToPay[swap.sender.assetType];
          } else {
            feeToDisplay = serviceFeesToPay[swap.sender.assetId as string];
          }
        }
        panelToShow.push(text(`To: ${swap.sender.accountId}`));
        panelToShow.push(text(`Amount: ${swap.sender.amount} ${asset}`));
        if (feeToDisplay > 0) {
          panelToShow.push(
            SnapUtils.formatSwapFeeDisplay(feeToDisplay, swap),
            SnapUtils.formatSwapFeeDisplay(
              swap.sender.amount + feeToDisplay,
              swap,
            ),
          );
        }
        panelToShow.push(divider());
      }

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const command = new SwapRequestCommand(
        atomicSwaps,
        memo,
        maxFee,
        serviceFeesToPay,
        serviceFee.toAddress as string,
      );

      txReceipt = await command.execute(hederaClient.getClient());

      return txReceipt;
    } catch (error: any) {
      console.error(`Error while trying to transfer crypto: ${String(error)}`);
      throw new Error(error);
    }
  }
}
