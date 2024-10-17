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

import { FC, useContext, useRef, useState } from 'react';
import Select from 'react-select';
import { storeOptions } from '../../config/constants';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import { VcContext } from '../../contexts/VcContext';
import useModal from '../../hooks/useModal';
import { IDataManagerClearResult } from '../../types/veramo';
import {
  deleteAllVCs,
  getCurrentMetamaskAccount,
  getCurrentNetwork,
  shouldDisplayReconnectButton,
} from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
  setCurrentChainId: React.Dispatch<React.SetStateAction<string>>;
};

const DeleteAllVCs: FC<Props> = ({ setMetamaskAddress, setCurrentChainId }) => {
  const { setVcId, setVcIdsToBeRemoved } = useContext(VcContext);
  const [state, dispatch] = useContext(MetaMaskContext);
  const [selectedOptions, setSelectedOptions] = useState([storeOptions[0]]);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleChange = (options: any) => {
    setSelectedOptions(options);
  };

  const handleDeleteAllVCsClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const selectedStore = selectedOptions.map((option) => option.value);
      const options = {
        // If you want to remove the VCs from multiple stores, you can pass an array like so:
        // store: ['snap', 'googleDrive'],
        ...(selectedStore.length ? { store: selectedStore } : {}),
      };
      const isRemoved = (await deleteAllVCs(
        metamaskAddress,
        options,
        externalAccountParams,
      )) as IDataManagerClearResult[];
      console.log(`Remove VC Result: ${JSON.stringify(isRemoved, null, 4)}`);
      showModal({
        title: 'Remove VC Result',
        content: JSON.stringify(isRemoved, null, 4),
      });
      setVcId('');
      setVcIdsToBeRemoved('');
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'deleteAllVCs',
        description: 'Delete all the VCs from the snap',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>Select store</label>
            <Select
              closeMenuOnSelect
              isMulti
              isSearchable={false}
              isClearable={false}
              options={storeOptions}
              value={selectedOptions}
              onChange={handleChange}
              styles={{
                control: (base: any) => ({
                  ...base,
                  border: `1px solid grey`,
                  marginBottom: 8,
                }),
              }}
            />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Delete all VCs"
            onClick={handleDeleteAllVCsClick}
            disabled={!state.installedSnap}
            loading={loading}
          />
        ),
      }}
      disabled={!state.installedSnap}
      fullWidth={
        state.isFlask &&
        Boolean(state.installedSnap) &&
        !shouldDisplayReconnectButton(state.installedSnap)
      }
    />
  );
};

export { DeleteAllVCs };
