export default {
  env: {
    WALLET_DOMAIN: 'lawallet.ar',
    LAWALLET_ENDPOINT: 'https://api.lawallet.ar',
    IDENTITY_ENDPOINT: 'https://lawallet.ar'
  },
  MAX_INVOICE_AMOUNT: 10 ** 7,
  relaysList: ['wss://relay.damus.io', 'wss://relay.lawallet.ar'],
  pubKeys: {
    cardPubkey:
      '18f6a706091b421bd9db1ec964b4f934007fb6997c60e3c500fdaebe5f9f7b18',
    ledgerPubkey:
      'bd9b0b60d5cd2a9df282fc504e88334995e6fac8b148fa89e0f8c09e2a570a84',
    urlxPubkey:
      'e17feb5f2cf83546bcf7fd9c8237b05275be958bd521543c2285ffc6c2d654b3'
  }
}
