import { divider, heading, panel, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import {
  AccountBalance,
  SimpleTransfer,
  TxReceipt,
} from '../../services/hedera';
import { createHederaClient } from '../../snap/account';
import { snapDialog } from '../../snap/dialog';
import { TransferCryptoRequestParams } from '../../types/params';
import { WalletSnapParams, SnapDialogParams } from '../../types/state';

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
  } = transferCryptoParams;

  const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

  const serviceFees: Record<string, number> = transfers.reduce<
    Record<string, number>
  >((acc, transfer) => {
    if (!acc[transfer.asset]) {
      acc[transfer.asset] = 0;
    }
    acc[transfer.asset] += transfer.amount * 0.0001; // Add 0.01% of the amount; This can be changed in the future
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

    panelToShow.push(text(`Asset: ${transfer.asset}`));
    panelToShow.push(text(`To: ${transfer.to}`));
    panelToShow.push(text(`Amount: ${transfer.amount} Hbar`));
    panelToShow.push(
      text(`Service Fee: ${serviceFees[transfer.asset].toFixed(8)} Hbar`),
    );
  });

  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: panel(panelToShow),
  };

  if (await snapDialog(dialogParams)) {
    try {
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
        serviceFees,
      });
    } catch (error: any) {
      console.error(`Error while trying to transfer crypto: ${String(error)}`);
      throw new Error(
        `Error while trying to transfer crypto: ${String(error)}`,
      );
    }
  }
  throw new Error('User rejected the transaction');
}
