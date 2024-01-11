import { type NostrEvent } from '@nostr-dev-kit/ndk';
import { type CardConfigPayload, type CardDataPayload } from '../types/card.js';
import { type ConfigProps } from '../types/config.js';
import { baseConfig } from '../constants/constants.js';

export const requestCardActivation = async (event: NostrEvent, config: ConfigProps = baseConfig): Promise<boolean> => {
  return fetch(`${config.gatewayEndpoint}/card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
    .then((res) => res.status >= 200 && res.status < 300)
    .catch(() => false);
};

export const cardResetCaim = async (
  event: NostrEvent,
  config: ConfigProps = baseConfig,
): Promise<Record<'name' | 'error', string>> => {
  return fetch(`${config.gatewayEndpoint}/card/reset/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
    .then((res) => res.json())
    .catch(() => {
      return { error: 'ERROR_ON_RESET_ACCOUNT' };
    });
};

export type CardRequestResponse = CardConfigPayload | CardDataPayload | Record<'error', string>;

export const cardInfoRequest = async (
  type: string,
  event: NostrEvent,
  config: ConfigProps = baseConfig,
): Promise<CardRequestResponse> => {
  return fetch(`${config.gatewayEndpoint}/card/${type}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
    .then((res) => res.json())
    .catch(() => {
      return { error: 'UNEXPECTED_ERROR' };
    });
};

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
