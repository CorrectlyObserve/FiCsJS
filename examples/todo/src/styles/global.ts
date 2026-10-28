import type { FiCs } from 'ficsjs'
import {
  calc,
  color,
  fill,
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
    ${fill('bg')}
    min-height: 100dvh;
  }

  * { padding: 0; margin: 0; box-sizing: border-box; }

  h2, p, button { text-align: center; }

  h2 {
    ${textSize('xl')}
    margin-block-end: ${space('lg')};

    @container not ${layout('expanded')} { margin-block-end: ${space('md')}; }
  }

  p, label, legend, input, textarea { ${textSize('md')} }

  button { border: none; }

  button, input, textarea {
    ${radius('sm')};
    background: none;
    color: ${color('text')};

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
