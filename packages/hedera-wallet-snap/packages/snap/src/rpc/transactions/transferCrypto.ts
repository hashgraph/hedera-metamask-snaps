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
import { HederaServiceImpl } from '../../services/impl/hedera';
import { createHederaClient } from '../../snap/account';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { AccountInfo } from '../../types/account';
import { SimpleTransfer, TxReceipt } from '../../types/hedera';
import {
  GetAccountInfoRequestParams,
  ServiceFee,
  TransferCryptoRequestParams,
} from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';
import { getAccountInfo } from '../account/getAccountInfo';

/**
 * Transfer crypto(hbar or other tokens).
 *
 * @param walletSnapParams - Wallet snap params.
 * @param transferCryptoParams - Parameters for transferring crypto.
 * @returns Receipt of the transaction.
 */
export async function transferCrypto(
  walletSnapParams: WalletSnapParams,
  transferCryptoParams: TransferCryptoRequestParams,
): Promise<TxReceipt> {
  const { origin, state, mirrorNodeUrl } = walletSnapParams;

  const {
    transfers = [] as SimpleTransfer[],
    memo = null,
    maxFee = null,
    serviceFee = {
      percentageCut: 0,
      toAddress: '0.0.98', // Hedera Fee collection account
    } as ServiceFee,
  } = transferCryptoParams;

  const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

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

  try {
    await getAccountInfo(
      { origin, state, mirrorNodeUrl } as WalletSnapParams,
      {} as GetAccountInfoRequestParams,
      true,
    );

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

    const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
    for (const transfer of transfers) {
      const txNumber = transfers.indexOf(transfer) + 1;
      panelToShow.push(text(`Transaction #${txNumber}`));
      panelToShow.push(divider());
      panelToShow.push(divider());

      let asset = '';
      let feeToDisplay = 0;
      let walletBalance =
        state.accountState[hederaEvmAddress][network].accountInfo.balance;
      if (!_.isEmpty(transfer.from)) {
        const ownerAccountInfo: AccountInfo = await getAccountInfo(
          {
            origin,
            state,
            mirrorNodeUrl,
          } as WalletSnapParams,
          { accountId: transfer.from } as GetAccountInfoRequestParams,
          true,
        );
        walletBalance = ownerAccountInfo.balance;
        panelToShow.push(text(`Transaction Type: Delegated Transfer`));
        panelToShow.push(text(`Owner Account Id: ${transfer.from as string}`));
      }
      panelToShow.push(text(`Asset Type: ${transfer.assetType}`));
      panelToShow.push(divider());
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
        panelToShow.push(text(`Asset Id: ${transfer.assetId as string}`));
        const tokenInfo = await hederaService.getTokenById(
          transfer.assetId as string,
        );
        if (_.isEmpty(tokenInfo)) {
          const errMessage = `Error while trying to get token info for ${
            transfer.assetId as string
          } from Hedera Mirror Nodes at this time`;
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
          const errMessage = `Error while trying to get token info for ${
            transfer.assetId as string
          } from Hedera Mirror Nodes at this time`;
          console.error(errMessage);
          throw providerErrors.unsupportedMethod(errMessage);
        }

        if (serviceFeesToPay[transfer.assetType] > 0) {
          feeToDisplay = serviceFeesToPay[transfer.assetType];
        } else {
          feeToDisplay = serviceFeesToPay[transfer.assetId as string];
        }
        panelToShow.push(divider());
      }
      panelToShow.push(text(`To: ${transfer.to}`));
      panelToShow.push(text(`Amount: ${transfer.amount} ${asset}`));
      if (feeToDisplay > 0) {
        panelToShow.push(
          text(
            `Service Fee: ${feeToDisplay
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} ${
              transfer.assetType === 'HBAR'
                ? 'HBAR'
                : (transfer.assetId as string)
            }`,
          ),
          text(
            `Total Amount: ${(transfer.amount + feeToDisplay)
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} ${
              transfer.assetType === 'HBAR'
                ? 'HBAR'
                : (transfer.assetId as string)
            }`,
          ),
        );
      }
      panelToShow.push(divider());
    }

    const dialogParams: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await snapDialog(dialogParams);
    if (!confirmed) {
      console.error(`User rejected the transaction`);
      throw providerErrors.userRejectedRequest();
    }

    const hederaClient = await createHederaClient(
      state.accountState[hederaEvmAddress][network].keyStore.curve,
      state.accountState[hederaEvmAddress][network].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    txReceipt = await hederaClient.transferCrypto({
      transfers,
      memo,
      maxFee,
      serviceFeesToPay,
      serviceFeeToAddress: serviceFee.toAddress as string,
    });
  } catch (error: any) {
    console.error(`Error while trying to transfer crypto: ${String(error)}`);
    throw providerErrors.unsupportedMethod(
      `Error while trying to transfer crypto: ${String(error)}`,
    );
  }

  return txReceipt;
}
