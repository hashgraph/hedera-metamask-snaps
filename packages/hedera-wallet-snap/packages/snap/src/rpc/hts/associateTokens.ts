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
import { TxReceipt } from '../../types/hedera';
import { HederaServiceImpl } from '../../services/impl/hedera';
import { createHederaClient } from '../../snap/account';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { updateSnapState } from '../../snap/state';
import { AssociateTokensRequestParams } from '../../types/params';
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
 * @param associateTokensRequestParams - Parameters for associating tokens to the account.
 * @returns Receipt of the transaction.
 */
export async function associateTokens(
  walletSnapParams: WalletSnapParams,
  associateTokensRequestParams: AssociateTokensRequestParams,
): Promise<TxReceipt> {
  const { origin, state, mirrorNodeUrl } = walletSnapParams;

  const { tokenIds = [] as string[] } = associateTokensRequestParams;

  const { hederaEvmAddress, hederaAccountId, network } = state.currentAccount;

  const { privateKey, curve } =
    state.accountState[hederaEvmAddress][network].keyStore;

  let mirrorNodeUrlToUse = mirrorNodeUrl;
  if (_.isEmpty(mirrorNodeUrlToUse)) {
    mirrorNodeUrlToUse =
      state.accountState[hederaEvmAddress][network].mirrorNodeUrl;
  }

  let txReceipt = {} as TxReceipt;
  try {
    const panelToShow = [
      heading('Associate Tokens'),
      text(
        'Are you sure you want to associate the following tokens to your account?',
      ),
      divider(),
    ];
    const hederaService = new HederaServiceImpl(network, mirrorNodeUrlToUse);
    for (const tokenId of tokenIds) {
      const tokenNumber = tokenIds.indexOf(tokenId) + 1;
      panelToShow.push(text(`Token #${tokenNumber}`));
      panelToShow.push(divider());

      panelToShow.push(text(`Asset Id: ${tokenId}`));
      const tokenInfo = await hederaService.getTokenById(tokenId);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        panelToShow.push(text(errMessage));
        panelToShow.push(
          text(`Proceed only if you are sure this asset ID exists`),
        );
      } else {
        panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
        panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
        panelToShow.push(text(`Symbol: ${tokenInfo.symbol}`));
        panelToShow.push(
          text(
            `Total Supply: ${(
              Number(tokenInfo.total_supply) /
              Math.pow(10, Number(tokenInfo.decimals))
            ).toString()}`,
          ),
        );
        panelToShow.push(
          text(
            `Max Supply: ${(
              Number(tokenInfo.max_supply) /
              Math.pow(10, Number(tokenInfo.decimals))
            ).toString()}`,
          ),
        );
      }
      panelToShow.push(text(tokenId));
      panelToShow.push(divider());
    }

    const dialogParams: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await snapDialog(dialogParams);
    if (!confirmed) {
      console.error(`User rejected the transaction`);
      throw providerErrors.userRejectedRequest();
    }

    const hederaClient = await createHederaClient(
      curve,
      privateKey,
      hederaAccountId,
      network,
    );
    txReceipt = await hederaClient.associateTokens({ tokenIds });

    state.accountState[hederaEvmAddress][network].mirrorNodeUrl =
      mirrorNodeUrlToUse;
    await updateSnapState(state);
  } catch (error: any) {
    const errMessage = `Error while trying to associate tokens to the account: ${String(
      error,
    )}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return txReceipt;
}
