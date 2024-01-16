import { type UserConfigProps, type AvailableCurrencies } from '@lawallet/utils/types';
import { parseContent, defaultUserConfig } from '@lawallet/utils';
import * as React from 'react';
import { useConfig } from './useConfig.js';

export type UseSettingsReturns = {
  props: UserConfigProps;
  loading: boolean;
  toggleHideBalance: () => void;
  changeCurrency: (currency: AvailableCurrencies) => void;
};

export const useSettings = (): UseSettingsReturns => {
  const config = useConfig();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [props, setProps] = React.useState<UserConfigProps>(defaultUserConfig);

  const saveConfiguration = (newConfig: UserConfigProps) => {
    setProps(newConfig);
    config.storage.setItem('config', JSON.stringify(newConfig));
  };

  const toggleHideBalance = () =>
    saveConfiguration({
      ...props,
      hideBalance: !props.hideBalance,
    });

  const changeCurrency = (currency: AvailableCurrencies) =>
    saveConfiguration({
      ...props,
      currency,
    });
  const preloadConfig = () => {
    const storagedConfig: string = config.storage.getItem('config') as string;
    if (!storagedConfig) {
      setLoading(false);
      return;
    }

    const parsedConfig: UserConfigProps = parseContent(storagedConfig);
    setProps(parsedConfig);
    setLoading(false);
  };

  React.useEffect(() => {
    preloadConfig();
  }, []);

  return { props, loading, toggleHideBalance, changeCurrency };
};
