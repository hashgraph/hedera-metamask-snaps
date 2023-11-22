/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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
import { createHederaClient } from '../../snap/account';
import { snapDialog } from '../../snap/dialog';
import { ServiceFee, TransferCryptoRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';

/**
 * Transfer crypto(hbar or other tokens).
 *
 * @param walletSnapParams - Wallet snap params.
 * @param transferCryptoParams - Parameters for transferring crypto.
 * @returns Account Info.
 */
export async function transferCrypto(
  walletSnapParams: WalletSnapParams,
  transferCryptoParams: TransferCryptoRequestParams,
): Promise<TxReceipt> {
  const { origin, state } = walletSnapParams;

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

  let shouldExecuteTransfer = false;
  const serviceFeesToPay: Record<string, number> = transfers.reduce<
    Record<string, number>
  >((acc, transfer) => {
    if (!acc[transfer.asset]) {
      acc[transfer.asset] = 0;
    }
    // Calculate the service fee based on the total amount
    const fee = Number(
      (transfer.amount * (serviceFee.percentageCut / 100.0)).toFixed(2),
    );

    // Deduct the service fee from the total amount to find the new transfer amount
    transfer.amount -= fee;

    // Record the service fee
    acc[transfer.asset] += fee;

    if (transfer.asset === 'HBAR') {
      shouldExecuteTransfer = true;
    }
    return acc;
  }, {});

  const panelToShow = [
    text(`Origin: ${origin}`),
    divider(),
    heading('Transfer Crypto'),
    text('Are you sure you want to execute the following transaction(s)?'),
    divider(),
    text(`Memo: ${memo === null || _.isEmpty(memo) ? 'N/A' : memo}`),
    text(`Max Transaction Fee: ${maxFee ?? 1} Hbar`),
  ];

  transfers.forEach((transfer, index) => {
    panelToShow.push(divider());

    const txNumber = (index + 1).toString();
    panelToShow.push(text(`Transaction #${txNumber}`));
    panelToShow.push(divider());

    if (transfer.asset === 'HBAR') {
      panelToShow.push(text(`Asset: ${transfer.asset}`));
      panelToShow.push(text(`To: ${transfer.to}`));
      panelToShow.push(text(`Amount: ${transfer.amount} HBAR`));
      if (serviceFeesToPay[transfer.asset] > 0) {
        panelToShow.push(
          text(
            `Service Fee: ${serviceFeesToPay[transfer.asset]
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} ${
              transfer.asset === 'HBAR' ? 'HBAR' : ''
            }`,
          ),
          text(
            `Total Amount: ${(
              transfer.amount + serviceFeesToPay[transfer.asset]
            )
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} ${
              transfer.asset === 'HBAR' ? 'HBAR' : ''
            }`,
          ),
        );
      }
    } else {
      panelToShow.push(
        text(`The transfer of '${transfer.asset}' is currently not supported`),
      );
    }
  });

  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: panel(panelToShow),
  };

  if (await snapDialog(dialogParams)) {
    try {
      if (!shouldExecuteTransfer) {
        console.error('There are no transactions to execute. Please try again');
        throw providerErrors.unsupportedMethod(
          'There are no transactions to execute. Please try again',
        );
      }

      let currentBalance =
        state.accountState[hederaEvmAddress][network].accountInfo.balance;
      if (!currentBalance) {
        currentBalance = {} as AccountBalance;
      }

      const hederaClient = await createHederaClient(
        state.accountState[hederaEvmAddress][network].keyStore.curve,
        state.accountState[hederaEvmAddress][network].keyStore.privateKey,
        hederaAccountId,
        network,
      );

      return await hederaClient.transferCrypto({
        currentBalance,
        transfers,
        memo,
        maxFee,
        serviceFeesToPay,
        serviceFeeToAddress: serviceFee.toAddress,
      });
    } catch (error: any) {
      console.error(`Error while trying to transfer crypto: ${String(error)}`);
      throw providerErrors.unsupportedMethod(
        `Error while trying to transfer crypto: ${String(error)}`,
      );
    }
  }
  throw providerErrors.userRejectedRequest();
}
