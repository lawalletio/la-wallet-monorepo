import { appTheme } from '../../config/themeConfig';
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
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

    background: ${appTheme.colors.background};

    color: ${appTheme.colors.text};
    font-size: 1em;
    font-weight: 400;
    font-family: var(--font-secondary);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-primary);
  }

  ul {
    list-style: none;
  }

  a {
    text-decoration: none;
  }

  a, 
  button {
    font-family: var(--font-secondary);
  }
`;

export default GlobalStyles;
