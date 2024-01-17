import { AvailableLanguages } from '@lawallet/react/types';
import { useWalletContext } from '@lawallet/react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import React, { useLayoutEffect, useMemo } from 'react';
import SpinnerView from '../Loader/SpinnerView';
import { loadingMessages } from '@/context/TranslateContext';

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

const AuthProvider = ({ children, lng }: { children: React.ReactNode; lng: AvailableLanguages }) => {
  const {
    user: { identity },
  } = useWalletContext();

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
    if (identity.info.isReady) {
      const protectedFlag = isProtectedRoute(pathname);
      const userLogged: boolean = Boolean(identity.info.hexpub.length);
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
  }, [pathname, identity.info.isReady]);

  const hydrateApp = useMemo((): boolean => {
    if (!identity.info.isReady) return false;

    const protectedFlag: boolean = isProtectedRoute(pathname);
    if (identity.info.hexpub.length && protectedFlag) return true;
    if (!identity.info.hexpub && !protectedFlag) return true;

    return false;
  }, [identity.info.isReady, pathname]);

  return !hydrateApp ? <SpinnerView loadingText={loadingMessages[lng]['LOADING_ACCOUNT']} /> : children;
};

export default AuthProvider;
