import type { FiCs } from 'ficsjs'
import {
  calc,
  color,
  documentCss as ficsDocumentCss,
  flex,
  interactive,
  layout,
  motion,
  radius,
  space,
  stroke,
  textSize
} from 'ficsjs/style'
import { columnWidth, headerHeight } from '@/styles/theme'

export const documentCss: string = `
  :root {
    color-scheme: dark;
    scroll-padding-block-start: ${calc(`${headerHeight} + ${space('sm')}`)};
  }

  body {
    ${flex({ direction: 'column' })}
    min-height: 100dvh;
    background: ${color('bg')};
    color: ${color('text')};
    margin: 0;
  }
`

export const globalCss: FiCs.GlobalCss = `
  * { padding: 0; margin: 0; box-sizing: border-box; }

  h2, p, button { text-align: center; }

  h2 {
    ${textSize('xl')}
    margin-block-end: ${space('lg')};

    @container not ${layout('expanded')} { margin-block-end: ${space('md+')}; }
  }

  p, label, legend, input, textarea { ${textSize('md')} }

  button, input, textarea {
    transition: ${motion()};
    background: none;
    color: ${color('text')};
    border: none;
    border-radius: ${radius('sm')};

    &:focus-visible { outline-color: ${color('text')}; }
  }

  label:hover { cursor: pointer; }

  input, textarea {
    &::placeholder { color: ${color('text-muted')}; } 

    ${interactive({ hover: base => `${base} cursor: text;`, active: false })}
    max-width: ${columnWidth};
    padding-inline: ${space('md')};
    border: ${stroke('sm')} solid ${color('border')};
  }

  a {
    transition: ${cssVar('transition')};
    border-radius: ${size(2)};

    &:hover { background: ${white(0.1)}; cursor: pointer; }
    &:focus-visible { color: inherit; outline: ${outline}; outline-offset: 0; }
    &:active { scale: 0.98; }
  }
`
