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

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
import { HcsDid } from '@tuum-tech/hedera-did-sdk-js';
import {
  IAgentContext,
  IIdentifier,
  IKey,
  IKeyManager,
  IService,
  TKeyType,
} from '@veramo/core';
import { AbstractIdentifierProvider } from '@veramo/did-manager';
import _ from 'lodash';
import { IdentifySnapState } from '../../types/state';
import { getHcsDidClient } from './hederaDidUtils';

type IContext = IAgentContext<IKeyManager>;
type CreateHederaDidOptions = {
  keyType?: keyof typeof keyCodecs;
  privateKeyHex?: string;
};

const keyCodecs = {
  Ed25519: 'ed25519-pub',
  Secp256k1: 'secp256k1-pub',
} as const;

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:hedera` identifiers
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class HederaDIDProvider extends AbstractIdentifierProvider {
  private defaultKms: string;
  private hederaDidClient?: HcsDid;
  private keyCurve: string = '';

  constructor(options: { defaultKms: string }) {
    super();
    this.defaultKms = options.defaultKms;
  }

  static async createWithState(options: {
    defaultKms: string;
    state: IdentifySnapState;
  }): Promise<HederaDIDProvider> {
    const provider = new HederaDIDProvider(options);

    const hederaDidClient = await getHcsDidClient(options.state);
    if (!hederaDidClient) {
      console.error('Failed to create HcsDid client');
      throw new Error('Failed to create HcsDid client');
    }
    provider.hederaDidClient = hederaDidClient;
    provider.keyCurve =
      options.state.accountState[options.state.currentAccount.snapEvmAddress][
        options.state.currentAccount.network
      ].keyStore.curve;
    return provider;
  }

  async createIdentifier(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { kms, options }: { kms?: string; options?: any },
    context: IContext,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    if (!this.hederaDidClient) {
      console.error('HcsDid client is not initialized');
      throw new Error('HcsDid client is not initialized');
    }

    let did = '';
    // Try registering the DID
    try {
      const registeredDid = await this.hederaDidClient!.register();
      did = registeredDid.getIdentifier() || '';
    } catch (e: any) {
      console.error(`Failed to register DID: ${e}`);
      throw new Error(`Failed to register DID: ${e}`);
    }

    if (_.isEmpty(did)) {
      throw new Error('Failed to create Hedera DID');
    }

    const key = await context.agent.keyManagerCreate({
      kms: kms || this.defaultKms,
      type: this.keyCurve as TKeyType,
    });

    const identifier: Omit<IIdentifier, 'provider'> = {
      did,
      controllerKeyId: key.kid,
      keys: [key],
      services: [],
    };
    return identifier;
  }

  async updateIdentifier(
    args: {
      did: string;
      kms?: string | undefined;
      alias?: string | undefined;
      options?: any;
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<IIdentifier> {
    throw new Error('HederaDIDProvider updateIdentifier not supported yet.');
  }

  async deleteIdentifier(
    identifier: IIdentifier,
    context: IContext,
  ): Promise<boolean> {
    try {
      await this.hederaDidClient!.delete();
    } catch (e: any) {
      console.error(`Failed to delete DID: ${e}`);
      throw new Error(`Failed to delete DID: ${e}`);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const { kid } of identifier.keys) {
      // eslint-disable-next-line no-await-in-loop
      await context.agent.keyManagerDelete({ kid });
    }
    return true;
  }

  async addKey(
    {
      identifier,
      key,
      options,
    }: { identifier: IIdentifier; key: IKey; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('HederaDIDProvider addKey not supported');
  }

  async addService(
    {
      identifier,
      service,
      options,
    }: { identifier: IIdentifier; service: IService; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('HederaDIDProvider addService not supported');
  }

  async removeKey(
    args: { identifier: IIdentifier; kid: string; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('HederaDIDProvider removeKey not supported');
  }

  async removeService(
    args: { identifier: IIdentifier; id: string; options?: any },
    context: IContext,
  ): Promise<any> {
    throw Error('HederaDIDProvider removeService not supported');
  }
}
