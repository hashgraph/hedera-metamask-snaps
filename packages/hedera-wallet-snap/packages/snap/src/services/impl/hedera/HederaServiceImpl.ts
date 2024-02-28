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
  NftId,
  PrivateKey,
  Status,
  StatusError,
  TokenId,
  TransferTransaction,
} from '@hashgraph/sdk';
import _ from 'lodash';

import { StakingInfoJson } from '@hashgraph/sdk/lib/StakingInfo';
import { providerErrors } from '@metamask/rpc-errors';
import { Wallet } from '../../../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../../../domain/wallet/software-private-key';
import { AccountInfo } from '../../../types/account';
import {
  AccountBalance,
  HederaService,
  MirrorAccountInfo,
  MirrorNftInfo,
  MirrorStakingInfo,
  MirrorTokenInfo,
  MirrorTransactionInfo,
  SimpleHederaClient,
  Token,
  TokenBalance,
} from '../../../types/hedera';
import { FetchResponse, FetchUtils } from '../../../utils/FetchUtils';
import { Utils } from '../../../utils/Utils';
import { SimpleHederaClientImpl } from './client/SimpleHederaClientImpl';

export class HederaServiceImpl implements HederaService {
  // eslint-disable-next-line no-restricted-syntax
  private readonly network: string;

  // eslint-disable-next-line no-restricted-syntax
  public readonly mirrorNodeUrl: string;

  constructor(network: string, mirrorNodeUrl: string) {
    this.network = network;
    this.mirrorNodeUrl = mirrorNodeUrl;
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
    // client.setDefaultMaxTransactionFee(new Hbar(1));

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

    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    try {
      for (const node of response.data.nodes) {
        result.push(node);
      }

      if (response.data.links.next) {
        const secondUrl = `${this.mirrorNodeUrl}${
          response.data.links.next as string
        }`;
        const secondResponse: FetchResponse = await FetchUtils.fetchDataFromUrl(
          secondUrl,
        );
        if (secondResponse.success) {
          for (const node of secondResponse.data.nodes) {
            result.push(node);
          }
        }
      }
    } catch (error: any) {
      console.error('Error in getNodeStakingInfo:', String(error));
    }

    return result;
  }

  async getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
  ): Promise<AccountInfo> {
    const result = {} as AccountInfo;
    const url = `${this.mirrorNodeUrl}/api/v1/accounts/${idOrAliasOrEvmAddress}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    const mirrorNodeData = response.data as MirrorAccountInfo;

    try {
      result.accountId = mirrorNodeData.account;
      result.alias = mirrorNodeData.alias;
      result.createdTime = Utils.timestampToString(
        mirrorNodeData.created_timestamp,
      );
      result.expirationTime = Utils.timestampToString(
        mirrorNodeData.expiry_timestamp,
      );
      result.memo = mirrorNodeData.memo;
      result.evmAddress = mirrorNodeData.evm_address;
      result.key = {
        type: mirrorNodeData.key._type,
        key: mirrorNodeData.key.key,
      };
      result.autoRenewPeriod = String(mirrorNodeData.auto_renew_period);
      result.ethereumNonce = String(mirrorNodeData.ethereum_nonce);
      result.isDeleted = mirrorNodeData.deleted;
      result.stakingInfo = {
        declineStakingReward: mirrorNodeData.decline_reward,
        stakePeriodStart: Utils.timestampToString(
          mirrorNodeData.stake_period_start,
        ),
        pendingReward: String(mirrorNodeData.pending_reward),
        stakedToMe: '0', // TODO
        stakedAccountId: mirrorNodeData.staked_account_id ?? '',
        stakedNodeId: mirrorNodeData.staked_node_id ?? '',
      } as StakingInfoJson;

      const hbars = mirrorNodeData.balance.balance / 1e8;
      const tokens: Record<string, TokenBalance> = {};
      // Use map to create an array of promises
      const tokenPromises = mirrorNodeData.balance.tokens.map(
        async (token: Token) => {
          const tokenId = token.token_id;
          const tokenInfo: MirrorTokenInfo = await this.getTokenById(tokenId);
          if (tokenInfo.type === 'NON_FUNGIBLE_UNIQUE') {
            const nfts: MirrorNftInfo[] = await this.getNftSerialNumber(
              tokenId,
              result.accountId,
            );
            nfts.forEach((nftInfo) => {
              const nftId = new NftId(
                TokenId.fromString(tokenId),
                Number(nftInfo.serial_number),
              );
              tokens[nftId.toString()] = {
                balance: 1,
                decimals: 0,
                tokenId,
                nftSerialNumber: nftInfo.serial_number,
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
          } else {
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
          }
        },
      );

      // Wait for all promises to resolve
      await Promise.all(tokenPromises);

      result.balance = {
        hbars,
        timestamp: Utils.timestampToString(mirrorNodeData.balance.timestamp),
        tokens,
      } as AccountBalance;
    } catch (error: any) {
      console.error('Error in getMirrorAccountInfo:', String(error));
    }

    return result;
  }

  async getTokenById(tokenId: string): Promise<MirrorTokenInfo> {
    let result = {} as MirrorTokenInfo;
    const url = `${this.mirrorNodeUrl}/api/v1/tokens/${tokenId}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (response.success) {
      result = response.data;
    }
    return result;
  }

  async getNftSerialNumber(
    tokenId: string,
    accountId: string,
  ): Promise<MirrorNftInfo[]> {
    let result = [] as MirrorNftInfo[];
    const url = `${this.mirrorNodeUrl}/api/v1/tokens/${tokenId}/nfts?account.id=${accountId}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (response.success) {
      result = response.data.nfts;
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

    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    try {
      result = response.data.transactions as MirrorTransactionInfo[];

      result.forEach((transaction) => {
        transaction.consensus_timestamp = Utils.timestampToString(
          transaction.consensus_timestamp,
        );
        transaction.parent_consensus_timestamp = Utils.timestampToString(
          transaction.parent_consensus_timestamp,
        );
        transaction.valid_start_timestamp = Utils.timestampToString(
          transaction.valid_start_timestamp,
        );
      });
    } catch (error: any) {
      console.error('Error in getMirrorTransactions:', String(error));
    }

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
      // If the transaction fails with Insufficient Tx Fee, this means
      // that the account ID verification succeeded before this point
      // Same for Insufficient Payer Balance
      return (
        error.status === Status.InsufficientTxFee ||
        error.status === Status.InsufficientPayerBalance
      );
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
 * @param _mirrorNodeUrl - Mirror Node Url.
 */
export async function getHederaClient(
  _curve: string,
  _privateKey: string,
  _accountId: string,
  _network: string,
  _mirrorNodeUrl: string,
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
  const hederaService = new HederaServiceImpl(_network, _mirrorNodeUrl);

  const client = await hederaService.createClient({
    wallet,
    keyIndex: 0,
    accountId,
  });

  if (_.isEmpty(client)) {
    console.error('Invalid private key or account Id of the operator');
    return null;
  }
  return client;
}
