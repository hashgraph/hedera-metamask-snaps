import { forwardRef, Ref, useImperativeHandle, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { ExternalAccountParams } from '../../types';

export type GetExternalAccountRef = {
  handleGetAccountParams: () => ExternalAccountParams | undefined;
};

const ExternalAccount = forwardRef(({}, ref: Ref<GetExternalAccountRef>) => {
  const [externalAccount, setExternalAccount] = useState(false);
  const [accountIdOrEvmAddress, setAccountIdOrEvmAddress] = useState('');
  const [curve, setCurve] = useState('');

  useImperativeHandle(ref, () => ({
    handleGetAccountParams() {
      let params = {} as ExternalAccountParams;
      if (externalAccount) {
        params = {
          externalAccount: {
            accountIdOrEvmAddress,
          },
        };
        if (curve) {
          params.externalAccount.curve = curve as 'ECDSA_SECP256K1' | 'ED25519';
        }
      }
      return params;
    },
  }));

  return (
    <div>
      <Form>
        <Form.Check
          type="checkbox"
          id="external-account-checkbox"
          label="External Account"
          onChange={(e) => {
            setExternalAccount(e.target.checked);
          }}
        />
        {externalAccount && (
          <>
            <Form.Label>
              Enter your Account Id or EVM address to connect to
            </Form.Label>
            <Form.Control
              size="lg"
              type="text"
              placeholder="Account Id or EVM address"
              style={{ marginBottom: 8 }}
              onChange={(e) => setAccountIdOrEvmAddress(e.target.value)}
            />
            <Form.Label>
              Enter the type of Elliptic Curve to use(default value:
              'ECDSA_SECP256K1').
            </Form.Label>
            <Form.Control
              size="lg"
              type="text"
              placeholder="ECDSA_SECP256K1 or ED25519(Can be empty)"
              style={{ marginBottom: 8 }}
              onChange={(e) => setCurve(e.target.value)}
            />
          </>
        )}
      </Form>
    </div>
  );
});

export default ExternalAccount;
