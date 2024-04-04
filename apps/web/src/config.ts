import { type Pathnames } from 'next-intl/navigation';

export const locales = ['es', 'en'];

export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
} satisfies Pathnames<typeof locales>;

export const localePrefix = undefined;

export type AppPathnames = keyof typeof pathnames;
