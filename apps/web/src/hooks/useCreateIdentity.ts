import { regexUserName } from '@/constants/constants';
import {
  IdentityResponse,
  claimIdentity,
  existIdentity,
  generateUserIdentity,
  requestCardActivation,
} from '@lawallet/react/actions';
import {
  useConfig,
  useWalletContext,
  SignEvent,
  buildCardActivationEvent,
  buildIdentityEvent,
  useNostrContext,
} from '@lawallet/react';

import { UserIdentity } from '@lawallet/react/types';
import { NostrEvent } from '@nostr-dev-kit/ndk';
import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';
import useErrors, { IUseErrors } from './useErrors';

export interface AccountProps {
  nonce: string;
  card: string;
  name: string;
}

interface CreateIdentityParams extends AccountProps {
  isValidNonce: boolean;
  loading: boolean;
}

export type CreateIdentityReturns = {
  success: boolean;
  message: string;
  info?: UserIdentity;
};

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
    user: { identity },
  } = useWalletContext();
  const config = useConfig();
  const { authWithPrivateKey } = useNostrContext();

  const [loading, setLoading] = useState<boolean>(false);

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

    const generatedIdentity: UserIdentity = await generateUserIdentity();
    if (generatedIdentity) {
      identity.initializeFromPrivateKey(generatedIdentity.privateKey);
      router.push('/dashboard');
      setLoading(false);
    }
  };

  const createIdentity = async ({ nonce, name }: AccountProps): Promise<CreateIdentityReturns> => {
    const generatedIdentity: UserIdentity = await generateUserIdentity(name);

    return authWithPrivateKey(generatedIdentity.privateKey)
      .then(async (tmpSigner) => {
        if (!tmpSigner)
          return {
            success: false,
            message: 'ERROR_WITH_SIGNER',
          };

        const identityEvent: NostrEvent | undefined = await SignEvent(
          tmpSigner,
          buildIdentityEvent(nonce, generatedIdentity),
        );

        if (!identityEvent)
          return {
            success: false,
            message: 'ERROR_WITH_IDENTITY_EVENT',
          };

        const createdAccount: IdentityResponse = await claimIdentity(identityEvent, config);
        if (!createdAccount.success)
          return {
            success: false,
            message: createdAccount.reason!,
          };

        return {
          success: true,
          message: 'ok',
          info: generatedIdentity,
        };
      })
      .catch(() => {
        return {
          success: false,
          message: 'ERROR_ON_CREATE_ACCOUNT',
        };
      });
  };

  const handleCreateIdentity = (props: AccountProps) => {
    if (loading) return;
    const { nonce, name } = props;

    if (!nonce) {
      createNostrAccount();
      return;
    }

    if (!name.length) return errors.modifyError('EMPTY_USERNAME');
    if (name.length < 3) return errors.modifyError('MIN_LENGTH_USERNAME');
    if (name.length > 15) return errors.modifyError('MAX_LENGTH_USERNAME');

    if (!regexUserName.test(name)) return errors.modifyError('INVALID_USERNAME');

    setLoading(true);

    existIdentity(name, config)
      .then((nameWasTaken: boolean) => {
        if (nameWasTaken) return errors.modifyError('NAME_ALREADY_TAKEN');

        return createIdentity(props).then((new_identity: CreateIdentityReturns) => {
          const { success, info, message } = new_identity;

          if (success && info) {
            identity.initializeCustomIdentity(info.privateKey, info.username);

            if (props.card) {
              buildCardActivationEvent(props.card, info.privateKey, config)
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
