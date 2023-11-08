/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';

import _ from 'lodash';
import { getAccountBalance } from './rpc/account/getAccountBalance';
import { getAccountInfo } from './rpc/account/getAccountInfo';
import { transferCrypto } from './rpc/account/transferCrypto';
import { setCurrentAccount } from './snap/account';
import { getSnapStateUnchecked } from './snap/state';
import { WalletSnapParams } from './types/state';
import { init } from './utils/init';
import {
  getMirrorNodeFlagIfExists,
  isExternalAccountFlagSet,
  isValidGetAccountInfoRequest,
  isValidTransferCryptoParams,
} from './utils/params';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('Request:', JSON.stringify(request, null, 4));
  console.log('Origin:', origin);
  console.log('-------------------------------------------------------------');
  console.log(
    'request.params=========',
    JSON.stringify(request.params, null, 4),
  );

  let state = await getSnapStateUnchecked();
  if (state === null || _.isEmpty(state)) {
    state = await init(origin);
  }

  let isExternalAccount = false;
  if (isExternalAccountFlagSet(request.params)) {
    isExternalAccount = true;
  }

  const mirrorNodeUrl = getMirrorNodeFlagIfExists(request.params);

  await setCurrentAccount(
    origin,
    state,
    request.params,
    mirrorNodeUrl,
    isExternalAccount,
  );
  console.log(
    `Current account: ${JSON.stringify(state.currentAccount, null, 4)}`,
  );

  const walletSnapParams: WalletSnapParams = {
    origin,
    state,
    mirrorNodeUrl,
  };

  switch (request.method) {
    case 'hello':
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });
      return {
        currentAccount: state.currentAccount,
      };
    case 'getAccountInfo': {
      isValidGetAccountInfoRequest(request.params);
      return {
        currentAccount: state.currentAccount,
        accountInfo: await getAccountInfo(walletSnapParams, request.params),
      };
    }
    case 'getAccountBalance': {
      return {
        currentAccount: state.currentAccount,
        accountBalance: await getAccountBalance(walletSnapParams),
      };
    }
    case 'transferCrypto': {
      isValidTransferCryptoParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await transferCrypto(walletSnapParams, request.params),
      };
    }
    default:
      throw new Error('Method not found.');
  }
};
