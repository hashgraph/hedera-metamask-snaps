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
import { divider, heading, panel, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import {
  AccountBalance,
  SimpleTransfer,
  TxReceipt,
} from '../../services/hedera';
import { HederaServiceImpl } from '../../services/impl/hedera';
import { createHederaClient } from '../../snap/account';
import { snapDialog } from '../../snap/dialog';
import { updateSnapState } from '../../snap/state';
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

  let mirrorNodeUrlToUse = mirrorNodeUrl;
  if (_.isEmpty(mirrorNodeUrlToUse)) {
    mirrorNodeUrlToUse =
      state.accountState[hederaEvmAddress][network].mirrorNodeUrl;
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

  try {
    await getAccountInfo(
      { origin, state, mirrorNodeUrl: mirrorNodeUrlToUse } as WalletSnapParams,
      {} as GetAccountInfoRequestParams,
    );
    let currentBalance =
      state.accountState[hederaEvmAddress][network].accountInfo.balance;
    if (!currentBalance) {
      currentBalance = {} as AccountBalance;
    }

    const panelToShow = [
      text(`Origin: ${origin}`),
      divider(),
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

    const hederaService = new HederaServiceImpl(network, mirrorNodeUrlToUse);
    for (const transfer of transfers) {
      const txNumber = transfers.indexOf(transfer) + 1;
      panelToShow.push(text(`Transaction #${txNumber}`));
      panelToShow.push(divider());
      panelToShow.push(divider());

      panelToShow.push(text(`Asset Type: ${transfer.assetType}`));
      panelToShow.push(divider());
      let asset = '';
      let feeToDisplay = 0;
      if (transfer.assetType === 'HBAR') {
        if (currentBalance.hbars < transfer.amount + serviceFeesToPay.HBAR) {
          const errMessage = `You do not have enough Hbar in your balance to transfer the requested amount`;
          console.error(errMessage);
          throw providerErrors.unauthorized(errMessage);
        }
        asset = 'HBAR';
      } else {
        if (
          !currentBalance.tokens[transfer.assetId as string] ||
          currentBalance.tokens[transfer.assetId as string].balance <
            transfer.amount
        ) {
          const errMessage = `You either do not own ${
            transfer.assetId as string
          } or do not have enough in your balance to transfer the requested amount`;
          console.error(errMessage);
          throw providerErrors.unauthorized(errMessage);
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
      content: panel(panelToShow),
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
      currentBalance,
      transfers,
      memo,
      maxFee,
      serviceFeesToPay,
      serviceFeeToAddress: serviceFee.toAddress,
    });
    state.accountState[hederaEvmAddress][network].mirrorNodeUrl =
      mirrorNodeUrlToUse;
    await updateSnapState(state);
  } catch (error: any) {
    console.error(`Error while trying to transfer crypto: ${String(error)}`);
    throw providerErrors.unsupportedMethod(
      `Error while trying to transfer crypto: ${String(error)}`,
    );
  }

  return txReceipt;
}
