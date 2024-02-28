import { Wallet } from '../domain/wallet/abstract';
import { SimpleHederaClient } from '../types/hedera';
export interface HederaClientFactory {
// returns null if the account ID does not match the chosen key
    createClient(options: {
        wallet: Wallet;
        // index into the wallet, meaning depends on the wallet type
        // 0 always means the canonical key for the wallet
        keyIndex: number;
        // account ID we wish to associate with the wallet
        accountId: string;
        network: string;
    }): Promise<SimpleHederaClient | null>;
}
