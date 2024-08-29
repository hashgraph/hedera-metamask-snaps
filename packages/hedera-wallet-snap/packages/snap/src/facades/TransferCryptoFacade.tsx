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

import { rpcErrors } from '@metamask/rpc-errors';
import type { DialogParams } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { TransferCryptoCommand } from '../commands/TransferCryptoCommand';
import { TransferCryptoUI } from '../components/transferCrypto';
import type { SimpleTransfer, TxRecord } from '../types/hedera';
import type { ServiceFee, TransferCryptoRequestParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';
import { SnapUtils } from '../utils/SnapUtils';

export class TransferCryptoFacade {
  /**
   * Transfer crypto(hbar or other tokens).
   * @param walletSnapParams - Wallet snap params.
   * @param transferCryptoParams - Parameters for transferring crypto.
   * @returns Receipt of the transaction.
   */
  public static async transferCrypto(
    walletSnapParams: WalletSnapParams,
    transferCryptoParams: TransferCryptoRequestParams,
  ): Promise<TxRecord> {
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

    const { hederaAccountId, hederaEvmAddress, network, mirrorNodeUrl } =
      state.currentAccount;
    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

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

    let txRecord = {} as TxRecord;

    const hederaClientFactory = new HederaClientImplFactory(
      hederaAccountId,
      network,
      curve,
      privateKey,
    );

    const hederaClient = await hederaClientFactory.createClient();
    if (hederaClient === null) {
      throw rpcErrors.resourceUnavailable('hedera client returned null');
    }

    try {
      await HederaUtils.getMirrorAccountInfo(hederaAccountId, mirrorNodeUrl);

      const strippedMemo = memo ? memo.replace(/\r?\n|\r/gu, '').trim() : '';

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: (
          <TransferCryptoUI
            origin={origin}
            network={network}
            mirrorNodeUrl={mirrorNodeUrl}
            memo={strippedMemo}
            maxFee={maxFee}
            transfers={transfers}
            walletBalance={
              state.accountState[hederaEvmAddress][network].accountInfo.balance
            }
            serviceFeesToPay={serviceFeesToPay}
          />
        ),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        const errMessage = 'User rejected the transaction';
        console.error(errMessage);
        throw rpcErrors.transactionRejected(errMessage);
      }

      const command = new TransferCryptoCommand(
        transfers,
        memo,
        maxFee,
        serviceFeesToPay,
        serviceFee.toAddress as string,
      );

      txRecord = await command.execute(hederaClient.getClient());

      await SnapUtils.snapCreateDialogAfterTransaction(
        origin,
        network,
        mirrorNodeUrl,
        txRecord,
      );

      return txRecord;
    } catch (error: any) {
      const errMessage = `Error while trying to transfer crypto`;
      console.error(
        'Error occurred:',
        errMessage,
        JSON.stringify(error, null, 4),
      );
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }
  }
}
