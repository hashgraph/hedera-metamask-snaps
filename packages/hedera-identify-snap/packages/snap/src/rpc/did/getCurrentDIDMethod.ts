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

import { IdentitySnapParams } from '../../interfaces';

/**
 * Function to get available methods.
 *
 * @param identitySnapParams - Identity snap params.
 */
export async function getCurrentDIDMethod(
  identitySnapParams: IdentitySnapParams,
): Promise<string> {
  const { state } = identitySnapParams;
  return state.snapConfig.dApp.didMethod;
}
