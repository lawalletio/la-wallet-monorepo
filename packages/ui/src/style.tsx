import { createGlobalStyle } from 'styled-components';

import { theme } from './theme';

export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'IAAB3-Mono';
    src: url('./fonts/IAAB3.woff2');
    weight: 400;
  }

  @font-face {
    font-family: 'SF PRO Text';
    src: url('./fonts/SF-Regular.woff2');
    font-weight: 400;
  }

  @font-face {
    font-family: 'SF PRO Text';
    src: url('./fonts/SF-Bold.woff2');
    font-weight: 700;
  }

  * {
    box-sizing: border-box;
    
    margin: 0;
    padding: 0;
  }

  html {
    overflow-x: hidden;

    font-size: 20px;
  }

  body {
    overflow-x: hidden;

    display: flex;
    flex-direction: column;
    min-width: 100vw;
    min-height: 100dvh;

    background: ${theme.colors.background};

    color: ${theme.colors.text};
    font-family: 'SF PRO Text';
    font-size: 1em;
    font-weight: 400;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: 'IAAB3-Mono';
  }

  ul {
    list-style: none;
  }

  a {
    text-decoration: none;
  }

  button {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  a,
  button,
  input {
    font-family: 'SF PRO Text';
  }
`;
