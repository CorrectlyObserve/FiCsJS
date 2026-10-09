import type { FiCs } from 'ficsjs'
import { calc, cssVar, oklch, size, textSize } from 'ficsjs/style'
import { breakpoints, columnWidth, white } from '@/styles/theme'

const outline = `${cssVar('outline')} solid ${white()}` as const

export const documentCss: string = `
  :root {
    color-scheme: dark;

    --black: ${oklch('#010107')};
    --red: ${oklch('#d14344')};
    --gradation: linear-gradient(30deg, var(--red) 30%, ${oklch('#cb0078')});

    --outline: ${calc(`${size(1)} / 2`)};
    --border-width: ${calc(`${size(1)} / 4`)};
    --transition: 0.2s ease-out;
  }

  body {
    background: var(--black);
    margin: 0;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
`

export const globalCss: FiCs.GlobalCss = `
  * { padding: 0; margin: 0; box-sizing: border-box; }

  h2, p, button, label, legend, input, textarea, span { color: ${white()}; }
  h2, p, button { text-align: center; }
  p, label, legend, input, textarea { ${textSize('base')} }

  button, input, textarea {
    transition: ${cssVar('transition')};
    background: none;
    border: none;
    outline: none;
    border-radius: ${size(2)};

    &:not([disabled]):hover { background: ${white(0.1)}; cursor: pointer; }
    &:focus-visible { outline: ${outline}; }
  }

  h2 {
    ${textSize('xl')}
    margin-block-end: ${size(8)};

    @media (max-width: ${breakpoints.SM}) { margin-block-end: ${size(6)}; }
  }

  label:hover { cursor: pointer; }

  input, textarea {
    &::placeholder { color: ${white(0.5)}; } 

    max-width: ${columnWidth};
    padding-block: ${calc(`${size(3)} - ${cssVar('border-width')}`)};
    padding-inline: ${size(4)};
    border: ${cssVar('border-width')} solid ${white()};
  }

  a {
    transition: ${cssVar('transition')};
    border-radius: ${size(2)};

    &:hover { background: ${white(0.1)}; cursor: pointer; }
    &:focus-visible { color: inherit; outline: ${outline}; outline-offset: 0; }
    &:active { scale: 0.98; }
  }

  span[role="button"] { padding: ${size(4)}; }
`
