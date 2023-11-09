import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import {
  Account,
  GetAccountInfoRequestParams,
  ServiceFee,
} from '../../types/snap';
import { getAccountInfo, shouldDisplayReconnectButton } from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const GetAccountInfo: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [accountId, setAccountId] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetAccountInfoClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const TUUMESERVICEADDRESS = '0.0.98'; // Hedera Fee collection account
      const serviceFee = {
        percentageCut: 0, // Change this if you want to charge a service fee
        toAddress: TUUMESERVICEADDRESS,
      } as ServiceFee;

      const getAccountInfoParams = {
        accountId: accountId || undefined,
        serviceFee,
      } as GetAccountInfoRequestParams;
      const response: any = await getAccountInfo(
        network,
        mirrorNodeUrl,
        getAccountInfoParams,
        externalAccountParams,
      );

      const { accountInfo, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('accountInfo: ', JSON.stringify(accountInfo, null, 4));
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
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter an account Id
              <input
                type="text"
                style={{ width: '100%' }}
                value={accountId}
                placeholder="Account Id(can be empty)"
                onChange={(e) => setAccountId(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
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
