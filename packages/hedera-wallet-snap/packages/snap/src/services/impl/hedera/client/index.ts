import {
  Hbar,
  type AccountId,
  type Client,
  type PrivateKey,
  type PublicKey,
} from '@hashgraph/sdk';

import { AccountInfo } from '../../../../types/account';
import {
  AccountBalance,
  SimpleHederaClient,
  SimpleTransfer,
  TxReceipt,
} from '../../../hedera';
import { getAccountBalance } from './getAccountBalance';
import { getAccountInfo } from './getAccountInfo';
import { transferCrypto } from './transferCrypto';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  // eslint-disable-next-line no-restricted-syntax
  private readonly _client: Client;

  // eslint-disable-next-line no-restricted-syntax
  private readonly _privateKey: PrivateKey | null;

  constructor(client: Client, privateKey: PrivateKey | null) {
    this._client = client;
    this._privateKey = privateKey;
  }

  setMaxQueryPayment(cost: any): void {
    const costInHbar = new Hbar(cost);
    // this sets the fee paid by the client for the query
    this._client.setMaxQueryPayment(costInHbar);
  }

  getClient(): Client {
    return this._client;
  }

  getPrivateKey(): PrivateKey | null {
    return this._privateKey;
  }

  getPublicKey(): PublicKey {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorPublicKey!;
  }

  getAccountId(): AccountId {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorAccountId!;
  }

  async getAccountInfo(accountId: string): Promise<AccountInfo> {
    return getAccountInfo(this._client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return getAccountBalance(this._client);
  }

  async transferCrypto(options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null;
    serviceFeesToPay: Record<string, number> | null;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  }): Promise<TxReceipt> {
    return transferCrypto(this._client, options);
  }
}
