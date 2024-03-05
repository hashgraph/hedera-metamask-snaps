import { SnapDialogParams, WalletSnapParams } from '../types/state';
import { ServiceFee, TransferCryptoRequestParams } from '../types/params';
import { SimpleTransfer, TxReceipt } from '../types/hedera';
import { HederaAccountStrategy } from '../strategies/HederaAccountStrategy';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { AccountInfo } from '../types/account';
import { CryptoUtils } from '../utils/CryptoUtils';
import { providerErrors } from '@metamask/rpc-errors';
import { SnapUtils } from '../utils/SnapUtils';
import { TransferCryptoCommand } from '../commands/TransferCryptoCommand';

export class TransferCryptoFacade {
  /**
   * Transfer crypto(hbar or other tokens).
   *
   * @param walletSnapParams - Wallet snap params.
   * @param transferCryptoParams - Parameters for transferring crypto.
   * @returns Receipt of the transaction.
   */
  public static async transferCrypto(
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
      await HederaAccountStrategy.getAccountInfo(
        hederaClient.getClient(),
        hederaAccountId,
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

      for (const transfer of transfers) {
        const txNumber = transfers.indexOf(transfer) + 1;
        panelToShow.push(text(`Transaction #${txNumber}`));
        panelToShow.push(divider());

        let asset = '';
        let feeToDisplay = 0;
        let walletBalance =
          state.accountState[hederaEvmAddress][network].accountInfo.balance;
        if (transfer.from === undefined) {
          throw new Error('Transfer from address is undefined');
        }
        if (!_.isEmpty(transfer.from)) {
          const ownerAccountInfo: AccountInfo =
            await HederaAccountStrategy.getAccountInfo(
              hederaClient.getClient(),
              transfer.from,
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
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const transferCryptoCommand = new TransferCryptoCommand(
        transfers,
        memo,
        maxFee,
        serviceFeesToPay,
        serviceFee.toAddress as string,
      );

      txReceipt = await transferCryptoCommand.execute(hederaClient.getClient());
    } catch (error: any) {
      console.error(`Error while trying to transfer crypto: ${String(error)}`);
      throw providerErrors.unsupportedMethod(
        `Error while trying to transfer crypto: ${String(error)}`,
      );
    }

    return txReceipt;
  }
}
