import { WalletSnapParams, SnapDialogParams } from '../../types/state';
import { DeleteTokenRequestParams } from '../../types/params';
import { TxReceipt } from '../../types/hedera';
import { divider, heading, text } from '@metamask/snaps-ui';
import { CryptoUtils } from '../../utils/CryptoUtils';
import _ from 'lodash';
import { SnapUtils } from '../../utils/SnapUtils';
import { providerErrors } from '@metamask/rpc-errors';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { DeleteTokenCommand } from '../../commands/hts/DeleteTokenCommand';
import { PrivateKey } from '@hashgraph/sdk';

export class DeleteTokenFacade {
  /**
   * Deletes the provided Hedera token.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param deleteTokenRequestParams - Parameters for deleting tokens.
   * @returns Receipt of the transaction.
   */
  public static async deleteToken(
    walletSnapParams: WalletSnapParams,
    deleteTokenRequestParams: DeleteTokenRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { tokenId } = deleteTokenRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Delete Token'),
        text(
          'Are you sure you want to dissociate the following tokens from your account?',
        ),
        divider(),
      ];

      panelToShow.push(text(`Token ID: ${tokenId}`));
      panelToShow.push(divider());

      panelToShow.push(text(`Asset Id: ${tokenId}`));
      const tokenInfo = await CryptoUtils.getTokenById(tokenId, mirrorNodeUrl);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        panelToShow.push(text(errMessage));
        panelToShow.push(
          text(`Proceed only if you are sure this asset ID exists`),
        );
      } else {
        panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
        panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
        panelToShow.push(text(`Symbol: ${tokenInfo.symbol}`));
        panelToShow.push(
          text(
            `Total Supply: ${(
              Number(tokenInfo.total_supply) /
              Math.pow(10, Number(tokenInfo.decimals))
            ).toString()}`,
          ),
        );
      }
      panelToShow.push(text(tokenId));
      panelToShow.push(divider());

      const dialogParams: SnapDialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw new Error('hedera client returned null');
      }
      const deleteTokensCommand = new DeleteTokenCommand(
        tokenId,
        PrivateKey.fromStringECDSA(privateKey),
      );
      txReceipt = await deleteTokensCommand.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to delete token ${tokenId} from the account: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
