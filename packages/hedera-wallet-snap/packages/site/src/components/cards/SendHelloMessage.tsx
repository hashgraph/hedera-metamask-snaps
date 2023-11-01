import { FC, useContext } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import { Account } from '../../types/snap';
import { sendHello, shouldDisplayReconnectButton } from '../../utils';
import { Card, SendHelloButton } from '../base';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const SendHelloHessage: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleSendHelloClick = async () => {
    try {
      const response: any = await sendHello(network, mirrorNodeUrl);
      setAccountInfo(response.currentAccount);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <Card
      content={{
        title: 'Send Hello message',
        description:
          'Display a custom message within a confirmation screen in MetaMask.',
        button: (
          <SendHelloButton
            buttonText="Send message"
            onClick={handleSendHelloClick}
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

export { SendHelloHessage };
