import { STORAGE_IDENTITY_KEY } from '@/constants/constants';
import { usePathname, useRouter } from '@/navigation';
import { parseContent, useConfig, useNostrContext, useWalletContext } from '@lawallet/react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo } from 'react';
import SpinnerView from '../Spinner/SpinnerView';

// const unloggedRoutes: string[] = ['/', '/start', '/login', '/reset']
const protectedRoutes: string[] = ['/dashboard', '/transfer', '/deposit', '/scan', '/settings', '/transactions'];

export type StoragedIdentityInfo = {
  username: string;
  hexpub: string;
  privateKey: string;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    account: { identity },
  } = useWalletContext();

  const { initializeSigner } = useNostrContext();

  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const router = useRouter();
  const config = useConfig();
  const pathname = usePathname();
  const params = useSearchParams();

  const isProtectedRoute = (path: string): boolean => {
    let isProtected: boolean = false;

    protectedRoutes.forEach((route) => {
      if (path.startsWith(route)) isProtected = true;
    });

    return isProtected;
  };

  const authenticate = async (privateKey: string) => {
    const initialized: boolean = await identity.initializeFromPrivateKey(privateKey);
    if (initialized) initializeSigner(identity.signer);
    setIsLoading(false);

    return initialized;
  };

  const loadIdentityFromStorage = async () => {
    try {
      // If you have the identity saved in IndexedDB, we load from here.
      const storageIdentity = await config.storage.getItem(STORAGE_IDENTITY_KEY);

      if (storageIdentity) {
        const parsedIdentity: StoragedIdentityInfo[] = parseContent(storageIdentity as string);
        const auth: boolean = await authenticate(parsedIdentity[0]?.privateKey);
        return auth;
      } else {
        // ******************************************
        // PATCH: This code is used to facilitate the migration from localStorage to IndexedDB
        // Date: 20/05/2024
        // Remove this code after migrating the identity provider.
        // ******************************************
        const localStorageKey = localStorage.getItem(STORAGE_IDENTITY_KEY);
        if (!localStorageKey) {
          identity.reset();
          setIsLoading(false);
          return false;
        }

        const parsedIdentity: StoragedIdentityInfo = parseContent(localStorageKey as string);
        const auth: boolean = await authenticate(parsedIdentity.privateKey);

        if (auth) {
          const IdentityToSave: StoragedIdentityInfo[] = [
            {
              username: parsedIdentity?.username ?? '',
              hexpub: parsedIdentity?.hexpub ?? '',
              privateKey: parsedIdentity.privateKey,
            },
          ];

          await config.storage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(IdentityToSave));
        }
        return auth;
        // ******************************************
        // After removing the patch, leave only this lines:
        // identity.reset();
        // setIsLoading(false);
        // return false;
        // ******************************************
      }
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    loadIdentityFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const protectedFlag = isProtectedRoute(pathname);
      const userLogged: boolean = Boolean(identity.hexpub.length);
      const nonce: string = params.get('i') || '';
      const card: string = params.get('c') || '';

      switch (true) {
        case !userLogged && pathname == '/' && !nonce:
          router.push('/');
          break;

        case !userLogged && protectedFlag:
          router.push('/');
          break;

        case userLogged && !protectedFlag:
          card ? router.push(`/settings/cards?c=${card}`) : router.push('/dashboard');
          break;
      }
    }
  }, [pathname, isLoading]);

  const hydrateApp = useMemo((): boolean => {
    if (isLoading) return false;

    const protectedFlag: boolean = isProtectedRoute(pathname);
    if (identity.hexpub.length && protectedFlag) return true;
    if (!identity.hexpub && !protectedFlag) return true;

    return false;
  }, [isLoading, pathname]);

  return !hydrateApp ? <SpinnerView /> : children;
};

export default AuthProvider;
