import fics from '@ficsjs'
import resetCss from '@/styles/resetCss'

const Footer = () => fics({
  name: 'footer',
  isImmutable: true,
  html: ({ $template }) => $template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: [
    resetCss,
    { selector: 'footer', style: { padding: 'var(--md) 0' } },
    {
      selector: 'footer p',
      style: { fontSize: 'var(--sm)', color: '#fff', textAlign: 'center', lineHeight: '100%' }
    }
  ]
})

export default Footer
