import {
  color,
  fill,
  flex,
  interactive,
  layout,
  radius,
  size,
  space,
  stroke,
  tapSize,
  textSize
} from 'ficsjs/style'

export default `
  :root {
    color-scheme: light dark;
    &[data-theme='light'] { color-scheme: light; }
    &[data-theme='dark'] { color-scheme: dark; }
    
    --width: ${size(80)};
    --max-width: ${size(160)};
    scroll-padding-bottom: calc(${space('xl')} + ${tapSize()} + ${space('sm')});
  }

  *, *::before, *::after { padding: 0; margin: 0; box-sizing: border-box; }

  body {
    ${flex({ direction: 'column' })}
    height: 100dvh;
    ${fill('bg')}
    ${textSize('md')};
    font-family: 'Times New Roman', serif;
    padding-inline: ${space('lg')};
    overscroll-behavior-x: none;

    @container not ${layout('expanded')} { padding-inline: ${space('md-')}; }

    & > main {
      ${flex({ direction: 'column' })}
      flex-grow: 1;
      padding-block: ${space('lg')};

      @container ${layout('compact')} { padding-block: ${space('md')}; }

      &:has(> .chat) { min-height: 0; }

      > p { margin-block-end: ${space('md')}; text-align: center; }
    }

    & > footer {
      ${textSize('sm')}
      text-align: center;
      padding-block-end: ${space('md')};
    }
  }

  h2, h3 { text-align: center; }

  h2 {
    ${textSize('xl')}
    margin-block-end: ${space('lg')};

    @container not ${layout('expanded')} { margin-block-end: ${space('md')}; }
  }

  h3 { ${textSize('lg')}; }

  button {
    ${flex({ inline: true, center: 'xy' })};
    ${textSize('md', true)};
    ${radius('sm')};
    ${interactive()};
    min-width: ${tapSize()};
    min-height: ${tapSize()};
    background: transparent;
    color: ${color('text')};
    font: inherit;
    border: none;
  }

  p, label, textarea { ${textSize('md')} }

  small { ${textSize('sm')} }

  form, section { ${flex({ center: 'y', direction: 'column', gap: space('md') })} }

  fieldset { border: 0; }

  input, textarea, select {
    ${fill('bg-sunken')};
    ${radius('sm')};
    width: 100%;
    min-height: ${tapSize()};
    padding-inline: ${space('md')};
    border: ${stroke('sm')} solid ${color('border')};
    font: inherit;

    &::placeholder { color: ${color('text-muted')}; }
  }

  input, textarea { ${interactive({ hover: base => `${base} cursor: text;`, active: false })} }

  input, select { ${textSize('md', true)} }
`
