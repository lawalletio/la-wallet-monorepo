import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'never',
});

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|robots.txt|manifest.json|sw.js|workbox-*.js|_next/static|icons/|media/|cards/|fonts/).*)',
  ],
};
