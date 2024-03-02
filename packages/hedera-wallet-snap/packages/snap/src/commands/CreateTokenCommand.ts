import { TokenCustomFee } from '../types/params';
import {
  AccountId,
  Client,
  CustomFixedFee,
  Hbar,
  PrivateKey,
  PublicKey,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
} from '@hashgraph/sdk';
import { TxReceipt } from '../types/hedera';
import { Utils } from '../utils/Utils';
import { CryptoUtils } from '../utils/CryptoUtils';

/**
 * Create a token on Hedera.
 *
 * @param client - Hedera Client.
 * @param privateKey - Private key of the token creator.
 * @param options - Create Token options.
 * @param options.assetType - Token assetType.
 * @param options.name - Token name.
 * @param options.symbol - Token symbol.
 * @param options.decimals - Token decimals.
 * @param options.supplyType - Token supplyType.
 * @param options.initialSupply - Token initialSupply.
 * @param options.maxSupply - Token maxSupply.
 * @param options.expirationTime - Token expirationTime.
 * @param options.autoRenewAccountId - Token autoRenewAccountId.
 * @param options.tokenMemo - Token tokenMemo.
 * @param options.freezeDefault - Token freezeDefault.
 * @param options.kycPublicKey - Token kycPublicKey.
 * @param options.freezePublicKey - Token freezePublicKey.
 * @param options.pausePublicKey - Token pausePublicKey.
 * @param options.wipePublicKey - Token wipePublicKey.
 * @param options.supplyPublicKey - Token supplyPublicKey.
 * @param options.feeSchedulePublicKey - Token feeSchedulePublicKey.
 * @param options.customFees - Token customFees.
 */
export class CreateTokenCommand {
  readonly #assetType: 'TOKEN' | 'NFT';

  readonly #name: string;

  readonly #symbol: string;

  readonly #decimals: number;

  readonly #supplyType: 'FINITE' | 'INFINITE';

  readonly #initialSupply: number;

  readonly #maxSupply: number;

  readonly #expirationTime: string | undefined;

  readonly #autoRenewAccountId: string;

  readonly #tokenMemo: string;

  readonly #freezeDefault: boolean;

  readonly #kycPublicKey: string | undefined;

  readonly #freezePublicKey: string | undefined;

  readonly #pausePublicKey: string | undefined;

  readonly #wipePublicKey: string | undefined;

  readonly #supplyPublicKey: string | undefined;

  readonly #feeSchedulePublicKey: string | undefined;

  readonly #customFees: TokenCustomFee[] | undefined;

  constructor(
    assetType: 'TOKEN' | 'NFT',
    name: string,
    symbol: string,
    decimals: number,
    supplyType: 'FINITE' | 'INFINITE',
    initialSupply: number,
    maxSupply: number,
    expirationTime: string | undefined,
    autoRenewAccountId: string,
    tokenMemo: string,
    freezeDefault: boolean,
    kycPublicKey: string | undefined,
    freezePublicKey: string | undefined,
    pausePublicKey: string | undefined,
    wipePublicKey: string | undefined,
    supplyPublicKey: string | undefined,
    feeSchedulePublicKey: string | undefined,
    customFees: TokenCustomFee[] | undefined,
  ) {
    this.#assetType = assetType;
    this.#name = name;
    this.#symbol = symbol;
    this.#decimals = decimals;
    this.#supplyType = supplyType;
    this.#initialSupply = initialSupply;
    this.#maxSupply = maxSupply;
    this.#expirationTime = expirationTime;
    this.#autoRenewAccountId = autoRenewAccountId;
    this.#tokenMemo = tokenMemo;
    this.#freezeDefault = freezeDefault;
    this.#kycPublicKey = kycPublicKey;
    this.#freezePublicKey = freezePublicKey;
    this.#pausePublicKey = pausePublicKey;
    this.#wipePublicKey = wipePublicKey;
    this.#supplyPublicKey = supplyPublicKey;
    this.#feeSchedulePublicKey = feeSchedulePublicKey;
    this.#customFees = customFees;
  }

  public async execute(
    client: Client,
    privateKey: PrivateKey,
  ): Promise<TxReceipt> {
    const transaction = new TokenCreateTransaction()
      .setAdminKey(client.operatorPublicKey as PublicKey)
      .setTreasuryAccountId(client.operatorAccountId as AccountId)
      .setTokenType(
        this.#assetType === 'TOKEN'
          ? TokenType.FungibleCommon
          : TokenType.NonFungibleUnique,
      )
      .setTokenName(this.#name)
      .setTokenSymbol(this.#symbol)
      .setDecimals(this.#decimals)
      .setSupplyType(
        this.#supplyType === 'FINITE'
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      )
      .setInitialSupply(this.#initialSupply * Math.pow(10, this.#decimals))
      .setMaxSupply(this.#maxSupply * Math.pow(10, this.#decimals))
      .setAutoRenewAccountId(this.#autoRenewAccountId)
      .setTokenMemo(this.#tokenMemo)
      .setFreezeDefault(this.#freezeDefault);

    if (this.#expirationTime) {
      transaction.setExpirationTime(new Date(this.#expirationTime));
    }
    if (this.#kycPublicKey) {
      transaction.setKycKey(PublicKey.fromString(this.#kycPublicKey));
    }
    if (this.#freezePublicKey) {
      transaction.setFreezeKey(PublicKey.fromString(this.#freezePublicKey));
    }
    if (this.#pausePublicKey) {
      transaction.setPauseKey(PublicKey.fromString(this.#pausePublicKey));
    }
    if (this.#wipePublicKey) {
      transaction.setWipeKey(PublicKey.fromString(this.#wipePublicKey));
    }
    if (this.#supplyPublicKey) {
      transaction.setSupplyKey(PublicKey.fromString(this.#supplyPublicKey));
    }
    if (this.#feeSchedulePublicKey) {
      transaction.setFeeScheduleKey(
        PublicKey.fromString(this.#feeSchedulePublicKey),
      );
    }

    if (this.#customFees) {
      // Convert TokenCustomFee[] to CustomFixedFee[]
      const customFees: CustomFixedFee[] = this.#customFees.map(
        (tokenCustomFee: TokenCustomFee) => {
          const customFee = new CustomFixedFee({
            feeCollectorAccountId: tokenCustomFee.feeCollectorAccountId,
          });
          if (tokenCustomFee.hbarAmount) {
            customFee.setHbarAmount(new Hbar(tokenCustomFee.hbarAmount));
          }
          if (tokenCustomFee.tokenAmount) {
            customFee.setAmount(
              tokenCustomFee.tokenAmount * Math.pow(10, this.#decimals),
            );
          }
          if (tokenCustomFee.denominatingTokenId) {
            customFee.setDenominatingTokenId(
              tokenCustomFee.denominatingTokenId,
            );
          }
          if (tokenCustomFee.allCollectorsAreExempt) {
            customFee.setAllCollectorsAreExempt(
              tokenCustomFee.allCollectorsAreExempt,
            );
          }
          return customFee;
        },
      );
      transaction.setCustomFees(customFees);
    }

    transaction.freezeWith(client);

    // Sign the transaction with the token adminKey and the token treasury account private key
    const signTx = await (await transaction.sign(privateKey)).sign(privateKey);

    // Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    const receipt = await txResponse.getReceipt(client);

    let newExchangeRate;
    if (receipt.exchangeRate) {
      newExchangeRate = {
        ...receipt.exchangeRate,
        expirationTime: Utils.timestampToString(
          receipt.exchangeRate.expirationTime,
        ),
      };
    }

    return {
      status: receipt.status.toString(),
      accountId: receipt.accountId ? receipt.accountId.toString() : '',
      fileId: receipt.fileId ? receipt.fileId.toString() : '',
      contractId: receipt.contractId ? receipt.contractId.toString() : '',
      topicId: receipt.topicId ? receipt.topicId.toString() : '',
      tokenId: receipt.tokenId ? receipt.tokenId.toString() : '',
      scheduleId: receipt.scheduleId ? receipt.scheduleId.toString() : '',
      exchangeRate: newExchangeRate,
      topicSequenceNumber: receipt.topicSequenceNumber
        ? String(receipt.topicSequenceNumber)
        : '',
      topicRunningHash: CryptoUtils.uint8ArrayToHex(receipt.topicRunningHash),
      totalSupply: receipt.totalSupply ? String(receipt.totalSupply) : '',
      scheduledTransactionId: receipt.scheduledTransactionId
        ? receipt.scheduledTransactionId.toString()
        : '',
      serials: JSON.parse(JSON.stringify(receipt.serials)),
      duplicates: JSON.parse(JSON.stringify(receipt.duplicates)),
      children: JSON.parse(JSON.stringify(receipt.children)),
    } as TxReceipt;
  }
}