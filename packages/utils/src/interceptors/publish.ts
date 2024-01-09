import { type ConfigProps } from '../types/config.js'
import defaultConfig from '../constants/defaultConfig.js'
import { type NostrEvent } from '@nostr-dev-kit/ndk'

export const broadcastEvent = async (
  event: NostrEvent,
  config: ConfigProps = defaultConfig
): Promise<boolean> => {
  return fetch(`${config.API_GATEWAY_ENDPOINT}/nostr/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })
    .then(res => res.status === 200 || res.status === 202)
    .catch(() => false)
}
