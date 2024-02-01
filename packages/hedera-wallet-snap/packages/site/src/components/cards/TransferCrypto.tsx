import _ from 'lodash';
import { FC, useContext, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
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
  const [assetType, setAssetType] = useState<'HBAR' | 'TOKEN' | 'NFT'>('HBAR');
  const [assetId, setAssetId] = useState('');
  const [sendAmount, setSendAmount] = useState(0);
  const [isDelegatedTransfer, setIsDelegatedTransfer] = useState(false); // New state for Delegated Transfer checkbox
  const [sendFromAddress, setSendFromAddress] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleTransferCryptoClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const transfers: SimpleTransfer[] = [
        {
          assetType,
          to: sendToAddress,
          amount: sendAmount,
        } as SimpleTransfer,
      ];
      if (assetType === 'TOKEN' || assetType === 'NFT') {
        transfers[0].assetId = assetId;
      }
      if (isDelegatedTransfer && !_.isEmpty(sendFromAddress)) {
        transfers[0].from = sendFromAddress;
      }
      // const maxFee = 1; // Note that if you don't pass this, default is whatever the snap has set

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
        title: 'transferCrypto',
        description:
          'Send HBAR to another account(can pass in Account Id or EVM address but not both)',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <Form>
              <Form.Check
                type="checkbox"
                id="delegated-transfer-checkbox"
                label="Delegated Transfer"
                onChange={(e) => {
                  setIsDelegatedTransfer(e.target.checked);
                }}
              />
              {isDelegatedTransfer && (
                <>
                  <Form.Label>
                    Enter an account Id to send Hbar from (Only needed for
                    delegated transfer)
                  </Form.Label>
                  <Form.Control
                    size="lg"
                    type="text"
                    placeholder="Owner Account Id to send from"
                    style={{ marginBottom: 8 }}
                    onChange={(e) => setSendFromAddress(e.target.value)}
                  />
                </>
              )}
            </Form>
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
              Asset Type
              <select
                style={{ width: '100%' }}
                value={assetType}
                onChange={(e) =>
                  setAssetType(e.target.value as 'HBAR' | 'TOKEN' | 'NFT')
                }
              >
                <option value="HBAR">HBAR</option>
                <option value="TOKEN">TOKEN</option>
                <option value="NFT">NFT</option>
              </select>
            </label>

            {(assetType === 'TOKEN' || assetType === 'NFT') && (
              <label>
                Enter Asset Id (eg. Token Id, NFT Id)
                <input
                  type="text"
                  style={{ width: '100%' }}
                  value={assetId}
                  placeholder="Enter Asset Id"
                  onChange={(e) => setAssetId(e.target.value)}
                />
              </label>
            )}
            <br />
            <label>
              Enter an amount to send
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
            buttonText="Transfer"
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
