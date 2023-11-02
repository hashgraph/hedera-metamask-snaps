import React from 'react';
import { Table } from 'react-bootstrap';
import { TokenBalance } from '../../types/snap';

type TokenBalanceTableProps = {
  tokens: Record<string, TokenBalance>;
};

const Tokens: React.FC<TokenBalanceTableProps> = ({ tokens }) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Symbol</th>
          <th>Token ID</th>
          <th>Balance</th>
          <th>Token Type</th>
          <th>Supply Type</th>
          <th>Total Supply</th>
          <th>Max Supply</th>
        </tr>
      </thead>
      <tbody>
        {Object.values(tokens).map((token) => (
          <tr key={token.tokenId}>
            <td>{token.name}</td>
            <td>{token.symbol}</td>
            <td>{token.tokenId}</td>
            <td>{token.balance}</td>
            <td>{token.tokenType}</td>
            <td>{token.supplyType}</td>
            <td>{token.totalSupply}</td>
            <td>{token.maxSupply}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default Tokens;
