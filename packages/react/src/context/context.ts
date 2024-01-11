import * as React from "react";
import { baseConfig } from "@lawallet/utils";
import { type ConfigParameter } from "../types/config.js";
import { NDKProvider } from "./NDKContext.js";
import { AccountProvider } from "./AccountContext.js";

export const ConfigContext = React.createContext({} as ConfigParameter);

export const LaWalletConfig = (
  props: React.PropsWithChildren<ConfigParameter>,
) => {
  const { children, config = baseConfig } = props;
  const configProps = { value: { config } };

  return React.createElement(
    NDKProvider,
    props,
    React.createElement(ConfigContext.Provider, configProps, children),
  );
};

export const LaWalletProvider = (
  props: React.PropsWithChildren<ConfigParameter>,
) => {
  const { children, config = baseConfig } = props;
  const configProps = { value: { config } };

  return React.createElement(
    NDKProvider,
    props,
    React.createElement(
      ConfigContext.Provider,
      configProps,
      React.createElement(AccountProvider, props, children),
    ),
  );
};
