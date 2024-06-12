'use client';
import React from 'react';
import { Button } from '../Button/index.js';
import { Flex } from '../Flex/index.js';
import { Container } from '../Layout/Container/index.js';
import { TokenListStyle } from './style.js';

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
        </Flex>
      </Container>
    </TokenListStyle>
  );
}
