import { type Pathnames } from 'next-intl/navigation';

export const locales = ['es', 'en'];

export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/deposit': '/deposit',
  '/login': '/login',
  '/reset': '/reset',
  '/scan': '/scan',
  '/settings': '/settings',
  '/settings/cards': '/settings/cards',
  '/settings/cards/donation': '/settings/cards/donation',
  '/settings/cards/[uuid]': '/settings/cards/[uuid]',
  '/settings/recovery': '/settings/recovery',
  '/signup': '/signup',
  '/start': '/start',
  '/transactions': '/transactions',
  '/transfer': '/transfer',
  '/transfer/invoice/[bolt11]': '/transfer/invoice/[bolt11]',
  '/transfer/lnurl': '/transfer/lnurl',
  '/transfer/lnurl/summary': '/transfer/lnurl/summary',
} satisfies Pathnames<typeof locales>;

export const localePrefix = undefined;

export type AppPathnames = keyof typeof pathnames;
