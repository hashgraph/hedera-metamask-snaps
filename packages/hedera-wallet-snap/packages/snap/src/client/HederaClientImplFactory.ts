/*-
 *
 * Hedera Wallet Snap
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
  Client,
  Hbar,
  PrivateKey,
  Status,
  StatusError,
  TransferTransaction,
} from '@hashgraph/sdk';
import { providerErrors } from '@metamask/rpc-errors';
import type { Wallet } from '../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../domain/wallet/software-private-key';
import type { HederaClientFactory } from '../snap/interfaces/HederaClientFactory';
import { SimpleHederaClientImpl } from './SimpleHederaClientImpl';

/**
 * To HederaAccountInfo.
 * @param _curve - Curve that was used to derive the keys('ECDSA_SECP256K1' | 'ED25519').
 * @param _privateKey - Private Key.
 * @param _accountId - Account Id.
 * @param _network - Network.
 */

export class HederaClientImplFactory implements HederaClientFactory {
  readonly #wallet: Wallet | null;

  readonly #keyIndex: number;

  readonly #accountId: string;

  readonly #network: string;

  readonly #curve: string;

  readonly #privateKey: string;

  constructor(
    accountId: string,
    network: string,
    curve: string,
    privateKey: string,
    keyIndex = 0, // note that 0 is default here for the first key in a HD wallet
  ) {
    this.#keyIndex = keyIndex;
    this.#accountId = accountId;
    this.#network = network;
    this.#curve = curve;
    this.#privateKey = privateKey;
    this.#wallet = this.walletFromPrivateKeyString();
  }

  walletFromPrivateKeyString(): Wallet | null {
    let myPrivateKey: PrivateKey;

    if (this.#curve === 'ECDSA_SECP256K1') {
      myPrivateKey = PrivateKey.fromStringECDSA(this.#privateKey);
    } else if (this.#curve === 'ED25519') {
      myPrivateKey = PrivateKey.fromStringED25519(this.#privateKey);
    } else {
      console.error('Invalid curve type');
      return null;
    }

    return new PrivateKeySoftwareWallet(myPrivateKey);
  }

  public async createClient(): Promise<SimpleHederaClientImpl | null> {
    if (this.#wallet === null) {
      return null;
    }

    let client: Client;

    if (this.#network === 'testnet') {
      client = Client.forTestnet();
    } else if (this.#network === 'previewnet') {
      client = Client.forPreviewnet();
    } else {
      client = Client.forMainnet();
    }

    client.setNetworkUpdatePeriod(2000);

    const transactionSigner = await this.#wallet.getTransactionSigner(
      this.#keyIndex,
    );

    const privateKey = await this.#wallet.getPrivateKey(this.#keyIndex);
    const publicKey = await this.#wallet.getPublicKey(this.#keyIndex);

    if (publicKey === null) {
      return null;
    }

    // TODO: Fix
    client.setOperatorWith(this.#accountId, publicKey ?? '', transactionSigner);

    if (!(await this.testClientOperatorMatch(client))) {
      return null;
    }

    return new SimpleHederaClientImpl(client, privateKey);
  }

  /**
   * Does the operator key belong to the operator account.
   * @param client - Hedera Client.
   * @returns True if the operator key belongs to the operator account.
   */
  async testClientOperatorMatch(client: Client) {
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
}
