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

import { createContext, Dispatch } from 'react';
import { Snap } from '../types';

export type MetamaskState = {
  isFlask: boolean;
  installedSnap?: Snap;
  error?: Error;
};

export const initialState: MetamaskState = {
  isFlask: false,
  error: undefined,
};

export type MetamaskDispatch = { type: MetamaskActions; payload: any };

export const MetaMaskContext = createContext<
  [MetamaskState, Dispatch<MetamaskDispatch>]
>([
  initialState,
  () => {
    /* no op */
  },
]);

export enum MetamaskActions {
  SetInstalled = 'SetInstalled',
  SetFlaskDetected = 'SetFlaskDetected',
  SetError = 'SetError',
}
