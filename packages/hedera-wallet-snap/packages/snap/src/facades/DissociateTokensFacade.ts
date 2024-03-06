import { WalletSnapParams, SnapDialogParams } from '../types/state';
import { DissociateTokensRequestParams } from '../types/params';
import { TxReceipt } from '../types/hedera';
import { divider, heading, text } from '@metamask/snaps-ui';
import { CryptoUtils } from '../utils/CryptoUtils';
import _ from 'lodash';
import { SnapUtils } from '../utils/SnapUtils';
import { providerErrors } from '@metamask/rpc-errors';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { DissociateTokensCommand } from '../commands/DissociateTokensCommand';

export class DissociateTokensFacade {
  /**
   * Associates the provided Hedera account with the provided Hedera token(s).
   *
   * Hedera accounts must be associated with a fungible or non-fungible token first
   * before you can transfer tokens to that account.  In the case of NON_FUNGIBLE Type,
   * once an account is associated, it can hold any number of NFTs (serial numbers)
   * of that token type. There is currently no limit on the number of token IDs that
   * can be associated with an account (reference HIP-367). Still, you can see
   * TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED responses for pre-HIP-367 transactions.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param dissociateTokensRequestParams - Parameters for associating tokens to the account.
   * @returns Receipt of the transaction.
   */
  public static async dissociateTokens(
    walletSnapParams: WalletSnapParams,
    dissociateTokensRequestParams: DissociateTokensRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { tokenIds = [] as string[] } = dissociateTokensRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Dissociate Tokens'),
        text(
          'Are you sure you want to dissociate the following tokens from your account?',
        ),
        divider(),
      ];

      for (const tokenId of tokenIds) {
        const tokenNumber = tokenIds.indexOf(tokenId) + 1;
        panelToShow.push(text(`Token #${tokenNumber}`));
        panelToShow.push(divider());

        panelToShow.push(text(`Asset Id: ${tokenId}`));
        const tokenInfo = await CryptoUtils.getTokenById(
          tokenId,
          mirrorNodeUrl,
        );
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
          panelToShow.push(
            text(
              `Max Supply: ${(
                Number(tokenInfo.max_supply) /
                Math.pow(10, Number(tokenInfo.decimals))
              ).toString()}`,
            ),
          );
        }
        panelToShow.push(text(tokenId));
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
      const dissociateTokensCommand = new DissociateTokensCommand(tokenIds);
      txReceipt = await dissociateTokensCommand.execute(
        hederaClient.getClient(),
      );
    } catch (error: any) {
      const errMessage = `Error while trying to dissociate tokens from the account: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}