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
    const client = Client.forNetwork(this.network as any);

    // NOTE: important, ensure that we pre-compute the health state of all nodes
    await client.pingAll();

    const transactionSigner = await options.walletHedera.getTransactionSigner(
      options.keyIndex,
    );
    const privateKey = await options.walletHedera.getPrivateKey(
      options.keyIndex,
    );
    const publicKey = await options.walletHedera.getPublicKey(options.keyIndex);

    if (publicKey === null) {
      console.error('Public key is null');
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

    console.log(
      'getAccountFromPublicKey - result: ',
      JSON.stringify(accountInfoResult, null, 4),
    );

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
    // Returns all account information for the given evmAddress
    const network =
      this.network === 'mainnet' ? 'mainnet-public' : this.network;
    const accountInfoUrl = `https://${network}.mirrornode.hedera.com/api/v1/accounts/${evmAddress}?limit=1&order=asc`;
    const result = await mirrorNodeQuery(accountInfoUrl);

    console.log(
      'getAccountFromEvmAddres - result: ',
      JSON.stringify(result, null, 4),
    );

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
  } catch (err) {
    if (err instanceof StatusError) {
      if (
        err.status === Status.InsufficientTxFee ||
        err.status === Status.InsufficientPayerBalance
      ) {
        // If the transaction fails with Insufficient Tx Fee, this means
        // that the account ID verification succeeded before this point
        // Same for Insufficient Payer Balance
        return true;
      }
      return false;
    }

    console.error(
      `Error while validating private key and account id: ${JSON.stringify(
        err,
        null,
        4,
      )}`,
    );
    throw new Error(
      `Error while validating private key and account id: ${JSON.stringify(
        err,
        null,
        4,
      )}`,
    );
  }

  // under *no* cirumstances should this transaction succeed
  throw new Error(
    'unexpected success of intentionally-erroneous transaction to confirm account ID',
  );
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
