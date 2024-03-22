import type { Event } from 'nostr-tools'

export interface InvoiceRequest {
  amountMillisats: number
  zapEvent?: Event
}
