import React from 'react';
import { DocsThemeConfig, useConfig } from 'nextra-theme-docs';
import Logo from './components/Logo';
import LaCryptaLogo from './components/LaCryptaLogo';

const config: DocsThemeConfig = {
  logo: <Logo />,
  chat: {
    link: 'https://discord.lacrypta.ar',
  },
  docsRepositoryBase: 'https://github.com/lacrypta/wallet-docs',
  footer: {
    text: (
      <div style={{ textAlign: 'center', margin: 'auto' }}>
        <div>powered by </div>
        <div style={{ marginTop: '8px' }}>
          <a target="_blank" href="https://lacrypta.ar">
            <LaCryptaLogo />
          </a>
        </div>
      </div>
    ),
  },
};

export default config;
