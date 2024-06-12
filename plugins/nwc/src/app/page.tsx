'use client';
import { webln } from '@getalby/sdk';
import { useBalance } from '@lawallet/react';
import { Container, Flex } from '@lawallet/ui';

import type { NostrWebLNProvider } from '@getalby/sdk/dist/webln';
import { useCallback, useEffect, useState } from 'react';
import Logged from '../components/Logged';
import NotLogged from '../components/NotLogged';

{
  /* <Text>Tu balance es de {formatToPreference('SAT', balance.amount, 'es')} satoshis</Text> */
}

const AppIndex = () => {
  const [nwc, setNwc] = useState<NostrWebLNProvider>();
  // const [localBalance, setLocalBalance] = useState<number>(20);

  const balance = useBalance()
  const localBalance = balance.amount;

  console.dir('localBalance:', localBalance);

  const getData = useCallback(async () => {
    console.log('Getting data...');
    console.dir(JSON.stringify(await nwc!.getInfo()));
  }, [nwc]);

  const getInvoice = useCallback(
    async (satoshi: number) => {
      console.log('Getting Invoice...');
      console.log(
        JSON.stringify(
          await nwc!.makeInvoice({
            amount: satoshi * 1000,
            defaultMemo: 'message',
          }),
        ),
      );
    },
    [nwc],
  );

  const login = useCallback(async (nwcUrl: string) => {
    // Do you magic

    const nwc = new webln.NostrWebLNProvider({
      nostrWalletConnectUrl: nwcUrl,
    });

    try {
      console.info('Logging in...');
      await nwc.enable();
      setNwc(nwc);
    } catch (e) {
      console.error('Error loggin...');
    }
  }, []);

  useEffect(() => {
    if (!nwc) {
      return;
    }
    (async () => {
      await getData();
      await getInvoice(100);
    })();
  }, [nwc]);

  return (
    <Container size="small">
      <Flex flex={1} direction="column" align="center" justify="center">
        <h1>LaWallet NWC</h1>

        {nwc ? <Logged nwc={nwc} localBalance={localBalance} /> : <NotLogged login={login} />}
      </Flex>
    </Container>
  );
};

export default AppIndex;