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
        link: '/react/api/hooks',
        items: [{ text: 'useTokenBalance', link: '/react/api/hooks/useTokenBalance' }],
      },
      {
        text: 'Glossary',
        link: '/react/api/glossary',
        items: [{ text: 'Types', link: '/react/api/glossary/types' }],
      },
    ],
  } satisfies DefaultTheme.Sidebar;
}
