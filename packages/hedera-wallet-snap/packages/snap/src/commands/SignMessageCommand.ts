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

import type { SnapDialogParams, WalletSnapParams } from '../types/state';
import type { SignMessageRequestParams } from '../types/params';
import { heading, text } from '@metamask/snaps-ui';
import { SnapUtils } from '../utils/SnapUtils';
import { providerErrors } from '@metamask/rpc-errors';
import { ethers, type Wallet } from 'ethers';
import { PrivateKey } from '@hashgraph/sdk';
import type { Wallet as HederaWallet } from '../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../domain/wallet/software-private-key';
import { CryptoUtils } from '../utils/CryptoUtils';

export class SignMessageCommand {
  readonly #walletSnapParams: WalletSnapParams;

  readonly #signMessageRequestParams: SignMessageRequestParams;

  constructor(
    walletSnapParams: WalletSnapParams,
    signMessageRequestParams: SignMessageRequestParams,
  ) {
    this.#walletSnapParams = walletSnapParams;
    this.#signMessageRequestParams = signMessageRequestParams;
  }

  async execute(): Promise<string> {
    const { origin, state } = this.#walletSnapParams;

    const { header = 'Do you want to sign this message?', message } =
      this.#signMessageRequestParams;

    const { hederaEvmAddress, network } = state.currentAccount;

    const { privateKey: pk, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let signature = '';
    try {
      const panelToShow = [
        heading('Signature request'),
        text(header),
        text(message),
      ];
      const dialogParamsForSignMessage: SnapDialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParamsForSignMessage);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      if (curve === 'ECDSA_SECP256K1') {
        const wallet: Wallet = new ethers.Wallet(pk);
        signature = await wallet.signMessage(message);
      } else if (curve === 'ED25519') {
        const privateKey = PrivateKey.fromStringED25519(pk);
        const wallet: HederaWallet = new PrivateKeySoftwareWallet(privateKey);
        const signer = await wallet.getTransactionSigner(0);

        signature = CryptoUtils.uint8ArrayToHex(
          await signer(CryptoUtils.stringToUint8Array(message)),
        );
      }
      if (!signature.startsWith('0x')) {
        signature = `0x${signature}`;
      }
    } catch (error: any) {
      const errMessage = `Error while trying to sign message: ${String(error)}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return signature;
  }
}
