import { type NostrEvent } from '@nostr-dev-kit/ndk'
import defaultConfig from '../constants/defaultConfig.js'
import { type CardConfigPayload, type CardDataPayload } from '../types/card.js'
import { type ConfigProps } from '../types/config.js'

export const requestCardActivation = async (
  event: NostrEvent,
  config: ConfigProps = defaultConfig
): Promise<boolean> => {
  return fetch(`${config.API_GATEWAY_ENDPOINT}/card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })
    .then(res => res.status >= 200 && res.status < 300)
    .catch(() => false)
}

export const cardResetCaim = async (
  event: NostrEvent,
  config: ConfigProps = defaultConfig
): Promise<Record<'name' | 'error', string>> => {
  return fetch(`${config.API_GATEWAY_ENDPOINT}/card/reset/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })
    .then(res => res.json())
    .catch(() => {
      return { error: 'ERROR_ON_RESET_ACCOUNT' }
    })
}

export type CardRequestResponse =
  | CardConfigPayload
  | CardDataPayload
  | Record<'error', string>

export const cardInfoRequest = async (
  type: string,
  event: NostrEvent,
  config: ConfigProps = defaultConfig
): Promise<CardRequestResponse> => {
  return fetch(`${config.API_GATEWAY_ENDPOINT}/card/${type}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })
    .then(res => res.json())
    .catch(() => {
      return { error: 'UNEXPECTED_ERROR' }
    })
}

// export const buildAndBroadcastCardConfig = (
//   config: CardConfigPayload,
//   privateKey: string
// ) => {
//   buildCardConfigEvent(config, privateKey)
//     .then(configEvent => {
//       return broadcastEvent(configEvent)
//     })
//     .catch(() => {
//       return { error: 'UNEXPECTED_ERROR' }
//     })
// }
