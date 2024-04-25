'use client';
import React from 'react';
import { Button } from '../Button';
import { Flex } from '../Flex';
import { Container } from '../Layout/Container';
import { TokenListStyle } from './style';
// import { CurrenciesList } from '@lawallet/react';

export function TokensList({
  currenciesList,
  selectedCurrency,
  onClick,
}: {
  currenciesList: string[];
  selectedCurrency: string;
  onClick: (currency: string) => void;
}) {
  return (
    <TokenListStyle>
      <Container>
        <Flex gap={4} justify="center">
          {currenciesList.map((currency) => {
            const selected: boolean = selectedCurrency === currency;

            return (
              <Button
                key={currency}
                variant={selected ? 'bezeled' : 'borderless'}
                size="small"
                onClick={() => onClick(currency)}
              >
                {currency}
              </Button>
            );
          })}
          {/* () => settings.changeCurrency(currency) */}
        </Flex>
      </Container>
    </TokenListStyle>
  );
}
