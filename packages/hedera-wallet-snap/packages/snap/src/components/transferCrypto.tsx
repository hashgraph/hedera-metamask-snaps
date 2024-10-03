/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import type { AccountBalance, SimpleTransfer } from '../types/hedera';
import { CryptoUtils } from '../utils/CryptoUtils';
import {
  Bold,
  Box,
  CommonUI,
  Copyable,
  Divider,
  Heading,
  Row,
  Text,
  type CommonProps,
} from './common';

type Props = CommonProps & {
  memo: string;
  maxFee: number | null;
  transfers: SimpleTransfer[];
  walletBalance: AccountBalance;
  serviceFeesToPay: Record<string, number>;
  mirrorNodeUrl: string; // Added for fetching token info
};

const MetamaskUI: SnapComponent<Props> = ({
  origin,
  network,
  mirrorNodeUrl,
  memo,
  maxFee,
  transfers,
  walletBalance,
  serviceFeesToPay,
}) => {
  return (
    <Box>
      <CommonUI
        origin={origin}
        network={network}
        mirrorNodeUrl={mirrorNodeUrl}
      />
      <Heading>Transfer Crypto</Heading>
      <Text>
        Are you sure you want to execute the following transaction(s)?
      </Text>
      <Divider />
      {memo && (
        <Box>
          <Text>Memo</Text>
          <Copyable value={memo} />
        </Box>
      )}
      {maxFee && (
        <Row label="Max Transaction Fee">
          <Text>{maxFee} Hbar</Text>
        </Row>
      )}
      <Divider />
      <Heading>Transfers:</Heading>
      {transfers.map((transfer, index) => {
        const txNumber = index + 1;
        const asset = transfer.assetType === 'HBAR' ? 'HBAR' : '';
        const feeToDisplay = 0;

        return (
          <Box key={txNumber}>
            <Text>
              <Bold>Transaction #{txNumber}</Bold>
            </Text>
            <Divider />
            {transfer.from && (
              <Box>
                <Text>Transaction Type: Delegated Transfer</Text>
                <Text>Owner Account Id:</Text>
                <Copyable value={transfer.from} />
              </Box>
            )}
            <Text>Asset Type: {transfer.assetType}</Text>
            {transfer.assetType === 'HBAR' ? (
              <Box>
                {walletBalance.hbars <
                  transfer.amount + (serviceFeesToPay.HBAR || 0) && (
                  <Box>
                    <Text>
                      There is not enough Hbar in the wallet to transfer the
                      requested amount
                    </Text>
                    <Text>
                      Proceed only if you are sure about the amount being
                      transferred
                    </Text>
                  </Box>
                )}
                <Text>Asset: HBAR</Text>
              </Box>
            ) : (
              <Box>
                {/* Fetch token info if it's not HBAR */}
                {async () => {
                  transfer.decimals = walletBalance.tokens[
                    transfer.assetId as string
                  ]
                    ? walletBalance.tokens[transfer.assetId as string].decimals
                    : NaN;

                  const tokenInfo = await CryptoUtils.getTokenById(
                    transfer.assetId as string,
                    mirrorNodeUrl,
                  );

                  if (tokenInfo) {
                    return (
                      <Box>
                        <Text>Asset Name: {tokenInfo.name}</Text>
                        <Text>Asset Type: {tokenInfo.type}</Text>
                        <Text>Symbol: {tokenInfo.symbol}</Text>
                        {serviceFeesToPay[transfer.assetType] > 0 ? (
                          <Text>
                            Fee: {serviceFeesToPay[transfer.assetType]}
                          </Text>
                        ) : (
                          <Text>
                            Fee: {serviceFeesToPay[transfer.assetId as string]}
                          </Text>
                        )}
                        {(transfer.decimals = Number(tokenInfo.decimals))}
                      </Box>
                    );
                  }
                  return (
                    <Box>
                      <Text>
                        Error while trying to get token info for{' '}
                        {transfer.assetId} from Hedera Mirror Nodes at this time
                      </Text>
                      <Text>
                        Proceed only if you are sure about the asset ID being
                        transferred
                      </Text>
                    </Box>
                  );
                }}
                {transfer.assetType === 'NFT' && (
                  <Text>
                    NFT Serial Number: {transfer.assetId?.split('/')[1]}
                  </Text>
                )}
              </Box>
            )}
            <Text>To:</Text>
            <Copyable value={transfer.to} />
            <Text>
              Amount: {transfer.amount} {asset}
            </Text>
            {feeToDisplay > 0 && (
              <>
                <Text>Service Fee: {feeToDisplay}</Text>
                <Text>Total: {transfer.amount + feeToDisplay}</Text>
              </>
            )}
            <Divider />
          </Box>
        );
      })}
    </Box>
  );
};

export const TransferCryptoUI = MetamaskUI as any;
