import { FC, useContext } from 'react';
import { MetaMaskContext } from '../../contexts/MetamaskContext';
import { Card, ConnectButton } from '../base';

type Props = {
  handleConnectClick: () => Promise<void>;
};

const ConnectIdentitySnap: FC<Props> = ({ handleConnectClick }) => {
  const [state] = useContext(MetaMaskContext);

  if (state.installedSnap) {
    return null;
  }

  return (
    <Card
      content={{
        title: 'Connect to Identify Snap',
        description:
          'Get started by connecting to and installing the Identify Snap.',
        button: (
          <ConnectButton
            onClick={handleConnectClick}
            disabled={!state.isFlask}
          />
        ),
      }}
      disabled={!state.isFlask}
    />
  );
};

export { ConnectIdentitySnap };
