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

import {
  AccountId,
  Client,
  Hbar,
  HbarUnit,
  PrivateKey,
  Status,
  StatusError,
  TransferTransaction,
} from '@hashgraph/sdk';
import _ from 'lodash';

import { StakingInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';
import { providerErrors } from '@metamask/rpc-errors';
import { AccountInfo } from 'src/types/account';
import { Wallet } from '../../../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../../../domain/wallet/software-private-key';
import { FetchResponse, fetchDataFromUrl } from '../../../utils/fetch';
import { timestampToString } from '../../../utils/helper';
import {
  AccountBalance,
  HederaService,
  MirrorAccountInfo,
  MirrorStakingInfo,
  MirrorTokenInfo,
  MirrorTransactionInfo,
  SimpleHederaClient,
  Token,
  TokenBalance,
} from '../../hedera';
import { SimpleHederaClientImpl } from './client';

export class HederaServiceImpl implements HederaService {
  // eslint-disable-next-line no-restricted-syntax
  private readonly network: string;

  // eslint-disable-next-line no-restricted-syntax
  public readonly mirrorNodeUrl: string;

  constructor(network: string, mirrorNodeUrl?: string) {
    this.network = network;
    // eslint-disable-next-line default-case
    switch (network) {
      case 'testnet':
        this.mirrorNodeUrl = 'https://testnet.mirrornode.hedera.com';
        break;
      case 'previewnet':
        this.mirrorNodeUrl = 'https://previewnet.mirrornode.hedera.com';
        break;
      default:
        this.mirrorNodeUrl = 'https://mainnet-public.mirrornode.hedera.com';
    }

    if (!_.isEmpty(mirrorNodeUrl)) {
      this.mirrorNodeUrl = mirrorNodeUrl as string;
    }
  }

  async createClient(options: {
    wallet: Wallet;
    keyIndex: number;
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null> {
    let client: Client;

    if (this.network === 'testnet') {
      client = Client.forTestnet();
      /*       client = Client.forNetwork({
        'https://testnet-node00-00-grpc.hedera.com:443': new AccountId(3),
      }); */
    } else if (this.network === 'previewnet') {
      client = Client.forPreviewnet();
    } else {
      client = Client.forMainnet();
      /*       client = Client.forNetwork({
        'https://node01-00-grpc.swirlds.com:443': new AccountId(4),
      }); */
    }

    // client.setLogger(this.debugLogger);

    client.setNetworkUpdatePeriod(2000);

    const transactionSigner = await options.wallet.getTransactionSigner(
      options.keyIndex,
    );

    const privateKey = await options.wallet.getPrivateKey(options.keyIndex);
    const publicKey = await options.wallet.getPublicKey(options.keyIndex);

    if (publicKey === null) {
      return null;
    }

    // TODO: Fix
    client.setOperatorWith(
      options.accountId,
      publicKey ?? '',
      transactionSigner,
    );

    if (!(await testClientOperatorMatch(client))) {
      return null;
    }

    // this sets the fee paid by the client for the transaction
    client.setDefaultMaxTransactionFee(Hbar.from(500000, HbarUnit.Tinybar));

    return new SimpleHederaClientImpl(client, privateKey);
  }

  async getNodeStakingInfo(nodeId?: number): Promise<MirrorStakingInfo[]> {
    const result: MirrorStakingInfo[] = [];

    let url = `${this.mirrorNodeUrl}/api/v1/network/nodes`;

    if (_.isNull(nodeId)) {
      url = `${url}?order=desc&limit=50`;
    } else {
      url = `${url}?node.id=${nodeId as number}`;
    }

    const response: FetchResponse = await fetchDataFromUrl(url);
    if (response.success) {
      for (const node of response.data.nodes) {
        result.push(node);
      }

      if (response.data.links.next) {
        const secondUrl = `${this.mirrorNodeUrl}${
          response.data.links.next as string
        }`;
        const secondResponse: FetchResponse = await fetchDataFromUrl(secondUrl);
        if (secondResponse.success) {
          for (const node of secondResponse.data.nodes) {
            result.push(node);
          }
        }
      }
    }

    return result;
  }

  async getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
  ): Promise<AccountInfo> {
    let result = {} as MirrorAccountInfo;
    const url = `${this.mirrorNodeUrl}/api/v1/accounts/${idOrAliasOrEvmAddress}`;
    const response: FetchResponse = await fetchDataFromUrl(url);
    if (!response.success) {
      return {} as AccountInfo;
    }

    result = response.data as MirrorAccountInfo;

    const hbars = result.balance.balance / 1e8;
    const tokens: Record<string, TokenBalance> = {};
    // Use map to create an array of promises
    const tokenPromises = result.balance.tokens.map(async (token: Token) => {
      const tokenId = token.token_id;
      const tokenInfo: MirrorTokenInfo = await this.getTokenById(tokenId);
      tokens[tokenId] = {
        balance: token.balance / Math.pow(10, Number(tokenInfo.decimals)),
        decimals: Number(tokenInfo.decimals),
        tokenId,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        tokenType: tokenInfo.type,
        supplyType: tokenInfo.supply_type,
        totalSupply: (
          Number(tokenInfo.total_supply) /
          Math.pow(10, Number(tokenInfo.decimals))
        ).toString(),
        maxSupply: (
          Number(tokenInfo.max_supply) /
          Math.pow(10, Number(tokenInfo.decimals))
        ).toString(),
      } as TokenBalance;
    });

    // Wait for all promises to resolve
    await Promise.all(tokenPromises);

    return {
      accountId: result.account,
      alias: result.alias,
      createdTime: timestampToString(result.created_timestamp),
      expirationTime: timestampToString(result.expiry_timestamp),
      memo: result.memo,
      evmAddress: result.evm_address,
      key: {
        type: result.key._type,
        key: result.key.key,
      },
      balance: {
        hbars,
        timestamp: timestampToString(result.balance.timestamp),
        tokens,
      } as AccountBalance,
      autoRenewPeriod: String(result.auto_renew_period),
      ethereumNonce: String(result.ethereum_nonce),
      isDeleted: result.deleted,
      stakingInfo: {
        declineStakingReward: result.decline_reward,
        stakePeriodStart: timestampToString(result.stake_period_start),
        pendingReward: String(result.pending_reward),
        stakedToMe: '0', // TODO
        stakedAccountId: result.staked_account_id ?? '',
        stakedNodeId: result.staked_node_id ?? '',
      } as StakingInfoJson,
    } as AccountInfo;
  }

  async getTokenById(tokenId: string): Promise<MirrorTokenInfo> {
    let result = {} as MirrorTokenInfo;
    const url = `${this.mirrorNodeUrl}/api/v1/tokens/${tokenId}`;
    const response: FetchResponse = await fetchDataFromUrl(url);
    if (response.success) {
      result = response.data;
    }
    return result;
  }

  async getMirrorTransactions(
    accountId: string,
    transactionId: string,
  ): Promise<MirrorTransactionInfo[]> {
    let result = [] as MirrorTransactionInfo[];
    let url = `${this.mirrorNodeUrl}/api/v1/transactions/`;
    if (_.isEmpty(transactionId)) {
      url = `${url}?account.id=${accountId}&limit=50&order=desc`;
    } else {
      url = `${url}${transactionId}`;
    }

    const response: FetchResponse = await fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    result = response.data.transactions as MirrorTransactionInfo[];

    result.forEach((transaction) => {
      transaction.consensus_timestamp = timestampToString(
        transaction.consensus_timestamp,
      );
      transaction.parent_consensus_timestamp = timestampToString(
        transaction.parent_consensus_timestamp,
      );
      transaction.valid_start_timestamp = timestampToString(
        transaction.valid_start_timestamp,
      );
    });

    return result;
  }
}

/**
 * Does the operator key belong to the operator account.
 *
 * @param client - Hedera Client.
 */
async function testClientOperatorMatch(client: Client) {
  const tx = new TransferTransaction()
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    .addHbarTransfer(client.operatorAccountId!, Hbar.fromTinybars(0))
    .setMaxTransactionFee(Hbar.fromTinybars(1));

  try {
    await tx.execute(client);
  } catch (error: any) {
    if (error instanceof StatusError) {
      if (
        error.status === Status.InsufficientTxFee ||
        error.status === Status.InsufficientPayerBalance
      ) {
        // If the transaction fails with Insufficient Tx Fee, this means
        // that the account ID verification succeeded before this point
        // Same for Insufficient Payer Balance

        return true;
      }

      return false;
    }

    throw providerErrors.unauthorized(
      `The account id does not belong to the associated private key: ${String(
        error,
      )}`,
    );
  }

  // under *no* cirumstances should this transaction succeed
  throw providerErrors.unauthorized(
    'Unexpected success of intentionally-erroneous transaction to confirm account ID',
  );
}

/**
 * To HederaAccountInfo.
 *
 * @param _curve - Curve that was used to derive the keys('ECDSA_SECP256K1' | 'ED25519').
 * @param _privateKey - Private Key.
 * @param _accountId - Account Id.
 * @param _network - Network.
 */
export async function getHederaClient(
  _curve: string,
  _privateKey: string,
  _accountId: string,
  _network: string,
): Promise<SimpleHederaClient | null> {
  const accountId = AccountId.fromString(_accountId);

  let privateKey: PrivateKey;
  if (_curve === 'ECDSA_SECP256K1') {
    privateKey = PrivateKey.fromStringECDSA(_privateKey);
  } else if (_curve === 'ED25519') {
    privateKey = PrivateKey.fromStringED25519(_privateKey);
  } else {
    console.error('Invalid curve type');
    return null;
  }

  const wallet: Wallet = new PrivateKeySoftwareWallet(privateKey);
  const hederaService = new HederaServiceImpl(_network);

  const client = await hederaService.createClient({
    wallet,
    keyIndex: 0,
    accountId,
  });

  if (client === null || _.isEmpty(client)) {
    console.error('Invalid private key or account Id of the operator');
    return null;
  }
  return client;
}
