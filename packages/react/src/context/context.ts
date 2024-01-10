import * as React from 'react'
import { type ConfigParameter } from "../types/config.js"
import { NDKProvider } from "./NDKContext.js"
import { WalletProvider } from "./WalletContext.js"

export const WalletConfig = (props: React.PropsWithChildren<ConfigParameter>) => {
    const { children } = props
    return React.createElement(NDKProvider, props, React.createElement(WalletProvider, props, children))
}