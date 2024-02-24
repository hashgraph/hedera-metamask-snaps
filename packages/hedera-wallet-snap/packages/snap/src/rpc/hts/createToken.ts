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

import { providerErrors } from '@metamask/rpc-errors';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { HederaClientFactory } from '../../snap/HederaClientFactory';
import { SnapUtils } from '../../utils/SnapUtils';
import { TxReceipt } from '../../types/hedera';
import { CreateTokenRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';

/**
 * Associates the provided Hedera account with the provided Hedera token(s).
 *
 * Hedera accounts must be associated with a fungible or non-fungible token first
 * before you can transfer tokens to that account.  In the case of NON_FUNGIBLE Type,
 * once an account is associated, it can hold any number of NFTs (serial numbers)
 * of that token type. There is currently no limit on the number of token IDs that
 * can be associated with an account (reference HIP-367). Still, you can see
 * TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED responses for pre-HIP-367 transactions.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param createTokenRequestParams - Parameters for creating a token.
 * @returns Receipt of the transaction.
 */
export async function createToken(
  walletSnapParams: WalletSnapParams,
  createTokenRequestParams: CreateTokenRequestParams,
): Promise<TxReceipt> {
  const { origin, state } = walletSnapParams;

  const { hederaEvmAddress, hederaAccountId, network } = state.currentAccount;

  const {
    assetType,
    name,
    symbol,
    decimals,
    initialSupply = 0,
    kycPublicKey,
    freezePublicKey,
    pausePublicKey,
    wipePublicKey,
    supplyPublicKey,
    feeSchedulePublicKey,
    freezeDefault = false,
    expirationTime,
    autoRenewAccountId = hederaAccountId,
    tokenMemo = 'Created via Hedera Wallet Snap',
    customFees,
    supplyType = 'INFINITE',
    maxSupply = 0,
  } = createTokenRequestParams;

  const { privateKey, publicKey, curve } =
    state.accountState[hederaEvmAddress][network].keyStore;

  let txReceipt = {} as TxReceipt;
  try {
    const panelToShow = [
      heading('Create a token'),
      text(
        'Learn more about creating tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/define-a-token)',
      ),
      text(
        `You are about to create a ${
          assetType === 'TOKEN' ? 'Fungible Token' : 'Non Fungible Token(NFT)'
        } with the following details:`,
      ),
      divider(),
      text(`Name: ${name}`),
      text(`Symbol: ${symbol}`),
      text(`Supply Type: ${supplyType}`),
    ];
    if (assetType === 'TOKEN') {
      panelToShow.push(
        text(`Initial Supply: ${initialSupply}`),
        text(`Decimals: ${decimals}`),
      );
    }
    panelToShow.push(
      text(`Max Supply: ${supplyType === 'INFINITE' ? 'Infinite' : maxSupply}`),
      text(`Auto Renew Account ID: ${autoRenewAccountId}`),
      text(`Token Memo: ${tokenMemo}`),
      text(`Freeze Default: ${freezeDefault}`),
      text(
        `Admin Key: ${
          publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey
        }`,
      ),
      text(`Treasury Account: ${hederaAccountId}`),
      text(
        `KYC Public Key: ${
          _.isEmpty(kycPublicKey) ? 'Not set' : (kycPublicKey as string)
        }`,
      ),
      text(
        `Freeze Public Key: ${
          _.isEmpty(freezePublicKey) ? 'Not set' : (freezePublicKey as string)
        }`,
      ),
      text(
        `Pause Public Key: ${
          _.isEmpty(pausePublicKey) ? 'Not set' : (pausePublicKey as string)
        }`,
      ),
      text(
        `Wipe Public Key: ${
          _.isEmpty(wipePublicKey) ? 'Not set' : (wipePublicKey as string)
        }`,
      ),
      text(
        `Supply Public Key: ${
          _.isEmpty(supplyPublicKey) ? 'Not set' : (supplyPublicKey as string)
        }`,
      ),
      text(
        `Fee Schedule Public Key: ${
          _.isEmpty(feeSchedulePublicKey)
            ? 'Not set'
            : (feeSchedulePublicKey as string)
        }`,
      ),
      text(
        `Custom Fees: ${_.isEmpty(customFees) ? 'Not set' : 'Set as follows'}`,
      ),
    );
    if (expirationTime) {
      panelToShow.push(text(`Expiration Time: ${expirationTime}`));
    }
    if (customFees) {
      panelToShow.push(divider());
      for (const customFee of customFees) {
        panelToShow.push(
          text(`Fee Collector Account ID: ${customFee.feeCollectorAccountId}`),
        );
        if (customFee.hbarAmount) {
          panelToShow.push(text(`HBAR Amount: ${customFee.hbarAmount}`));
        }
        if (customFee.tokenAmount) {
          panelToShow.push(text(`Token Amount: ${customFee.tokenAmount}`));
        }
        if (customFee.denominatingTokenId) {
          panelToShow.push(
            text(`Denominating Token ID: ${customFee.denominatingTokenId}`),
          );
        }
        if (customFee.allCollectorsAreExempt) {
          panelToShow.push(
            text(
              `All Collectors Are Exempt: ${
                customFee.allCollectorsAreExempt as boolean
              }`,
            ),
          );
        }
      }
      panelToShow.push(divider());
    }

    const dialogParams: SnapDialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await SnapUtils.snapDialog(dialogParams);
    if (!confirmed) {
      console.error(`User rejected the transaction`);
      throw providerErrors.userRejectedRequest();
    }

    const hederaClient = await HederaClientFactory.create(
      curve,
      privateKey,
      hederaAccountId,
      network,
    );
    txReceipt = await hederaClient.createToken({
      assetType,
      name,
      symbol,
      decimals,
      supplyType,
      initialSupply,
      maxSupply,
      expirationTime,
      autoRenewAccountId,
      tokenMemo,
      freezeDefault,
      kycPublicKey,
      freezePublicKey,
      pausePublicKey,
      wipePublicKey,
      supplyPublicKey,
      feeSchedulePublicKey,
      customFees,
    });
  } catch (error: any) {
    const errMessage = `Error while trying to create a token: ${String(error)}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return txReceipt;
}
