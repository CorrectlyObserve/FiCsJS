import { configGlobalCss, type FiCs } from 'ficsjs'
import { cssVar, flexCenter, size, textSize } from 'ficsjs/style'
import { black } from '@/utils/color'
import { oklch } from 'ficsjs/style'

const globalCss: FiCs.GlobalCss = `
  :root { color-scheme: dark; --transition: 0.2s ease-out; }
  * { padding: 0; margin: 0; box-sizing: border-box; }
  body { min-height: 100dvh; background: ${black}; color: #fff; }
  main { padding-block: ${size(8)}; padding-inline: ${size(4)}; }

  button, select, a {
    min-height: ${size(11)};
    color: inherit;
    padding-inline: ${size(2)};
    border-radius: ${size(2)};
    transition: ${cssVar('--transition')};
    &:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
  }

  p, select, li { ${textSize('base')} }

  ul {
    list-style: none;
    padding-inline-start: 0;

    li {
      position: relative;
      padding-inline-start: ${size(3)}; 

      &::before {
        content: "•";
        position: absolute;
        left: 0;
      }
    }
  }

  a {
    ${flexCenter('y', { inline: true })}
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: ${size(1)};
    line-height: inherit;
    &:visited { color: inherit; }
    &:hover { background: ${oklch(black, { darker: 0.05 })}; cursor: pointer; }
    &:hover, &:focus-visible { color: #8ac6ff; }
  }
`

export default configGlobalCss(globalCss)
