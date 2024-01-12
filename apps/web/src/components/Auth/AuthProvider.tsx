import { useIdentity, useWalletContext } from '@lawallet/react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import React, { useLayoutEffect, useMemo } from 'react';
import SpinnerView from '../Loader/SpinnerView';
import { loadingMessages, useTranslation } from '@/context/TranslateContext';

// const unloggedRoutes: string[] = ['/', '/start', '/login', '/reset']

const protectedRoutes: string[] = [
  '/dashboard',
  '/transfer',
  '/deposit',
  '/scan',
  '/settings',
  '/transactions',
  '/card',
];

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    user: { identity },
  } = useWalletContext();

  const { lng } = useTranslation();

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isProtectedRoute = (path: string): boolean => {
    let isProtected: boolean = false;

    protectedRoutes.forEach((route) => {
      if (path.startsWith(route)) isProtected = true;
    });

    return isProtected;
  };

  useLayoutEffect(() => {
    if (identity.isReady) {
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
  }, [pathname, identity.isReady]);

  const hydrateApp = useMemo((): boolean => {
    if (!identity.isReady) return false;

    const protectedFlag: boolean = isProtectedRoute(pathname);
    if (identity.hexpub.length && protectedFlag) return true;
    if (!identity.hexpub && !protectedFlag) return true;

    return false;
  }, [identity.isReady, pathname]);

  return !hydrateApp ? <SpinnerView loadingText={loadingMessages[lng]['LOADING_ACCOUNT']} /> : children;
};

export default AuthProvider;
