import { FC, useContext } from 'react';
import { MetaMaskContext } from '../../contexts/MetamaskContext';
import { shouldDisplayReconnectButton } from '../../utils';
import { Card, ReconnectButton } from '../base';

type Props = {
  handleConnectClick: () => Promise<void>;
};

const ReconnectPulseSnap: FC<Props> = ({ handleConnectClick }) => {
  const [state] = useContext(MetaMaskContext);

  return shouldDisplayReconnectButton(state.installedSnap) ? (
    <Card
      content={{
        title: 'Reconnect to Hedera Pulse Snap',
        description:
          'While connected to a local running snap, this button will always be displayed in order to update the snap if a change is made.',
        button: (
          <ReconnectButton
            onClick={handleConnectClick}
            disabled={!state.installedSnap}
          />
        ),
      }}
      disabled={!state.installedSnap}
    />
  ) : null;
};

export { ReconnectPulseSnap };
