import { baseConfig } from '../constants/constants.js';
import { type ConfigProps } from '../types/config.js';
import { type NostrEvent } from '@nostr-dev-kit/ndk';

export const broadcastEvent = async (event: NostrEvent, config: ConfigProps = baseConfig): Promise<boolean> => {
  return fetch(`${config.endpoints.gateway}/nostr/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
    .then((res) => res.status === 200 || res.status === 202)
    .catch(() => false);
};
