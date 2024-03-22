import { NostrEvent } from '@nostr-dev-kit/ndk'

export interface Transaction {
  id: string
  status: TransactionStatus
  direction: TransactionDirection
  type: TransactionType
  tokens: TokensAmount
  memo: string | null
  errors: string[]
  events: NostrEvent[]
  createdAt: Date
}

export enum TransferTypes {
  LUD16 = 'LUD16',
  INVOICE = 'INVOICE',
  LNURL = 'LNURL'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR'
}

export enum TransactionDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}

export enum TransactionType {
  CARD = 'CARD',
  INTERNAL = 'INTERNAL',
  LN = 'LN'
}

export type TokensAmount = {
  [_tokenId: string]: number
}
