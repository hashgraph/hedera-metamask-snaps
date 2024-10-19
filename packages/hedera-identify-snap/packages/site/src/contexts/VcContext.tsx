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

import { createContext, PropsWithChildren, useState } from 'react';

const VcContext = createContext({
  vcId: '',
  setVcId: (vcId: string) => {
    console.log('Not initialized', vcId);
  },
  vc: {},
  setVc: (vc: any) => {
    console.log('Not initialized', vc);
  },
  vcIdsToBeRemoved: '',
  setVcIdsToBeRemoved: (ids: any) => {
    console.log('Not initialized', ids);
  },
  vp: {},
  setVp: (vp: any) => {
    console.log('Not initialized', vp);
  },
});

const VcContextProvider = ({ children }: PropsWithChildren<any>) => {
  const [vcId, setVcId] = useState('');
  const [vc, setVc] = useState({});
  const [vp, setVp] = useState({});
  const [vcIdsToBeRemoved, setVcIdsToBeRemoved] = useState('');

  return (
    <VcContext.Provider
      value={{
        vcId,
        setVcId,
        vc,
        setVc,
        vcIdsToBeRemoved,
        setVcIdsToBeRemoved,
        vp,
        setVp,
      }}
    >
      {children}
    </VcContext.Provider>
  );
};

export { VcContext, VcContextProvider };
