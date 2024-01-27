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

import { PrivateKey } from '@hashgraph/sdk';
import { providerErrors } from '@metamask/rpc-errors';
import { heading, text } from '@metamask/snaps-ui';
import { Wallet, ethers } from 'ethers';
import { Wallet as HederaWallet } from '../../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../../domain/wallet/software-private-key';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { updateSnapState } from '../../snap/state';
import { SignMessageRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';
import { stringToUint8Array, uint8ArrayToHex } from '../../utils/crypto';

/**
 * Sign an arbitary message.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param signMessageRequestParams - Parameters for signing message.
 * @returns Account Balance.
 */
export async function signMessage(
  walletSnapParams: WalletSnapParams,
  signMessageRequestParams: SignMessageRequestParams,
): Promise<string> {
  const { origin, state } = walletSnapParams;

  const { header = 'Do you want to sign this message?', message } =
    signMessageRequestParams;

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
      content: await generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await snapDialog(dialogParamsForSignMessage);
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

      signature = uint8ArrayToHex(await signer(stringToUint8Array(message)));
    }
    if (!signature.startsWith('0x')) {
      signature = `0x${signature}`;
    }

    await updateSnapState(state);
  } catch (error: any) {
    const errMessage = `Error while trying to sign message: ${String(error)}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return signature;
}
