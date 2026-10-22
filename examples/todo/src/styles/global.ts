import type { FiCs } from 'ficsjs'
import {
  calc,
  color,
  flex,
  interactive,
  layout,
  radius,
  size,
  space,
  stroke,
  textSize
} from 'ficsjs/style'
import { columnWidth } from '@/styles/theme'

export const globalCss: FiCs.GlobalCss = `
  :root {
    color-scheme: dark;
    scroll-padding-block-start: ${calc(`${size(8 + 10)} + ${space('sm')}`)};
  }

  body {
    ${flex({ direction: 'column' })}
    min-height: 100dvh;
    background: ${color('bg')};
    color: ${color('text')};
    margin: 0;
  }

  * { padding: 0; margin: 0; box-sizing: border-box; }

  h2, p, button { text-align: center; }

  h2 {
    ${textSize('xl')}
    margin-block-end: ${space('lg')};

    @container not ${layout('expanded')} { margin-block-end: ${space('md+')}; }
  }

  p, label, legend, input, textarea { ${textSize('md')} }

  button, input, textarea {
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
`
