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

import { FC, useContext } from 'react';
import { MetaMaskContext } from '../../contexts/MetamaskContext';
import { shouldDisplayReconnectButton } from '../../utils';
import { Card, SendHelloButton } from '../base';

const Todo: FC = () => {
  const [state] = useContext(MetaMaskContext);

  const handleTodoClick = async () => {
    console.log('Not implemented');
  };

  return (
    <Card
      content={{
        title: 'todo',
        description: 'TODO',
        /* form: (
              <form>
                <label>
                  Enter your Verifiable Presentation
                  <input
                    type="text"
                    value={JSON.stringify(vp)}
                    onChange={(e) => setVp(e.target.value)}
                  />
                </label>
              </form>
            ), */
        button: (
          <SendHelloButton
            buttonText="todo"
            onClick={handleTodoClick}
            disabled={!state.installedSnap}
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

export { Todo };
