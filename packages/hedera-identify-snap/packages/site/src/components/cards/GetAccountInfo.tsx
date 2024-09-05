import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import {
  PublicAccountInfo,
  getAccountInfo,
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
  setAccountInfo: React.Dispatch<React.SetStateAction<PublicAccountInfo>>;
};

const GetAccountInfo: FC<Props> = ({
  setMetamaskAddress,
  setCurrentChainId,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetAccountInfoClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const accountInfo = await getAccountInfo(
        metamaskAddress,
        externalAccountParams,
      );
      console.log(`Your account info:`, accountInfo);
      setAccountInfo(accountInfo as PublicAccountInfo);
      showModal({
        title: 'Your account info',
        content: JSON.stringify(accountInfo),
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
        title: 'getAccountInfo',
        description: 'Get the current account information',
        form: <ExternalAccount ref={externalAccountRef} />,
        button: (
          <SendHelloButton
            buttonText="Get Account Info"
            onClick={handleGetAccountInfoClick}
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

export { GetAccountInfo };
