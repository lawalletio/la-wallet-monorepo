import { type NostrEvent } from '@nostr-dev-kit/ndk';
import { LightningAddress } from '@getalby/lightning-tools';

// type StrObjectType = Record<string, string>

export interface Transaction {
  id: string;
  status: TransactionStatus;
  direction: TransactionDirection;
  type: TransactionType;
  tokens: TokensAmount;
  memo: string;
  errors: string[];
  events: NostrEvent[];
  createdAt: number;
  metadata?: string[];
}

export enum TransferTypes {
  INTERNAL = 'INTERNAL',
  LUD16 = 'LUD16',
  INVOICE = 'INVOICE',
  LNURL = 'LNURL',
  LNURLW = 'LNURLW',
  NONE = 'NONE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
}

export enum TransactionDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}

export enum TransactionType {
  CARD = 'CARD',
  INTERNAL = 'INTERNAL',
  LN = 'LN',
}

export type TokensAmount = {
  [_tokenId: string]: number;
};

export interface LNRequestResponse {
  tag: string;
  callback: string;
  metadata: string;
  commentAllowed: number;
  minSendable?: number;
  maxSendable?: number;
  k1?: string;
  minWithdrawable?: number;
  maxWithdrawable?: number;
  federationId?: string;
  accountPubKey?: string;
}

export interface TransferInformation {
  data: string;
  amount: number;
  type: TransferTypes;
}

export interface LNURLTransferType extends TransferInformation {
  comment: string;
  receiverPubkey: string;
  request: LNRequestResponse | null;
  lnService: LightningAddress | null;
}

export interface InvoiceTransferType extends TransferInformation {
  expired: boolean;
}
