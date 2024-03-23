'use client';

// React
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Types
import type { Dispatch, SetStateAction } from 'react';
import type { Event, UnsignedEvent } from 'nostr-tools';
import { useLN } from './LN';
import type { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { ProductQtyData } from '../types/product';
import { IPayment, IPaymentCache } from '../types/order';

// Contexts and Hooks
import { useNostr } from './Nostr';
import { useLocalStorage } from 'react-use-storage';

// Utils
import { getEventHash, getSignature, validateEvent } from 'nostr-tools';
import { decodeInvoice, useConfig, useNostrContext, useWalletContext, useZap } from '@lawallet/react';

// Interface
export interface IOrderContext {
  orderId?: string;
  amount: number;
  fiatAmount: number;
  fiatCurrency?: string;
  currentInvoice?: string;
  memo: unknown;
  products: ProductQtyData[];
  isPaid?: boolean;
  isPrinted?: boolean;
  orderEvent: Event | undefined;
  paymentsCache?: IPaymentCache;
  emergency: boolean;
  handleEmergency: () => void;
  loadOrder: (orderId: string) => boolean;
  setIsPrinted?: Dispatch<SetStateAction<boolean>>;
  setIsPaid?: Dispatch<SetStateAction<boolean>>;
  setProducts: Dispatch<SetStateAction<ProductQtyData[]>>;
  clear: () => void;
  setMemo: Dispatch<SetStateAction<unknown>>;
  setAmount: Dispatch<SetStateAction<number>>;
  checkOut: () => Promise<{ eventId: string }>;
  setOrderEvent?: Dispatch<SetStateAction<Event | undefined>>;
  generateOrderEvent?: () => Event;
  setFiatAmount: Dispatch<SetStateAction<number>>;
}

const parseZapInvoice = (event: Event) => {
  const paidInvoice = event.tags.find((tag) => tag[0] === 'bolt11')?.[1];
  return decodeInvoice(paidInvoice!);
};

// Context
export const OrderContext = createContext<IOrderContext>({
  amount: 0,
  fiatAmount: 0,
  fiatCurrency: 'ARS',
  memo: undefined,
  products: [],
  checkOut: function (): Promise<{ eventId: string }> {
    throw new Error('Function not implemented.');
  },
  setAmount: function (): void {
    throw new Error('Function not implemented.');
  },
  setFiatAmount: function (): void {
    throw new Error('Function not implemented.');
  },
  setMemo: function (_value: unknown): void {
    throw new Error('Function not implemented.');
  },
  clear: function (): void {
    throw new Error('Function not implemented.');
  },
  setProducts: function (value: SetStateAction<ProductQtyData[]>): void {
    throw new Error('Function not implemented.');
  },
  loadOrder: function (orderId: string): boolean {
    throw new Error('Function not implemented.');
  },
  orderEvent: undefined,
  paymentsCache: undefined,
  emergency: false,
  handleEmergency: function (): void {
    throw new Error('Function not implemented.');
  },
});

// Component Props
interface IOrderProviderProps {
  children: React.ReactNode;
}

export const OrderProvider = ({ children }: IOrderProviderProps) => {
  // Hooks
  const {
    account: { identity },
  } = useWalletContext();

  const { subscribeZap, relays, generateZapEvent, publish } = useNostr();
  const { lud06, zapEmitterPubKey, requestInvoice, setLUD06 } = useLN();

  // Local states
  const [orderId, setOrderId] = useState<string>();
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isPrinted, setIsPrinted] = useState<boolean>(false);
  const [orderEvent, setOrderEvent] = useState<Event>();
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState<unknown>({});
  const [currentInvoice, setCurrentInvoice] = useState<string>();
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [fiatCurrency, setFiatCurrency] = useState<string>('ARS');
  const [products, setProducts] = useState<ProductQtyData[]>([]);
  const [emergency, setEmergency] = useState<boolean>(false);
  const [paymentsCache, setPaymentsCache] = useLocalStorage<IPaymentCache>('paymentsCache', {});

  const generateOrderEvent = useCallback((): Event => {
    const unsignedEvent: UnsignedEvent = {
      kind: 1,
      content: '',
      pubkey: identity.data.hexpub,
      created_at: Math.round(Date.now() / 1000),
      tags: [
        ['relays', ...relays!],
        ['p', identity.data.hexpub],
        ['t', 'order'],
        [
          'description',
          JSON.stringify({
            memo,
            amount,
          }),
        ],
        ['products', JSON.stringify(products)],
      ] as string[][],
    };

    const event: Event = {
      id: getEventHash(unsignedEvent),
      sig: getSignature(unsignedEvent, identity.data.privateKey),
      ...unsignedEvent,
    };

    // Saving current payments status
    const payment: IPayment = {
      amount,
      event: event!,
      id: event!.id,
      isPaid,
      lud06: lud06!,
      isPrinted: isPrinted,
      items: products,
    };

    paymentsCache[payment.id] = payment;
    setPaymentsCache(paymentsCache);

    return event;
  }, [relays, memo, amount, products, isPaid, lud06, isPrinted, paymentsCache, setPaymentsCache]);

  // Load order from cache
  const loadOrder = useCallback(
    (orderId: string): boolean => {
      console.info('Loading order from cache');
      const order = paymentsCache[orderId];
      if (!order) {
        return false;
      }
      setAmount(order.amount);
      setIsPaid(order.isPaid);
      setIsPrinted(order.isPrinted);
      setProducts(order.items);
      setOrderEvent(order.event);
      setLUD06(order.lud06);
      setOrderId(order.id);

      console.dir(order);
      return true;
    },
    [paymentsCache, setLUD06],
  );

  // Checkout function
  const checkOut = useCallback(async (): Promise<{
    eventId: string;
  }> => {
    // Order Nostr event
    const order = generateOrderEvent();
    await publish!(order);

    return { eventId: order.id };
  }, [generateOrderEvent, publish]);

  const requestZapInvoice = useCallback(
    async (amountMillisats: number, orderEventId: string): Promise<string> => {
      const zapEvent: NostrEvent = await generateZapEvent!(amountMillisats, orderEventId);

      console.info('zapEvent');
      console.dir(zapEvent);

      // Request new invoice
      const invoice = await requestInvoice!({
        amountMillisats,
        zapEvent: zapEvent as Event,
      });

      return invoice;
    },
    [generateZapEvent, requestInvoice],
  );

  const handlePaymentReceived = useCallback(
    async (event: NDKEvent) => {
      const invoice = parseZapInvoice(event as Event);
      if (!invoice) return;

      if (!invoice.complete) {
        console.info('Incomplete invoice');
        return;
      }
      const amountPaid = parseInt(invoice.millisatoshis!) / 1000;
      if (amountPaid >= amount) {
        setIsPaid(true);
      }
      const _event = await event.toNostrEvent();
    },
    [amount],
  );

  const handleEmergency = () => {
    setIsPaid(true);
  };

  // Handle new incoming zap
  const onZap = useCallback(
    (event: NDKEvent) => {
      if (event.pubkey !== zapEmitterPubKey) {
        throw new Error('Invalid Recipient Pubkey');
      }

      if (!validateEvent(event)) {
        throw new Error('Invalid event');
      }

      const paidInvoice = event.tags.find((tag) => tag[0] === 'bolt11')?.[1];
      const decodedPaidInvoice = decodeInvoice(paidInvoice!);
      if (!decodedPaidInvoice) return;

      handlePaymentReceived(event);
      console.info('Amount paid : ' + decodedPaidInvoice.millisatoshis);
    },
    [handlePaymentReceived, zapEmitterPubKey],
  );

  const clear = useCallback(() => {
    setOrderId(undefined);
    setOrderEvent(undefined);
    setAmount(0);
    setFiatAmount(0);
    setIsPaid(false);
    setCurrentInvoice(undefined);
    setIsPrinted(false);
    setProducts([]);
    setMemo({});
    setEmergency(false);
  }, []);

  /** useEffects */

  // on order id change
  useEffect(() => {
    if (!orderId) {
      return;
    }
    const order = paymentsCache[orderId];
    // Prevent order from updating to false
    paymentsCache[orderId] = {
      ...order,
      isPaid: order.isPaid || isPaid,
      isPrinted: order.isPrinted || isPrinted,
    };
    setPaymentsCache(paymentsCache);
  }, [orderId, isPaid, isPrinted, paymentsCache]);

  useEffect(() => {
    if (!orderId || !zapEmitterPubKey || isPaid) {
      return;
    }

    console.info(`Subscribing for ${orderId}...`);

    const subZap = subscribeZap!(orderId);

    subZap.addListener('event', onZap);

    return () => {
      subZap.removeAllListeners();
      subZap.stop();
    };
  }, [orderId, zapEmitterPubKey, zapEmitterPubKey, isPaid]);

  // On orderId change
  useEffect(() => {
    if (!orderId || !zapEmitterPubKey) {
      return;
    }

    requestZapInvoice(amount * 1000, orderId)
      .then((_invoice) => {
        setCurrentInvoice!(_invoice);
      })
      .catch((e) => {
        console.log(e);
        setEmergency(true);
        alert("Couldn't generate invoice.");
      });
  }, [amount, orderId, zapEmitterPubKey]);

  return (
    <OrderContext.Provider
      value={{
        orderId,
        amount,
        fiatAmount,
        fiatCurrency,
        currentInvoice,
        memo,
        products,
        isPaid,
        isPrinted,
        orderEvent,
        paymentsCache,
        emergency,
        handleEmergency,
        loadOrder,
        setIsPrinted,
        setIsPaid,
        setProducts,
        clear,
        setMemo,
        checkOut,
        setAmount,
        setFiatAmount,
        generateOrderEvent,
        setOrderEvent,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Export hook
export const useOrder = () => {
  return useContext(OrderContext);
};
