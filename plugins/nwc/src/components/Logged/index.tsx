import type { NostrWebLNProvider } from '@getalby/sdk/dist/webln';
import { useIdentity, useTransfer, useZap } from '@lawallet/react';
import { Button, CaretLeftIcon, CaretRightIcon, Flex, Icon, Text } from '@lawallet/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export interface LoggedProps {
  localBalance: number;
  nwc: NostrWebLNProvider;
}

const Logged = ({ nwc, localBalance }: LoggedProps) => {
  const [newLocalBalance, setNewLocalBalance] = React.useState(localBalance);
  const [remoteBalance, setRemoteBalance] = React.useState(0);
  const totalBalance = localBalance + remoteBalance;
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExecutingPayment, setIsExecutingPayment] = React.useState(false);
  const delta = newLocalBalance - localBalance;
  
  const identity = useIdentity()
  const router = useRouter();

  const { invoice, createZapInvoice } = useZap({ receiverPubkey: identity.hexpub });

  const { isSuccess, execOutboundTransfer } = useTransfer({
    // ...params,
    tokenName: 'BTC',
  });

  const getBalance = React.useCallback(async () => {
    console.info('Getting balance...');
    const res = await nwc.getBalance();
    console.info(JSON.stringify(res));

    setRemoteBalance(res.balance);
  }, [nwc]);

  const withdraw = async (amount: number) => {
    // generate invoice with nwc
    const { paymentRequest } = await nwc.makeInvoice({
      amount: amount,
      memo: 'LaWallet to NWC',
    });

    console.info('paymentRequest: ');
    console.dir(paymentRequest);

    setIsExecutingPayment(true);

    // pay invoice with lawallet
    execOutboundTransfer({ tags: [['bolt11', paymentRequest]], amount: amount });
  };

  const deposit = async (amount: number) => {
    // generate invoice with lawallet
    const invoice = await createZapInvoice(amount, 'NWC to LaWallet');
    console.dir(invoice);

    setIsExecutingPayment(true);

    // pay invoice with nwc
    await nwc.sendPaymentAsync(invoice!);
  };

  React.useEffect(() => {
    if (!nwc) {
      return;
    }
    getBalance();
  }, [nwc]);

  React.useEffect(() => {
    if (isSuccess || invoice.payed) {
      router.push('/dashboard');
    }
  }, [isSuccess, invoice.payed]);

  return (
    <>
      {isLoading ? (
        'Fetching remote balance...'
      ) : (
        <Flex direction="column" align="center" gap={8}>
          <Flex align="center" justify="center" gap={4}>
            <Flex direction="column" align="center" justify="center" gap={4}>
              <Text size="small" color="#FDC800">
                Local Balance:
              </Text>{' '}
              <Flex direction="row" align="center" justify="center">
                <Text size="small" color="white">
                  {localBalance}
                </Text>
                {delta !== 0 && (
                  <>
                    <Icon size="small">
                      <CaretRightIcon color="white" />
                    </Icon>

                    <Text size="small" color={delta < 0 ? '#E95053' : '#56B68C'}>
                      {' '}
                      {newLocalBalance}
                    </Text>
                  </>
                )}
              </Flex>
            </Flex>
            <Flex direction="column" align="center" justify="center" gap={4}>
              <Text size="small" color="#56B68C">
                Remote Balance:
              </Text>{' '}
              <Flex direction="row" align="center" justify="center">
                {delta !== 0 && (
                  <>
                    <Text size="small" color={delta > 0 ? '#E95053' : '#56B68C'}>
                      {' '}
                      {totalBalance - newLocalBalance}
                    </Text>

                    <Icon size="small">
                      <CaretLeftIcon color="white" />
                    </Icon>
                  </>
                )}
                <Text size="small" color="white">
                  {remoteBalance}
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Flex>
            <input
              onInput={(e) => setNewLocalBalance(parseInt(e.currentTarget.value))}
              type="range"
              disabled={isExecutingPayment}
              min="0"
              max={totalBalance}
              value={newLocalBalance}
              style={{
                width: '100%',
              }}
            />
          </Flex>
          <Flex direction="column" align="center" justify="center" gap={4}>
            <Text size="small">Total Balance:</Text>{' '}
            <Text size="small" color="white">
              {totalBalance}
            </Text>
          </Flex>

          {delta !== 0 && (
            <>
              {delta > 0 ? (
                <>
                  <Flex>
                    <Button loading={isExecutingPayment} color="secondary" onClick={() => deposit(Math.abs(delta))}>
                      Transfer to LaWallet
                    </Button>
                  </Flex>
                  <Flex align="center" justify="center">
                    <Text size="small">Transfer ({Math.abs(delta)} sats) from your node to LaWallet</Text>
                  </Flex>
                </>
              ) : (
                <>
                  <Flex>
                    <Button loading={isExecutingPayment} color="primary" onClick={() => withdraw(Math.abs(delta))}>
                      Transfer to node
                    </Button>
                  </Flex>
                  <Flex align="center" justify="center">
                    <Text size="small">
                      Transfer <b>{Math.abs(delta)} sats</b> from LaWallet to your node.
                    </Text>
                  </Flex>
                </>
              )}
            </>
          )}
        </Flex>
      )}
    </>
  );
};

export default Logged;