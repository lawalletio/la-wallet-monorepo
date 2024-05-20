import { STORAGE_IDENTITY_KEY, regexUserName } from '@/constants/constants';
import {
  buildCardActivationEvent,
  buildIdentityEvent,
  useConfig,
  useNostrContext,
  useWalletContext,
} from '@lawallet/react';
import { IdentityResponse, claimIdentity, existIdentity, requestCardActivation } from '@lawallet/react/actions';

import { useRouter } from '@/navigation';
import { NostrEvent } from '@nostr-dev-kit/ndk';
import { generatePrivateKey } from 'nostr-tools';
import { Dispatch, SetStateAction, useState } from 'react';
import useErrors, { IUseErrors } from './useErrors';

export interface AccountProps {
  nonce: string;
  card: string;
  name: string;
}

export type CreateIdentityProps = {
  nonce: string;
  name: string;
};

export type CreateIdentityReturns = {
  success: boolean;
  message: string;
  randomHexPKey?: string;
};

interface CreateIdentityParams extends AccountProps {
  isValidNonce: boolean;
  loading: boolean;
}

export type UseIdentityReturns = {
  loading: boolean;
  accountInfo: CreateIdentityParams;
  errors: IUseErrors;
  setAccountInfo: Dispatch<SetStateAction<CreateIdentityParams>>;
  handleChangeUsername: (username: string) => void;
  handleCreateIdentity: (props: AccountProps) => void;
};

let checkExistUsername: NodeJS.Timeout;

const defaultAccount: CreateIdentityParams = {
  nonce: '',
  card: '',
  name: '',
  isValidNonce: false,
  loading: true,
};

export const useCreateIdentity = (): UseIdentityReturns => {
  const {
    account: { identity },
  } = useWalletContext();

  const config = useConfig();
  const [loading, setLoading] = useState<boolean>(false);

  const { initializeSigner } = useNostrContext();
  const [accountInfo, setAccountInfo] = useState<CreateIdentityParams>(defaultAccount);

  const errors = useErrors();
  const router = useRouter();

  const validateUsername = (username: string) => {
    const invalidUsername = !regexUserName.test(username);

    if (invalidUsername) {
      errors.modifyError('INVALID_USERNAME');
      return false;
    }
    return true;
  };

  const checkIfExistName = (username: string) => {
    if (checkExistUsername) clearTimeout(checkExistUsername);

    checkExistUsername = setTimeout(async () => {
      const nameWasTaken = await existIdentity(username, config);

      setAccountInfo((prev) => {
        return { ...prev, loading: false };
      });

      if (nameWasTaken) {
        errors.modifyError('NAME_ALREADY_TAKEN');
        return false;
      }
    }, 300);
  };

  const handleChangeUsername = (username: string) => {
    errors.resetError();

    if (!username.length && accountInfo.name.length) {
      setAccountInfo({ ...accountInfo, name: '', loading: false });
      if (checkExistUsername) clearTimeout(checkExistUsername);
      return;
    }

    const validUsername: boolean = validateUsername(username);
    if (validUsername) {
      setAccountInfo({
        ...accountInfo,
        name: username.toLowerCase(),
        loading: true,
      });

      checkIfExistName(username);
    }
  };

  const createNostrAccount = async () => {
    setLoading(true);

    const randomHexPKey: string = generatePrivateKey();
    if (randomHexPKey) {
      identity.initializeFromPrivateKey(randomHexPKey);
      router.push('/dashboard');
      setLoading(false);
    }
  };

  const createIdentity = async ({ nonce, name }: CreateIdentityProps): Promise<CreateIdentityReturns> => {
    try {
      const randomHexPKey: string = generatePrivateKey();
      const initialized: boolean = await identity.initializeFromPrivateKey(randomHexPKey, name);

      if (!randomHexPKey || !initialized)
        return {
          success: false,
          message: 'ERROR_WITH_SIGNER',
        };

      const eventToSign: NostrEvent = buildIdentityEvent(nonce, name, identity.hexpub);
      const signedEvent: NostrEvent | undefined = await identity.signEvent(eventToSign);

      if (!signedEvent)
        return {
          success: false,
          message: 'ERROR_WITH_IDENTITY_EVENT',
        };

      const createdAccount: IdentityResponse = await claimIdentity(signedEvent, config);

      if (!createdAccount.success)
        return {
          success: false,
          message: createdAccount.reason!,
        };

      initializeSigner(identity.signer);
      await config.storage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify({ privateKey: randomHexPKey }));

      return {
        success: true,
        message: 'ok',
        randomHexPKey,
      };
    } catch {
      return {
        success: false,
        message: 'ERROR_ON_CREATE_ACCOUNT',
      };
    }
  };

  const handleCreateIdentity = (props: AccountProps) => {
    if (loading) return;
    const { nonce, name } = props;

    if (!nonce) {
      createNostrAccount();
      return;
    }

    if (!name.length) return errors.modifyError('EMPTY_NAME');
    if (name.length < 3) return errors.modifyError('MIN_LENGTH_NAME', { length: '3' });
    if (name.length > 15) return errors.modifyError('MAX_LENGTH_NAME', { length: '15' });

    if (!regexUserName.test(name)) return errors.modifyError('INVALID_USERNAME');

    setLoading(true);

    existIdentity(name, config)
      .then((nameWasTaken: boolean) => {
        if (nameWasTaken) return errors.modifyError('NAME_ALREADY_TAKEN');

        return createIdentity({ nonce, name }).then((response_identity: CreateIdentityReturns) => {
          const { success, randomHexPKey, message } = response_identity;

          if (success && randomHexPKey) {
            if (props.card) {
              buildCardActivationEvent(props.card, randomHexPKey, config)
                .then((cardEvent: NostrEvent) => {
                  requestCardActivation(cardEvent, config).then(() => {
                    router.push('/dashboard');
                  });
                })
                .catch(() => {
                  router.push('/dashboard');
                });
            } else {
              router.push('/dashboard');
            }
          } else {
            errors.modifyError(message);
          }
        });
      })
      .finally(() => setLoading(false));
  };
  return {
    accountInfo,
    setAccountInfo,
    handleCreateIdentity,
    handleChangeUsername,
    loading,
    errors,
  };
};
