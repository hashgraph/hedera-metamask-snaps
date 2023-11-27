import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import {
  Account,
  ServiceFee,
  SimpleTransfer,
  TransferCryptoRequestParams,
} from '../../types/snap';
import { shouldDisplayReconnectButton, transferCrypto } from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const TransferCrypto: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [sendToAddress, setSendToAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [sendAmount, setSendAmount] = useState(0);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleTransferCryptoClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const transfers: SimpleTransfer[] = [
        {
          asset: 'HBAR',
          to: sendToAddress,
          amount: sendAmount,
        } as SimpleTransfer,
      ];
      // const maxFee = 1; // Note that if you don't pass this, default is 1 HBAR

      const TUUMESERVICEADDRESS = '0.0.98'; // Hedera Fee collection account
      const serviceFee = {
        percentageCut: 0, // Change this if you want to charge a service fee
        toAddress: TUUMESERVICEADDRESS,
      } as ServiceFee;

      const transferCryptoParams = {
        transfers,
        memo,
        undefined,
        serviceFee,
      } as TransferCryptoRequestParams;

      const response: any = await transferCrypto(
        network,
        mirrorNodeUrl,
        transferCryptoParams,
        externalAccountParams,
      );

      const { currentAccount, receipt } = response;
      setAccountInfo(currentAccount);
      console.log('Receipt: ', JSON.stringify(receipt, null, 4));
      showModal({
        title: 'Your transaction receipt',
        content: JSON.stringify(receipt),
      });
    } catch (error: any) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'sendHbar',
        description:
          'Send HBAR to another account(can pass in Account Id or EVM address but not both)',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter an account Id or an EVM address to send Hbar to
              <input
                type="text"
                style={{ width: '100%' }}
                value={sendToAddress}
                placeholder="Account Id or EVM address"
                onChange={(e) => setSendToAddress(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter memo to include(needed for exchange addresses)
              <input
                type="text"
                style={{ width: '100%' }}
                value={memo}
                placeholder="Memo"
                onChange={(e) => setMemo(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter an amount of HBARs to send(in HBARs)
              <input
                type="number"
                style={{ width: '100%' }}
                value={sendAmount}
                placeholder="0.01"
                onChange={(e) => setSendAmount(parseFloat(e.target.value))}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Send HBAR"
            onClick={handleTransferCryptoClick}
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

export { TransferCrypto };
