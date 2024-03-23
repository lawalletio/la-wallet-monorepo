import { useContext } from 'react';
import { InjectedNFCContext } from '../context/InjectedNFC';

interface PrintReturns {
  isAvailable: boolean;
  read: () => Promise<string>;
  abortReadCtrl: () => void;
}

export const useInjectedNFC = (): PrintReturns => {
  const { isAvailable, subscribe, unsubscribe } = useContext(InjectedNFCContext);

  return {
    isAvailable,
    read: subscribe,
    abortReadCtrl: unsubscribe,
  };
};
