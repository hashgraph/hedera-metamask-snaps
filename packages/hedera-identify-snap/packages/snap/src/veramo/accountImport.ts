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

import { PrivateKey } from '@hashgraph/sdk';
import { rpcErrors } from '@metamask/rpc-errors';
import { DidError, HcsDid } from '@tuum-tech/hedera-did-sdk-js';
import { IIdentifier, MinimalImportableKey } from '@veramo/core';
import _ from 'lodash';
import { getDidKeyIdentifier } from '../did/key/keyDidUtils';
import { HederaClient } from '../hedera/client/hederaClient';

import {
  Account,
  AccountViaPrivateKey,
  IdentitySnapState,
} from '../interfaces';
import { getCurrentNetwork } from '../snap/network';
import {
  getCurrentCoinType,
  initAccountState,
  updateState,
} from '../snap/state';
import { AccountInfo, NetworkInfo } from '../types/hedera';
import { CryptoUtils } from '../utils/cryptoUtils';
import { HederaUtils } from '../utils/hederaUtils';
import { convertChainIdFromHex } from '../utils/network';
import { getHederaAccountIfExists } from '../utils/params';
import { getVeramoAgent } from './agent';

export const getCurrentMetamaskAccount = async (): Promise<string> => {
  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

/**
 * Veramo Import metamask account.
 *
 * @param snap - SnapsGlobalObject.
 * @param state - IdentitySnapState.
 * @param metamask - MetaMaskInpageProvider.
 * @param evmAddress - Ethereum address.
 * @param accountViaPrivateKey - Account info if imported via private key directly(only used for Hedera accounts currently).
 * @returns Account.
 */
export async function veramoImportMetaMaskAccount(
  network: string,
  state: IdentitySnapState,
  evmAddress: string,
  accountViaPrivateKey?: AccountViaPrivateKey,
): Promise<Account> {
  const chainId = await getCurrentNetwork();

  let privateKey: string;
  let publicKey: string;
  let address: string = evmAddress.toLowerCase();
  let snapAddress = '';
  let hederaAccountId = '';

  if (accountViaPrivateKey) {
    privateKey = accountViaPrivateKey.privateKey;
    publicKey = accountViaPrivateKey.publicKey;
    address = accountViaPrivateKey.address.toLowerCase();
    snapAddress = address;
    if (HederaUtils.validHederaChainID(chainId)) {
      hederaAccountId = accountViaPrivateKey.extraData as string;
    }
  } else {
    // Verify if the user is connected to the correct wallet
    const connectedAddress = await getCurrentMetamaskAccount();
    if (address !== connectedAddress) {
      console.log(
        `You are currently connected to '${connectedAddress}. Please connect to the account '${address}' via Metamask first`,
      );
      throw new Error(
        `You are currently connected to '${connectedAddress}. Please connect to the account '${address}' via Metamask first`,
      );
    }

    const res = await CryptoUtils.generateWallet(address);

    if (!res) {
      console.log('Failed to generate snap wallet for DID operations');
      throw new Error('Failed to generate snap wallet for DID operations');
    }
    privateKey = res.privateKey;
    publicKey = res.publicKey;
    snapAddress = res.address.toLowerCase();

    if (HederaUtils.validHederaChainID(chainId)) {
      hederaAccountId = await getHederaAccountIfExists(
        state,
        undefined,
        address,
      );

      if (!hederaAccountId) {
        const networkInfo: NetworkInfo =
          HederaUtils.getHederaNetworkInfo(network);
        const accountInfo: AccountInfo = await HederaUtils.getMirrorAccountInfo(
          address,
          networkInfo.mirrorNodeUrl,
        );
        if (_.isEmpty(accountInfo)) {
          const errMessage = `Could not retrieve hedera account info for address '${address}'. Please make sure this account is activated on Hedera '${networkInfo.network}'`;
          console.error(errMessage);
          throw rpcErrors.resourceNotFound({
            message: errMessage,
            data: { network: networkInfo.network, address, publicKey },
          });
        }
        hederaAccountId = accountInfo.accountId;
      }
    }
  }

  // Initialize if not there
  const coinType = (await getCurrentCoinType()).toString();
  if (address && !(address in state.accountState[coinType])) {
    console.log(
      `The address ${address} has NOT yet been configured in the Identify Snap. Configuring now...`,
    );
    await initAccountState(state, coinType, address);
  }
  // eslint-disable-next-line
  state.accountState[coinType][address].extraData = hederaAccountId;

  const method = state.snapConfig.dApp.didMethod;

  let did = '';
  if (method === 'did:pkh') {
    did = `did:pkh:eip155:${convertChainIdFromHex(chainId)}:${snapAddress}`;
  } else if (method === 'did:key') {
    did = `did:key:${await getDidKeyIdentifier(publicKey)}`;
  } else if (method === 'did:hedera') {
    const networkInfo: NetworkInfo = HederaUtils.getHederaNetworkInfo(network);
    console.log(
      hederaAccountId,
      networkInfo.network,
      privateKey,
      publicKey,
      snapAddress,
    );
    const hederaClientFactory = new HederaClient(
      hederaAccountId,
      networkInfo.network,
      'ECDSA_SECP256K1',
      privateKey,
    );
    const client = await hederaClientFactory.createClient();
    if (!client) {
      console.error('Failed to create Hedera client');
      throw new Error('Failed to create Hedera client');
    }

    let didToUse = new HcsDid({
      privateKey: PrivateKey.fromStringECDSA(privateKey),
      client: client.getClient(),
    });
    // Try registering the DID if not registered previously
    try {
      const registeredDid = await didToUse.register();
      did = registeredDid.getIdentifier() || '';
    } catch (e: any) {
      if (e instanceof DidError) {
        const didDocument = await didToUse.resolve();
        did = didDocument.getId();
      } else {
        console.error(`Failed to register DID: ${e}`);
        throw new Error(`Failed to register DID: ${e}`);
      }
    }
    did = `did:hedera:${hederaAccountId}`;
  }

  console.log('did : ', did);
  did = '';
  if (!did) {
    console.log('Failed to generate DID');
    throw new Error('Failed to generate DID');
  }

  // eslint-disable-next-line
  state.currentAccount.metamaskAddress = address;
  state.currentAccount.snapAddress = snapAddress;
  state.currentAccount.method = method;
  state.currentAccount.privateKey = privateKey;
  state.currentAccount.publicKey = publicKey;
  state.currentAccount.extraData = hederaAccountId;

  // Get Veramo agent
  const agent = await getVeramoAgent(state);
  const controllerKeyId = `metamask-${address}`;
  console.log(
    `Importing using did=${did}, provider=${method}, controllerKeyId=${controllerKeyId}...`,
  );

  let identifier: IIdentifier;
  // Get identifier if it exists
  try {
    identifier = await agent.didManagerGet({
      did,
    });
  } catch (error) {
    try {
      identifier = await agent.didManagerImport({
        did,
        provider: method,
        controllerKeyId,
        keys: [
          {
            kid: controllerKeyId,
            type: 'Secp256k1',
            kms: 'snap',
            privateKeyHex: privateKey.split('0x')[1],
            publicKeyHex: publicKey.split('0x')[1],
          } as MinimalImportableKey,
        ],
      });
    } catch (e) {
      console.log(`Error while creating identifier: ${(e as Error).message}`);
      throw new Error(
        `Error while creating identifier: ${(e as Error).message}`,
      );
    }
  }
  await updateState(state);
  console.log('Identifier imported successfully: ', identifier);

  return {
    metamaskAddress: address,
    snapAddress,
    method,
    identifier,
    privateKey,
    publicKey,
  } as Account;
}
