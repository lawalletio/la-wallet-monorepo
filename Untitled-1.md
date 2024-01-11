<NDKProvider>
    - useNostr()
        - ndk
        - signer
        - signerPubkey
        - connectWithExtension
        - connectWithPrivateKey
es usado por useSubscription() y debe envolver el contexto en el que se deseen usar los hooks

<ConfigProvider> / ConfigContext
genera un entorno de configuración (useConfig()) en el que tenemos: - gateway endpoint - relaysList [] - federation: {
id, // "lawallet.ar",
domain, // "lawallet.ar",
identity endpoint // 'https://lawallet.ar'
} - modulePubkeys: {
card,
ledger,
urlx
}

<AccountProvider>
    - user
        - identity
        - transactions
        - balance
    - settings
    - converter

<!-- <LaWalletConfig> -->
<!-- <LaWalletProvider> -->
