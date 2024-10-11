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
