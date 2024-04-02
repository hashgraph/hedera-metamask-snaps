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
import { TransferCryptoCommand } from '../commands/TransferCryptoCommand';
import type { AccountInfo } from '../../types/account';
import type { AtomicSwap, SimpleTransfer, TxReceipt } from '../../types/hedera';
import type { CreateSwapRequestParams, ServiceFee } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { HederaUtils } from '../../utils/HederaUtils';
import { SnapUtils } from '../../utils/SnapUtils';
import { CreateSwapCommand } from "../../commands/hts/CreateSwapCommand";

export class CreateSwapFacade {
  /**
   * Swap tokens for Hbar or other tokens.
   * @param walletSnapParams - Wallet snap params.
   * @param createSwapRequestParams - Parameters for creating an atomic swap.
   * @returns Receipt of the transaction.
   */
  public static async createSwap(
    walletSnapParams: WalletSnapParams,
    createSwapRequestParams: CreateSwapRequestParams,
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
    } = createSwapRequestParams;

    const { hederaAccountId, hederaEvmAddress, network, mirrorNodeUrl } =
      state.currentAccount;
    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const transfers: SimpleTransfer[] = [];

    for (const swap of atomicSwaps) {
      transfers.push(swap.sender);
      transfers.push(swap.receiver);
    }

    const serviceFeesToPay: Record<string, number> = transfers.reduce<
      Record<string, number>
    >((acc, transfer) => {
      if (!acc[transfer.assetType]) {
        if (transfer.assetType === 'HBAR') {
          acc[transfer.assetType] = 0;
        } else {
          acc[transfer.assetId as string] = 0;
        }
      }
      // Calculate the service fee based on the total amount
      const fee = Number(
        (transfer.amount * (serviceFee.percentageCut / 100.0)).toFixed(2),
      );

      // Deduct the service fee from the total amount to find the new transfer amount
      transfer.amount -= fee;

      // Record the service fee
      if (transfer.assetType === 'HBAR') {
        acc[transfer.assetType] += fee;
      } else {
        acc[transfer.assetId as string] += fee;
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
        heading('Transfer Crypto'),
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

      for (const transfer of transfers) {
        const txNumber = transfers.indexOf(transfer) + 1;
        panelToShow.push(text(`Transaction #${txNumber}`));
        panelToShow.push(divider());

        let asset = '';
        let feeToDisplay = 0;
        let walletBalance =
          state.accountState[hederaEvmAddress][network].accountInfo.balance;

        if (transfer.from !== undefined && !_.isEmpty(transfer.from)) {
          const ownerAccountInfo: AccountInfo =
            await HederaUtils.getMirrorAccountInfo(
              transfer.from,
              mirrorNodeUrl,
            );
          walletBalance = ownerAccountInfo.balance;
          panelToShow.push(text(`Transaction Type: Delegated Transfer`));
          panelToShow.push(text(`Owner Account Id: ${transfer.from}`));
        }
        panelToShow.push(text(`Asset Type: ${transfer.assetType}`));
        if (transfer.assetType === 'HBAR') {
          if (walletBalance.hbars < transfer.amount + serviceFeesToPay.HBAR) {
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
          transfer.decimals = walletBalance.tokens[transfer.assetId as string]
            ? walletBalance.tokens[transfer.assetId as string].decimals
            : NaN;
          if (
            !walletBalance.tokens[transfer.assetId as string] ||
            walletBalance.tokens[transfer.assetId as string].balance <
              transfer.amount
          ) {
            const errMessage = `This wallet either does not own  ${
              transfer.assetId as string
            } or there is not enough balance to transfer the requested amount`;
            console.error(errMessage);
            panelToShow.push(text(errMessage));
            panelToShow.push(
              text(
                `Proceed only if you are sure about the amount being transferred`,
              ),
            );
          }

          let assetId = transfer.assetId as string;
          let nftSerialNumber = '';
          if (transfer.assetType === 'NFT') {
            const assetIdSplit = assetId.split('/');
            assetId = assetIdSplit[0];
            nftSerialNumber = assetIdSplit[1];
          }
          panelToShow.push(text(`Asset Id: ${transfer.assetId as string}`));
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
            transfer.decimals = Number(tokenInfo.decimals);
          }
          if (!Number.isFinite(transfer.decimals)) {
            const errMessage = `Error while trying to get token info for ${assetId} from Hedera Mirror Nodes at this time`;
            console.error(errMessage);
            throw providerErrors.unsupportedMethod(errMessage);
          }

          if (transfer.assetType === 'NFT') {
            panelToShow.push(text(`NFT Serial Number: ${nftSerialNumber}`));
          }

          if (serviceFeesToPay[transfer.assetType] > 0) {
            feeToDisplay = serviceFeesToPay[transfer.assetType];
          } else {
            feeToDisplay = serviceFeesToPay[transfer.assetId as string];
          }
        }
        panelToShow.push(text(`To: ${transfer.to}`));
        panelToShow.push(text(`Amount: ${transfer.amount} ${asset}`));
        if (feeToDisplay > 0) {
          panelToShow.push(
            SnapUtils.formatFeeDisplay(feeToDisplay, transfer),
            SnapUtils.formatFeeDisplay(
              transfer.amount + feeToDisplay,
              transfer,
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

      const command = new CreateSwapCommand(
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
