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
import {
  IAgentContext,
  IIdentifier,
  IKey,
  IKeyManager,
  IService,
} from '@veramo/core';
import { AbstractIdentifierProvider } from '@veramo/did-manager';
import _ from 'lodash';
import { IdentifySnapState } from '../../types/state';
import { getHcsDidClient } from './hederaDidUtils';

type IContext = IAgentContext<IKeyManager>;
type CreateHederaDidOptions = {
  keyType?: keyof typeof keyCodecs;
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
  private state: IdentifySnapState;

  constructor(options: { defaultKms: string; state: IdentifySnapState }) {
    super();
    this.defaultKms = options.defaultKms;
    this.state = options.state;
  }

  async createIdentifier(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { kms, options }: { kms?: string; options?: CreateHederaDidOptions },
    context: IContext,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const keyType =
      (options?.keyType && keyCodecs[options?.keyType] && options.keyType) ||
      'Secp256k1';

    const hederaDidClient = await getHcsDidClient(this.state);
    if (!hederaDidClient) {
      console.error('Failed to create HcsDid client');
      throw new Error('Failed to create HcsDid client');
    }

    let did = '';
    // Try registering the DID
    try {
      const registeredDid = await hederaDidClient.register();
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
      type: keyType,
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
      const hederaDidClient = await getHcsDidClient(this.state);
      if (!hederaDidClient) {
        console.error('Failed to create HcsDid client');
        throw new Error('Failed to create HcsDid client');
      }
      await hederaDidClient.delete();
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
