export type ConfigProps = {
  FEDERATION_DOMAIN: string
  API_GATEWAY_ENDPOINT: string
  IDENTITY_ENDPOINT: string
  relaysList: string[]
  modulePubKeys: {
    card: string
    ledger: string
    urlx: string
  }
}
