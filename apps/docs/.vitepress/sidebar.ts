import { DefaultTheme } from 'vitepress';

export function getSidebar() {
  return {
    '/react': [
      {
        text: 'Introduction',
        items: [{ text: 'Getting Started', link: '/react/getting-started' }],
      },
      {
        text: 'Configuration',
        items: [
          { text: 'createConfig', link: '/react/api/createConfig' },
          { text: 'createStorage', link: '/react/api/createStorage' },
          { text: 'LaWalletConfig', link: '/react/api/LaWalletConfig' },
        ],
      },
      {
        text: 'Hooks',
        items: [
          { text: 'useAccount', link: '/react/api/hooks/useAccount' },
          { text: 'useCards', link: '/react/api/hooks/useCards' },
          { text: 'useIdentity', link: '/react/api/hooks/useIdentity' },
          { text: 'useInvoice', link: '/react/api/hooks/useInvoice' },
          { text: 'useLNURL', link: '/react/api/hooks/useLNURL' },
          { text: 'useNostr', link: '/react/api/hooks/useNostr' },
          { text: 'useSubscription', link: '/react/api/hooks/useSubscription' },
          { text: 'useTokenBalance', link: '/react/api/hooks/useTokenBalance' },
          { text: 'useTransactions', link: '/react/api/hooks/useTransactions' },
          { text: 'useZap', link: '/react/api/hooks/useZap' },
        ],
      },
      {
        text: 'Glossary',
        items: [
          { text: 'Types', link: '/react/api/glossary/types' },
          { text: 'NDK', link: '/react/api/glossary/ndk' },
        ],
      },
    ],
  } satisfies DefaultTheme.Sidebar;
}
