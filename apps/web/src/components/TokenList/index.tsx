'use client'

import Container from '@/components/Layout/Container'
import { Button, Flex } from '@/components/UI'

import { TokenList } from './style'
import { useWalletContext, CurrenciesList } from '@lawallet/react'

export default function Component() {
  const { settings } = useWalletContext()

  return (
    <TokenList>
      <Container>
        <Flex gap={4} justify="center">
          {CurrenciesList.map(currency => {
            const selected: boolean = settings.props.currency === currency

            return (
              <Button
                key={currency}
                variant={selected ? 'bezeled' : 'borderless'}
                size="small"
                onClick={() => settings.changeCurrency(currency)}
              >
                {currency}
              </Button>
            )
          })}
        </Flex>
      </Container>
    </TokenList>
  )
}
