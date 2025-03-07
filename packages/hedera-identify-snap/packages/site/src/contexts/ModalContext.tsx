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

export type ModalType = {
  title: string;
  content: string;
};

const ModalContext = createContext<{
  show: boolean;
  setShow: (showing: boolean) => void;
  modalData: ModalType | undefined;
  setModalData: (data: ModalType) => void;
}>({
  show: false,
  setShow: (showing: boolean) => {
    console.log('Not initialized', showing);
  },
  modalData: undefined,
  setModalData: (data: ModalType) => {
    console.log('Not initialized', data);
  },
});

const ModalContextProvider = ({ children }: PropsWithChildren<any>) => {
  const [show, setShow] = useState(false);
  const [modalData, setModalData] = useState<ModalType | undefined>(undefined);

  return (
    <ModalContext.Provider value={{ show, setShow, modalData, setModalData }}>
      {children}
    </ModalContext.Provider>
  );
};

export { ModalContext, ModalContextProvider };
