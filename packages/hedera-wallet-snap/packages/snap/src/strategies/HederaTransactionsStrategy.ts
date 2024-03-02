import { WalletSnapParams } from '../types/state';
import { GetTransactionsRequestParams } from '../types/params';
import { MirrorTransactionInfo } from '../types/hedera';
import { providerErrors } from '@metamask/rpc-errors';
import { HederaUtils } from '../utils/HederaUtils';

export class HederaTransactionsStrategy {
  public static async getTransactions(
    walletSnapParams: WalletSnapParams,
    getTransactionsParams: GetTransactionsRequestParams,
  ): Promise<MirrorTransactionInfo[]> {
    const { state } = walletSnapParams;

    const { transactionId = '' } = getTransactionsParams;

    const { hederaAccountId, mirrorNodeUrl } = state.currentAccount;

    let transactionsHistory = {} as MirrorTransactionInfo[];

    try {
      console.log('Retrieving transaction history using Hedera Mirror node');
      transactionsHistory = await HederaUtils.getMirrorTransactions(
        hederaAccountId,
        transactionId,
        mirrorNodeUrl,
      );
    } catch (error: any) {
      const errMessage = `Error while trying to get transaction history: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return transactionsHistory;
  }
}
