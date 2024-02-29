import {
  AccountBalanceQuery,
  AccountId,
  AccountInfoQuery,
  Client,
  Hbar,
  HbarUnit,
  PublicKey,
} from '@hashgraph/sdk';
import {
  AccountInfoJson,
  StakingInfoJson,
} from '@hashgraph/sdk/lib/account/AccountInfo';
import { Utils } from '../../utils/Utils';
import { AccountInfo } from '../../types/account';

export class HederaAccountStrategy {
  public static async getAccountInfo(
    client: Client,
    accountId: string,
  ): Promise<AccountInfo> {
    const query = new AccountInfoQuery({ accountId });
    await query.getCost(client);

    const accountInfo = await query.execute(client);
    const accountInfoJson: AccountInfoJson = accountInfo.toJSON();

    const hbarBalance = Number(accountInfoJson.balance.replace(' ℏ', ''));
    const stakingInfo = {} as StakingInfoJson;
    if (accountInfoJson.stakingInfo) {
      stakingInfo.declineStakingReward =
        accountInfoJson.stakingInfo.declineStakingReward;

      stakingInfo.stakePeriodStart = Utils.timestampToString(
        accountInfoJson.stakingInfo.stakePeriodStart,
      );

      stakingInfo.pendingReward = Hbar.fromString(
        accountInfoJson.stakingInfo.pendingReward ?? '0',
      )
        .toString(HbarUnit.Hbar)
        .replace(' ℏ', '');
      stakingInfo.stakedToMe = Hbar.fromString(
        accountInfoJson.stakingInfo.stakedToMe ?? '0',
      )
        .toString(HbarUnit.Hbar)
        .replace(' ℏ', '');
      stakingInfo.stakedAccountId =
        accountInfoJson.stakingInfo.stakedAccountId ?? '';
      stakingInfo.stakedNodeId = accountInfoJson.stakingInfo.stakedNodeId ?? '';
    }

    return {
      accountId: accountInfoJson.accountId,
      alias: accountInfoJson.aliasKey ?? '',
      expirationTime: Utils.timestampToString(accountInfoJson.expirationTime),
      memo: accountInfoJson.accountMemo,
      evmAddress: accountInfoJson.contractAccountId
        ? `0x${accountInfoJson.contractAccountId}`
        : '',
      key: {
        key: accountInfoJson.key
          ? PublicKey.fromString(accountInfoJson.key).toStringRaw()
          : '',
      },
      balance: {
        hbars: hbarBalance,
        timestamp: Utils.timestampToString(new Date()),
      },
      autoRenewPeriod: accountInfo.autoRenewPeriod.seconds.toString(),
      ethereumNonce: accountInfoJson.ethereumNonce ?? '',
      isDeleted: accountInfoJson.isDeleted,
      stakingInfo,
    } as AccountInfo;
  }

  public static async getAccountBalance(client: Client): Promise<number> {
    const query = new AccountBalanceQuery().setAccountId(
      client.operatorAccountId as AccountId,
    );

    // Submit the query to a Hedera network
    const accountBalance = await query.execute(client);

    const amount = accountBalance.hbars.to(HbarUnit.Hbar);
    return amount.toNumber();
  }
}
