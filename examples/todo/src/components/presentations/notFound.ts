import { fics } from 'ficsjs'
import button from '@/components/presentations/button'

export default fics<{}, { error404: string; btnText: string; click: () => void }>({
  name: 'not-found',
  inheritances: [
    { descendant: button, props: ({ $props: { btnText, click } }) => ({ btnText, click }) }
  ],
  html: ({ $props: { error404 }, $template }) => $template`<h2>404 ${error404}</h2>${button}`
})
