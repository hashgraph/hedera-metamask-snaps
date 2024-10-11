import { HederaMirrorInfo } from '@tuum-tech/identify/src/hedera/service';
import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import {
  createNewHederaAccount,
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
};

const CreateNewHederaAccount: FC<Props> = ({
  setMetamaskAddress,
  setCurrentChainId,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [newAccountPublickey, setNewAccountPublickey] = useState(
    '302d300706052b8104000a032200034920445ae433dbfa7b11da73305566f143bfdff959779ac8a005b13a875460f2',
  );
  const [newAccountEvmAddress, setNewAccountEvmAddress] = useState(
    '0x9dA3b1ACFec871e668B51828faedB607e37609F9',
  );
  const [hbarAmountToSend, setHbarAmountToSend] = useState(0);
  const [loading, setLoading] = useState(false);

  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateNewHederaAccount = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      if (hbarAmountToSend > 0) {
        // If you want to create a hbar account for a public key, just uncomment the line 'newAccountPublickey'
        const newHederaAccountInfo = (await createNewHederaAccount(
          metamaskAddress,
          {
            hbarAmountToSend,
            newAccountEvmAddress,
            // newAccountPublickey,
          },
          externalAccountParams,
        )) as HederaMirrorInfo;
        console.log(
          `Your hedera account info: ${JSON.stringify(
            newHederaAccountInfo,
            null,
            4,
          )}`,
        );
        let title = 'Hedera Account Info';
        if (newHederaAccountInfo.newlyCreated) {
          title = `Newly created ${title}`;
        } else {
          console.log(
            "No hbars were sent to the new account because a hedera account already exists on the ledger. We're just returing the info by quering hedera mirror node",
          );
        }
        showModal({
          title,
          content: JSON.stringify(newHederaAccountInfo, null, 4),
        });
      } else {
        showModal({
          title: 'Error while creating a new hedera account',
          content: 'The amount of hbars must be greater than 0',
        });
      }
      setHbarAmountToSend(0);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'createNewHederaAccount',
        description:
          'Create a new hedera account by sending some HBARs to a hedera publickey address',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            {/* If you want to create a hbar account for a public key, just
            uncomment the below lines */}
            {/* <label>
              Enter the publickey address to create a hedera account for
              <input
                type="text"
                style={{ width: '100%' }}
                value={newAccountPublickey}
                onChange={(e) => setNewAccountPublickey(e.target.value)}
              />
            </label> */}
            <label>
              Enter the evm address to create a hedera account for
              <input
                type="text"
                style={{ width: '100%' }}
                value={newAccountEvmAddress}
                onChange={(e) => setNewAccountEvmAddress(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the amount of HBARs to send to fund this new hedera account
              <input
                type="number"
                style={{ width: '100%' }}
                value={hbarAmountToSend}
                onChange={(e) =>
                  setHbarAmountToSend(parseInt(e.target.value, 10))
                }
              />
            </label>
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Create new hedera account"
            onClick={handleCreateNewHederaAccount}
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

export { CreateNewHederaAccount };
