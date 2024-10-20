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

import { MetaMaskInpageProvider } from '@metamask/providers';
import { IIdentifier, MinimalImportableKey } from '@veramo/core';
import { getDidKeyIdentifier } from '../did/key/keyDidUtils';
import { HederaServiceImpl } from '../hedera';
import { getHederaNetwork, validHederaChainID } from '../hedera/config';
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
import { generateWallet } from '../utils/keyPair';
import { convertChainIdFromHex } from '../utils/network';
import { getHederaAccountIfExists } from '../utils/params';
import { getVeramoAgent } from './agent';

export const getCurrentMetamaskAccount = async (): Promise<string> => {
  const metamask = (window as any).ethereum as MetaMaskInpageProvider;
  const accounts = (await metamask.request({
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
  metamask: MetaMaskInpageProvider,
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
    if (validHederaChainID(chainId)) {
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

    const res = await generateWallet(address);

    if (!res) {
      console.log('Failed to generate snap wallet for DID operations');
      throw new Error('Failed to generate snap wallet for DID operations');
    }
    privateKey = res.privateKey;
    publicKey = res.publicKey;
    snapAddress = res.address.toLowerCase();

    if (validHederaChainID(chainId)) {
      hederaAccountId = await getHederaAccountIfExists(
        state,
        undefined,
        address,
      );

      if (!hederaAccountId) {
        const hederaService = new HederaServiceImpl(getHederaNetwork(network));
        const result = await hederaService.getAccountFromEvmAddres(address);
        if (!result) {
          console.error(
            `Could not retrieve hedera account info for address '${address}'. Please make sure this account is activated on Hedera '${getHederaNetwork(network)}'`,
          );
          throw new Error(
            `Could not retrieve hedera account info for address '${address}'. Please make sure this account is activated on Hedera '${getHederaNetwork(network)}'`,
          );
        }
        hederaAccountId = result.account;
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
    did = `did:hedera:${hederaAccountId}`;
  }

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
