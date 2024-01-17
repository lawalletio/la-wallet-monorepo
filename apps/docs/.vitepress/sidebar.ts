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
          { text: 'useActivity', link: '/react/api/hooks/useActivity' },
          { text: 'useCardConfig', link: '/react/api/hooks/useCardConfig' },
          { text: 'useTokenBalance', link: '/react/api/hooks/useTokenBalance' },
          { text: 'useSubscription', link: '/react/api/hooks/useSubscription' },
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
