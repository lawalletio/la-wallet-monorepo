import { defineConfig } from 'vitepress';
import { withTwoslash } from 'vitepress-plugin-shiki-twoslash';

import { getSidebar } from './sidebar';

// https://vitepress.dev/reference/site-config
export default withTwoslash(
  defineConfig({
    cleanUrls: true,
    description: 'Reactivity for LN apps',
    head: [
      [
        'meta',
        {
          name: 'keywords',
          content: 'react, lightning, typescript, react hooks, open source',
        },
      ],
      ['meta', { name: 'theme-color', content: '#646cff' }],
      // Open Graph
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:image', content: 'https://wagmi.sh/og.png' }],
      ['meta', { property: 'og:url', content: 'https://wagmi.sh' }],
    ],
    ignoreDeadLinks: false,
    lang: 'en-US',
    lastUpdated: true,
    markdown: {
      theme: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
    },
    themeConfig: {
      editLink: {
        pattern: 'https://github.com/wevm/wagmi/edit/main/docs/:path',
        text: 'Suggest changes to this page',
      },
      footer: {
        message: 'Released under the <a href="https://github.com/wevm/wagmi/blob/main/LICENSE">MIT License</a>.',
        copyright: 'Copyright © 2024-present',
      },
      logo: {
        light: '/logo-light.svg',
        dark: '/logo-dark.svg',
        alt: 'wagmi logo',
      },
      nav: [
        { text: 'React', link: '/react/getting-started' },
        // { text: 'Examples', link: '/examples/connect-wallet' },
      ],
      outline: [2, 3],
      search: {
        provider: 'local',
        options: {
          _render(src, env, md) {
            const html = md.render(src, env);
            if (env.frontmatter?.search === false) return '';
            if (env.relativePath.startsWith('shared')) return '';
            return html;
          },
        },
      },
      sidebar: getSidebar(),
      siteTitle: false,
      socialLinks: [
        {
          icon: 'github',
          link: 'https://github.com/lawalletio',
        },
        { icon: 'twitter', link: 'https://twitter.com/LaWalletOk' },
        { icon: 'discord', link: 'https://discord.lacrypta.ar' },
      ],
    },
    title: 'LaWallet Docs',
  }),
);
