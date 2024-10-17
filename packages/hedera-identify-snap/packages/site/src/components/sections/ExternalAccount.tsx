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

import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import Form from 'react-bootstrap/Form';
import { ExternalAccountParams } from '../../types';
import { getCurrentNetwork } from '../../utils';
import { validHederaChainID } from '../../utils/hedera';

export type GetExternalAccountRef = {
  handleGetAccountParams: () => ExternalAccountParams | undefined;
};

const ExternalAccount = forwardRef(({}, ref: Ref<GetExternalAccountRef>) => {
  const [externalAccount, setExternalAccount] = useState(false);
  const [extraData, setExtraData] = useState('');
  const [currentChainId, setCurrentChainId] = useState('');

  useEffect(() => {
    async function fetchData() {
      const chainId = await getCurrentNetwork();
      setCurrentChainId(chainId);
    }
    fetchData();
  }, []);

  const isHederaNetwork = useMemo(
    () => validHederaChainID(currentChainId),
    [currentChainId],
  );

  useImperativeHandle(ref, () => ({
    handleGetAccountParams() {
      const blockchainType = isHederaNetwork ? 'hedera' : 'evm';
      const data =
        blockchainType === 'hedera'
          ? { accountId: extraData }
          : { address: extraData };
      let params;
      if (externalAccount) {
        params = {
          externalAccount: {
            blockchainType,
            data,
          },
        };
      }
      return params;
    },
  }));

  return (
    <>
      <Form>
        <Form.Check
          type="checkbox"
          id="external-account-checkbox"
          label="External Account"
          onChange={(e) => {
            setExternalAccount(e.target.checked);
          }}
        />
        <Form.Label>
          {isHederaNetwork ? 'Account Id' : 'EVM Address'}
        </Form.Label>
        <Form.Control
          size="lg"
          type="text"
          placeholder={isHederaNetwork ? 'Account Id' : 'EVM Address'}
          style={{ marginBottom: 8 }}
          onChange={(e) => setExtraData(e.target.value)}
        />
      </Form>
    </>
  );
});

export default ExternalAccount;
