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

import type { WalletSnapParams } from '../../types/state';
import type {
  GetAccountInfoRequestParams,
  ServiceFee,
} from '../../types/params';
import _ from 'lodash';
import type { AccountInfo } from '../../types/account';
import { AccountInfoQuery } from '@hashgraph/sdk';
import { FeeUtils } from '../../utils/FeeUtils';
import type { DialogParams } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import { SnapUtils } from '../../utils/SnapUtils';
import { providerErrors } from '@metamask/rpc-errors';
import { SnapState } from '../../snap/SnapState';
import { HederaUtils } from '../../utils/HederaUtils';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';

export class GetAccountInfoFacade {
  public static async getAccountInfo(
    walletSnapParams: WalletSnapParams,
    getAccountInfoParams: GetAccountInfoRequestParams,
  ) {
    const { origin, state } = walletSnapParams;

    const {
      accountId = '',
      serviceFee = {
        percentageCut: 0,
        toAddress: '0.0.98', // Hedera Fee collection account
      } as ServiceFee,
      fetchUsingMirrorNode = true,
    } = getAccountInfoParams;

    const { hederaAccountId, hederaEvmAddress, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let accountIdToQuery = hederaAccountId;
    let selfAccountId = true;
    if (!_.isEmpty(accountId)) {
      accountIdToQuery = accountId;
      if (accountIdToQuery !== hederaAccountId) {
        selfAccountId = false;
      }
    }

    let accountInfo = {} as AccountInfo;

    try {
      if (fetchUsingMirrorNode) {
        console.log('Retrieving account info using Hedera Mirror node');
        accountInfo = await HederaUtils.getMirrorAccountInfo(
          accountIdToQuery,
          mirrorNodeUrl,
        );
      } else {
        const hederaClientFactory = new HederaClientImplFactory(
          hederaAccountId,
          network,
          curve,
          privateKey,
        );
        const hederaClient = await hederaClientFactory.createClient();

        // Create the account info query
        const query = new AccountInfoQuery({ accountId: accountIdToQuery });
        if (hederaClient === null) {
          throw new Error('hedera client returned null');
        }
        const queryCost = (
          await query.getCost(hederaClient.getClient())
        ).toBigNumber();

        const { serviceFeeToPay, maxCost } = FeeUtils.calculateHederaQueryFees(
          queryCost,
          serviceFee.percentageCut,
        );

        const panelToShow = [
          heading('Get account info'),
          text(
            `Note that since you didn't pass 'mirrorNodeUrl' parameter, the snap will query the Hedera Ledger node to retrieve the account information and this may have the following costs associated with the query. Also, the token balance data will not be updated. If you want to update the complete account data and want to do it for free, be sure to pass 'mirrorNodeUrl' in your parameter.`,
          ),
          divider(),
          text(
            `Estimated Query Fee: ${queryCost
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} Hbar`,
          ),
        ];

        if (serviceFee.percentageCut > 0) {
          panelToShow.push(
            text(
              `Service Fee: ${serviceFeeToPay
                .toFixed(8)
                .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} Hbar`,
            ),
          );
        }
        panelToShow.push(
          ...[
            text(
              `Estimated Max Query Fee: ${maxCost
                .toFixed(8)
                .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} Hbar`,
            ),
            divider(),
          ],
        );

        const dialogParamsForHederaAccountId: DialogParams = {
          type: 'confirmation',
          content: await SnapUtils.generateCommonPanel(
            origin,
            network,
            mirrorNodeUrl,
            panelToShow,
          ),
        };
        const confirmed = await SnapUtils.snapDialog(
          dialogParamsForHederaAccountId,
        );
        if (!confirmed) {
          console.error(`User rejected the transaction`);
          throw providerErrors.userRejectedRequest();
        }

        accountInfo = await hederaClient.getAccountInfo(accountIdToQuery);

        if (selfAccountId) {
          accountInfo.alias =
            state.accountState[hederaEvmAddress][network].accountInfo.alias;
          accountInfo.createdTime =
            state.accountState[hederaEvmAddress][
              network
            ].accountInfo.createdTime;
          accountInfo.key =
            state.accountState[hederaEvmAddress][network].accountInfo.key;
          accountInfo.balance.tokens =
            state.accountState[hederaEvmAddress][
              network
            ].accountInfo.balance.tokens;
        }

        // Deduct service Fee if set
        if (serviceFee.percentageCut > 0) {
          await FeeUtils.deductServiceFee(
            serviceFeeToPay,
            serviceFee.toAddress as string,
            hederaClient,
          );
        }
      }

      // Only change the state if we are retrieving account Id of the currently logged in user
      // Only change the values for which is necessary
      if (selfAccountId) {
        state.accountState[hederaEvmAddress][network].accountInfo = accountInfo;
        state.currentAccount.balance = accountInfo.balance;
        state.accountState[hederaEvmAddress][network].mirrorNodeUrl =
          mirrorNodeUrl;
        await SnapState.updateState(state);
      }
    } catch (error: any) {
      console.error(`Error while trying to get account info: ${String(error)}`);
      throw providerErrors.unsupportedMethod(
        `Error while trying to get account info: ${String(error)}`,
      );
    }

    return accountInfo;
  }
}
