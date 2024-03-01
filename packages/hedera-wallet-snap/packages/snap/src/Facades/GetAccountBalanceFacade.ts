import { WalletSnapParams } from '../types/state';
import { GetAccountInfoRequestParams } from '../types/params';
import { SnapState } from '../snap/SnapState';
import { providerErrors } from '@metamask/rpc-errors';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';

export class GetAccountBalanceFacade {
  readonly #walletSnapParams: WalletSnapParams;

  constructor(
    walletSnapParams: WalletSnapParams,
  ) {
    this.#walletSnapParams = walletSnapParams;
  }

  async getAccountBalance() {
    const { state } = this.#walletSnapParams;

    const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

    try {
      const hederaClientImplFactory = new HederaClientImplFactory(
        state.accountState[hederaEvmAddress][network].keyStore.curve,
        state.accountState[hederaEvmAddress][network].keyStore.privateKey,
        hederaAccountId,
        network,
      );
      const hederaClient = await hederaClientImplFactory.createClient();

      if (hederaClient === null) {
        return null;
      }
      const hbarBalance = await hederaClient.getAccountBalance();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[hederaEvmAddress][network].accountInfo.balance.hbars =
        hbarBalance;
      state.currentAccount.balance.hbars = hbarBalance;

      const currentTimestamp = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.balance.timestamp = currentTimestamp;
      state.currentAccount.balance.timestamp = currentTimestamp;

      await SnapState.updateState(state);
    } catch (error: any) {
      console.error(
        `Error while trying to get account balance: ${String(error)}`,
      );
      throw providerErrors.unsupportedMethod(
        `Error while trying to get account balance: ${String(error)}`,
      );
    }

    return state.accountState[hederaEvmAddress][network].accountInfo.balance
      .hbars;
  }
}
