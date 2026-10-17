import type { FiCs } from 'ficsjs'
import {
  calc,
  color,
  documentCss as ficsDocumentCss,
  flex,
  interactive,
  layout,
  motion,
  oklch,
  radius,
  space,
  stroke,
  tapSize,
  textSize
} from 'ficsjs/style'

export const documentCss: string = `
  :root {
    color-scheme: dark;
    scroll-padding-block-start: ${calc(`${headerHeight} + ${space('sm')}`)};

    --black: ${oklch('#010107')};
    --red: ${oklch('#d14344')};
    --gradation: linear-gradient(30deg, var(--red) 30%, ${oklch('#cb0078')});

    --outline: ${calc(`${size(1)} / 2`)};
    --border-width: ${calc(`${size(1)} / 4`)};
    --transition: 0.2s ease-out;
  }

  body {
    ${flex({ direction: 'column' })}
    min-height: 100dvh;
    background: var(--black);
    margin: 0;
  }
`

export const globalCss: FiCs.GlobalCss = `
  * { padding: 0; margin: 0; box-sizing: border-box; }

  h2, p, button { text-align: center; }
  p, label, legend, input, textarea { ${textSize('md')} }

  button, input, textarea {
    transition: ${motion()};
    background: none;
    border: none;
    outline: none;
    border-radius: ${size(2)};

    &:not([disabled]):hover { background: ${white(0.1)}; cursor: pointer; }
    &:focus-visible { outline: ${outline}; }
  }

  h2 {
    ${textSize('xl')}
    margin-block-end: ${space('lg')};

    @container not ${layout('expanded')} { margin-block-end: ${space('md+')}; }
  }

  label:hover { cursor: pointer; }

  input, textarea {
    &::placeholder { color: ${white(0.5)}; } 

    ${interactive({ hover: base => `${base} cursor: text;`, active: false })}
    max-width: ${columnWidth};
    padding-inline: ${space('md')};
  }

  a {
    transition: ${cssVar('transition')};
    border-radius: ${size(2)};

    &:hover { background: ${white(0.1)}; cursor: pointer; }
    &:focus-visible { color: inherit; outline: ${outline}; outline-offset: 0; }
    &:active { scale: 0.98; }
  }
`
