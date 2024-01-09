import {
  type UserConfigProps,
  type AvailableCurrencies,
  defaultUserConfig
} from '../types/config.js'
import { parseContent } from '@lawallet/utils'
import * as React from 'react'

export type ConfigReturns = {
  props: UserConfigProps
  loading: boolean
  toggleHideBalance: () => void
  changeCurrency: (currency: AvailableCurrencies) => void
}

export const useConfiguration = (): ConfigReturns => {
  const [loading, setLoading] = React.useState<boolean>(true)
  const [props, setProps] = React.useState<UserConfigProps>(defaultUserConfig)

  const saveConfiguration = (newConfig: UserConfigProps) => {
    setProps(newConfig)
    localStorage.setItem('config', JSON.stringify(newConfig))
  }

  const toggleHideBalance = () =>
    saveConfiguration({
      ...props,
      hideBalance: !props.hideBalance
    })

  const changeCurrency = (currency: AvailableCurrencies) =>
    saveConfiguration({
      ...props,
      currency
    })
  const preloadConfig = () => {
    const storagedConfig: string | null = localStorage.getItem('config')
    if (!storagedConfig) {
      setLoading(false)
      return
    }

    const parsedConfig: UserConfigProps = parseContent(storagedConfig)
    setProps(parsedConfig)
    setLoading(false)
  }

  React.useEffect(() => {
    preloadConfig()
  }, [])

  return { props, loading, toggleHideBalance, changeCurrency }
}
