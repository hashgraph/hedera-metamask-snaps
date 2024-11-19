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
import { IDataManagerQueryResult } from '../../types/veramo';
import {
  getCurrentMetamaskAccount,
  getCurrentNetwork,
  getVCs,
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

const GetAllVCs: FC<Props> = ({ setMetamaskAddress, setCurrentChainId }) => {
  const { setVcId, setVc, setVcIdsToBeRemoved } = useContext(VcContext);
  const [state, dispatch] = useContext(MetaMaskContext);
  const [selectedOptions, setSelectedOptions] = useState([storeOptions[0]]);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleChange = (options: any) => {
    setSelectedOptions(options);
  };

  const handleGetVCsClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const selectedStore = selectedOptions.map((option) => option.value);
      const options = {
        // If you want to retrieve VCs from multiple stores, you can pass an array like so:
        // store: ['snap', 'googleDrive'],
        ...(selectedStore.length ? { store: selectedStore } : {}),
        returnStore: true,
      };
      const vcs = (await getVCs(
        undefined,
        options,
        externalAccountParams,
      )) as IDataManagerQueryResult[];
      console.log(`Your VCs are: ${JSON.stringify(vcs, null, 4)}`);
      if (vcs.length > 0) {
        const keys = vcs.map((vc: { metadata: any }) => vc.metadata.id);
        if (keys.length > 0) {
          setVcId(keys.toString());
          setVcIdsToBeRemoved(keys.toString());
          setVc(vcs[keys.length - 1].data as IDataManagerQueryResult);
        }

        showModal({
          title: 'Your VCs',
          content: JSON.stringify(vcs, null, 4),
        });
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'getAllVCs',
        description: 'Get all the VCs of the user',
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
            buttonText="Retrieve all VCs"
            onClick={handleGetVCsClick}
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

export { GetAllVCs };
