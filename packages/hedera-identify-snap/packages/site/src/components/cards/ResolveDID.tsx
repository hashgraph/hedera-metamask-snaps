import { FC, useContext, useRef, useState } from 'react';
import Form from 'react-bootstrap/esm/Form';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import {
  getCurrentMetamaskAccount,
  getCurrentNetwork,
  resolveDID,
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

const ResolveDID: FC<Props> = ({ setMetamaskAddress, setCurrentChainId }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [did, setDid] = useState('');
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleResolveDIDClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const doc = await resolveDID(metamaskAddress, did, externalAccountParams);
      console.log(`Your DID document is : ${JSON.stringify(doc, null, 4)}`);
      showModal({
        title: 'Resolve DID',
        content: `Your DID document is: ${JSON.stringify(doc, null, 4)}`,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'resolveDID',
        description: 'Resolve the DID and return a DID document',
        form: (
          <>
            <Form.Control
              size="lg"
              type="text"
              placeholder="DID"
              style={{ marginBottom: 8 }}
              onChange={(e) => setDid(e.target.value)}
            />
            <ExternalAccount ref={externalAccountRef} />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Resolve DID"
            onClick={handleResolveDIDClick}
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

export { ResolveDID };
