import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import { Account, GetTransactionsRequestParams } from '../../types/snap';
import { getTransactions, shouldDisplayReconnectButton } from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const GetTransactions: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [transactionId, setTransactionId] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetTransactionsClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const getTransactionsParams = {
        transactionId: transactionId || undefined,
      } as GetTransactionsRequestParams;
      const response: any = await getTransactions(
        network,
        mirrorNodeUrl,
        getTransactionsParams,
        externalAccountParams,
      );

      const { transactions, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.groupCollapsed('Transactions: ', transactions.length);
      console.log(JSON.stringify(transactions, null, 4));
      console.groupEnd();
      showModal({
        title: 'Number of transactions',
        content: transactions.length,
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
        title: 'getTransactions',
        description: 'Get the transactions history',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter a transaction Id
              <input
                type="text"
                style={{ width: '100%' }}
                value={transactionId}
                placeholder="Transaction Id(can be empty in which case it will fetch all transactions)"
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Get Transactions"
            onClick={handleGetTransactionsClick}
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

export { GetTransactions };
