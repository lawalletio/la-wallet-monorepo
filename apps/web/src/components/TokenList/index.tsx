'use client';

import { Button, Container, Flex } from '@lawallet/ui';

import { TokenListStyle } from './style';
import { useLaWallet, CurrenciesList } from '@lawallet/react';

export function TokenList() {
  const { settings } = useLaWallet();

  return (
    <TokenListStyle>
      <Container>
        <Flex gap={4} justify="center">
          {CurrenciesList.map((currency) => {
            const selected: boolean = settings.props.currency === currency;

            return (
              <Button
                key={currency}
                variant={selected ? 'bezeled' : 'borderless'}
                size="small"
                onClick={() => settings.changeCurrency(currency)}
              >
                {currency}
              </Button>
            );
          })}
        </Flex>
      </Container>
    </TokenListStyle>
  );
}
