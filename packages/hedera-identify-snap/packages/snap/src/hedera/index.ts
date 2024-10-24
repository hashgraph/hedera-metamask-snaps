/*-
 *
 * Hedera Identify Snap
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

import {
  AccountId,
  Client,
  Hbar,
  Status,
  StatusError,
  TransferTransaction,
} from '@hashgraph/sdk';

import _ from 'lodash';

import { SimpleHederaClientImpl } from './client';
import { HederaMirrorInfo, HederaService, SimpleHederaClient } from './service';
import { WalletHedera } from './wallet/abstract';

export class HederaServiceImpl implements HederaService {
  private network: string;

  constructor(network: string) {
    this.network = network;
  }

  async createClient(options: {
    walletHedera: WalletHedera;
    keyIndex: number;
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null> {
    if (options.walletHedera === null) {
      return null;
    }

    let client: Client;

    if (this.network === 'testnet') {
      client = Client.forTestnet();
    } else if (this.network === 'previewnet') {
      client = Client.forPreviewnet();
    } else {
      client = Client.forMainnet();
    }

    client.setNetworkUpdatePeriod(2000);

    const transactionSigner = await options.walletHedera.getTransactionSigner(
      options.keyIndex,
    );

    const privateKey = await options.walletHedera.getPrivateKey(
      options.keyIndex,
    );
    const publicKey = await options.walletHedera.getPublicKey(options.keyIndex);

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
      console.log('failed testClientOperatorMatch');
      return null;
    }

    return new SimpleHederaClientImpl(client, privateKey);
  }

  async getAccountFromPublicKey(
    publicKey: string,
  ): Promise<HederaMirrorInfo | null> {
    // Returns all account information for the given public key
    const network =
      this.network === 'mainnet' ? 'mainnet-public' : this.network;
    const accountInfoUrl = `https://${network}.mirrornode.hedera.com/api/v1/accounts?account.publickey=${publicKey}&limit=1&order=asc`;
    const accountInfoResult = await mirrorNodeQuery(accountInfoUrl);

    if (
      !(
        accountInfoResult.accounts &&
        accountInfoResult.accounts.length > 0 &&
        accountInfoResult.accounts[0].account
      )
    ) {
      console.log(
        `Could not retrieve info about this evm address from hedera mirror node for some reason. Please try again later`,
      );
      return null;
    }

    const result = accountInfoResult.accounts[0];
    const createdDate = new Date(
      (result.created_timestamp.split('.')[0] as number) * 1000,
    ).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      second: '2-digit',
    });
    const expiryDate = new Date(
      (result.expiry_timestamp.split('.')[0] as number) * 1000,
    ).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      second: '2-digit',
    });
    return {
      account: result.account,
      evmAddress: result.evm_address,
      publicKey,
      alias: result.alias,
      balance: result.balance.balance / 100000000.0,
      createdDate,
      expiryDate,
      memo: result.memo,
    } as HederaMirrorInfo;
  }

  async getAccountFromEvmAddres(
    evmAddress: string,
  ): Promise<HederaMirrorInfo | null> {
    try {
      // Returns all account information for the given evmAddress
      const network =
        this.network === 'mainnet' ? 'mainnet-public' : this.network;
      const accountInfoUrl = `https://${network}.mirrornode.hedera.com/api/v1/accounts/${evmAddress}?limit=1&order=asc`;
      const result = await mirrorNodeQuery(accountInfoUrl);

      if (result === null || _.isEmpty(result) || !result.account) {
        console.log(
          `Could not retrieve info about this evm address from hedera mirror node for some reason. Please try again later`,
        );
        return null;
      }

      const createdDate = new Date(
        (result.created_timestamp.split('.')[0] as number) * 1000,
      ).toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      });
      const expiryDate = new Date(
        (result.expiry_timestamp.split('.')[0] as number) * 1000,
      ).toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      });
      return {
        account: result.account,
        evmAddress: result.evm_address,
        alias: result.alias,
        balance: result.balance.balance / 100000000.0,
        createdDate,
        expiryDate,
        memo: result.memo,
      } as HederaMirrorInfo;
    } catch (error) {
      console.log(
        'Error while retrieving account info using evm address from the mirror node. Error: ',
        error,
      );
      return null;
    }
  }
}

/**
 * Does the operator key belong to the operator account.
 *
 * @param client - Hedera Client.
 */
export async function testClientOperatorMatch(client: Client) {
  const tx = new TransferTransaction()
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    .addHbarTransfer(client.operatorAccountId!, Hbar.fromTinybars(0))
    .setMaxTransactionFee(Hbar.fromTinybars(1));

  try {
    await tx.execute(client);
  } catch (error: any) {
    console.log('error: ', JSON.stringify(error, null, 4));
    if (error instanceof StatusError) {
      // If the transaction fails with Insufficient Tx Fee, this means
      // that the account ID verification succeeded before this point
      // Same for Insufficient Payer Balance
      return (
        error.status === Status.InsufficientTxFee ||
        error.status === Status.InsufficientPayerBalance
      );
    }

    const errMessage =
      'The account id does not belong to the associated private key';
    console.log(errMessage, String(error));
    throw new Error(errMessage);
  }

  // under *no* cirumstances should this transaction succeed
  const errMessage =
    'Unexpected success of intentionally-erroneous transaction to confirm account ID';
  console.log(errMessage);
  throw new Error(errMessage);
}

/**
 * Retrieve results using hedera mirror node.
 *
 * @param url - The URL to use to query.
 */
export async function mirrorNodeQuery(url: RequestInfo | URL) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * To HederaAccountInfo.
 *
 * @param _address - EVM address.
 * @param _accountId - Account Id.
 * @param _network - Network.
 */
export async function isValidHederaAccountInfo(
  _address: string,
  _accountId: string,
  _network: string,
): Promise<boolean> {
  try {
    const hederaService = new HederaServiceImpl(_network);
    const result = (await hederaService.getAccountFromEvmAddres(
      _address,
    )) as HederaMirrorInfo;

    if (result === null || _.isEmpty(result)) {
      console.error(`Response from mirror node is empty`);
      return false;
    }

    if (result.account !== _accountId) {
      console.error(
        `The accountId for the given evm address does not match the accountId that was passed`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      'Error while retrieving account info using evm address from the mirror node. Error: ',
      error,
    );
    return false;
  }

  return true;
}
