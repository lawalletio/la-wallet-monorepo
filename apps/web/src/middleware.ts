import createMiddleware from 'next-intl/middleware';
import { defaultLocale, localePrefix, locales } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

export const config = {
  matcher: [
<<<<<<< HEAD
    '/((?!_next|favicon.ico|robots.txt|manifest.json|sw.js|workbox-*.js|_next/static|icons/|media/|cards/|fonts/|api/).*)',
=======
    '/((?!_next|api|favicon.ico|robots.txt|manifest.json|sw.js|workbox-*.js|_next/static|icons/|media/|cards/|plugins/|fonts/).*)',
>>>>>>> d797594130b69f3728d14fb6b25514f77dad27e1
  ],
};
